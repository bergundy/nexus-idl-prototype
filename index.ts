import arg from "arg";
import { quicktype, InputData } from "quicktype-core";
import {
  generate,
  SUPPORTED_LANGUAGES,
  type GeneratedCode,
  type SupportedLanguage,
} from "./src/generator";
import { SchemaLoader } from "./src/loader";

async function main() {
  const args = arg({
    "--help": Boolean,
    "-h": "--help",
    "--lang": String,
    // Allow multiple schema arguments using ... which arg handles as _.
    // We've already updated the logic to use args._ for schemaFiles
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
    throw new Error("At least one schema argument must be provided.");
  }

  const lang = args["--lang"] as SupportedLanguage;
  const schemaFiles = args._;

  const inputData = new InputData();
  const loader = await SchemaLoader.load(schemaFiles);

  inputData.addInput(loader.jsonSchemaInput);

  const { lines: jsonSchemaLines } = await quicktype({
    inputData,
    lang,
    leadingComments: [],
  });

  const nexusGeneratedCode: GeneratedCode[] = loader.nexusSchemas.map(
    (schema) => generate(schema, lang)
  );

  if (nexusGeneratedCode.length > 0) {
    for (const line of nexusGeneratedCode[0].imports) {
      console.log(line);
    }
  }

  for (const line of jsonSchemaLines) {
    console.log(line);
  }

  for (const code of nexusGeneratedCode) {
    for (const line of code.body) {
      console.log(line);
    }
  }
}

try {
  await main();
} catch (error) {
  console.error(`${error}`);
  process.exit(1);
}
