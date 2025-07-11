import arg from "arg";
import { stdout } from "bun";
import { quicktype, InputData } from "quicktype-core";
import {
  Generator,
  SUPPORTED_LANGUAGES,
  type GeneratedCode,
  type SupportedLanguage,
} from "./generator";
import { SchemaLoader } from "./loader";
import { loadPlugin, type Plugin } from "./plugin";
import { SchemaStore } from "./schemastore";

export interface Writer {
  write(line: string): Promise<number>;
}

export async function main(argv: string[], output: Writer = stdout) {
  async function writeln(line?: string) {
    await output.write(line ? line + "\n" : "\n");
  }

  const args = arg(
    {
      "--help": Boolean,
      "-h": "--help",
      "--lang": String,
      "--plugin": [String],
    },
    {
      argv,
    }
  );
  if (args["--help"]) {
    console.log(
      "Usage: nexus-idl --lang <language> <schema_path> [<schema_path>...]"
    );
    process.exit(0);
  }

  if (!args["--lang"]) {
    throw new Error("--lang option is required.");
  }

  if (!SUPPORTED_LANGUAGES.includes(args["--lang"] as SupportedLanguage)) {
    throw new Error(
      `Unsupported language: ${args["--lang"]}, supported languages: ${SUPPORTED_LANGUAGES.join(", ")}`
    );
  }

  if (!args._ || args._.length === 0) {
    throw new Error("At least one schema argument must be provided");
  }

  const plugins: Plugin[] = await Promise.all(
    (args?.["--plugin"] ?? []).map(loadPlugin)
  );
  // TODO: add logger and log plugins loaded

  const lang = args["--lang"] as SupportedLanguage;
  const schemaFiles = args._;

  const inputData = new InputData();
  const loader = await SchemaLoader.load(schemaFiles);

  inputData.addInput(loader.jsonSchemaInput);

  const { lines: jsonSchemaLines } = await quicktype({
    inputData,
    lang,
    leadingComments: [],
    indentation: "  ",
    rendererOptions: {
      "just-types": true,
      "pydantic-base-model": true,
    },
  });

  const nexusGeneratedCode: GeneratedCode[] = await Promise.all(
    loader.nexusSchemas.flatMap(({ schema, path }) => {
      const schemaStore = new SchemaStore(loader.schemaStore, path);
      return [new Generator(schemaStore, schema, lang).generate()].concat(
        plugins.map((plugin) => plugin.generate(schemaStore, schema, lang))
      );
    })
  );

  if (nexusGeneratedCode.length > 0) {
    for (const code of nexusGeneratedCode) {
      if (code.headers && code.headers.length > 0) {
        for (const line of code.headers) {
          await writeln(line);
        }
        await writeln();
      }
    }
    for (const code of nexusGeneratedCode) {
      for (const line of code.imports) {
        await writeln(line);
      }
    }
    await writeln();
  }

  for (const line of jsonSchemaLines) {
    await writeln(line);
  }

  for (const code of nexusGeneratedCode) {
    await writeln();
    for (const line of code.body) {
      await writeln(line);
    }
  }
}
