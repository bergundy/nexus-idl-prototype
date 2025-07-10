import arg from "arg";
import { quicktype, InputData } from "quicktype-core";
import {
  Generator,
  SUPPORTED_LANGUAGES,
  type GeneratedCode,
  type SupportedLanguage,
} from "./src/generator";
import { SchemaLoader } from "./src/loader";
import { loadPlugin, type Plugin } from "./src/plugin";
import { SchemaStore } from "./src/schemastore";

async function main() {
  const args = arg({
    "--help": Boolean,
    "-h": "--help",
    "--lang": String,
    "--plugin": [String],
  });
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
      for (const line of code.imports) {
        console.log(line);
      }
    }
    console.log();
  }

  for (const line of jsonSchemaLines) {
    console.log(line);
  }

  for (const code of nexusGeneratedCode) {
    console.log();
    for (const line of code.body) {
      console.log(line);
    }
  }
}

try {
  await main();
} catch (error) {
  if (process.env.NEXUS_IDL_DEBUG) {
    console.error(error);
  } else {
    console.error(`${error}`);
  }
  process.exit(1);
}
