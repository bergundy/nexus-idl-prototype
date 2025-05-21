import arg from "arg";
import { quicktype, InputData } from "quicktype-core";
import {
  generate,
  SUPPORTED_LANGUAGES,
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
    console.error("Error: --lang option is required.");
    process.exit(1);
  }

  if (!SUPPORTED_LANGUAGES.includes(args["--lang"] as SupportedLanguage)) {
    console.error(
      `Error: Unsupported language: ${args["--lang"]}, supported languages: ${SUPPORTED_LANGUAGES.join(", ")}`
    );
    process.exit(1);
  }

  if (!args._ || args._.length === 0) {
    console.error("Error: At least one schema argument must be provided.");
    process.exit(1);
  }

  const lang = args["--lang"] as SupportedLanguage;
  const schemaFiles = args._;

  console.log("Language:", lang);
  console.log("Schemas:", schemaFiles);

  const inputData = new InputData();
  const loader = await SchemaLoader.load(schemaFiles);

  inputData.addInput(loader.jsonSchemaInput);

  const { lines } = await quicktype({
    inputData, // This will contain all JSON schemas
    lang,
    // It's often good to set fixedTopLevels to true when providing multiple files
    // to ensure each schema file produces its own top-level type.
    fixedTopLevels: true,
  });

  console.log("\nQuicktype Generated Code (from JSON Schemas):\n");
  console.log(lines.join("\n"));

  for (const schema of loader.nexusSchemas) {
    const lines = await generate(schema, lang);
    console.log(lines.join("\n"));
  }
}

await main();
