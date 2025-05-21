import arg from "arg";
import {
  quicktype,
  InputData,
  JSONSchemaInput,
  FetchingJSONSchemaStore,
} from "quicktype-core";
import * as fs from "node:fs/promises";
import * as path from "node:path";

async function main() {
  const args = arg({
    "--help": Boolean,
    "-h": "--help",
    "--lang": String,
    "--schema": [String],
  });

  if (args["--help"]) {
    console.log(
      "Usage: nexus-idl --lang <language> --schema <schema_path> [--schema <schema_path>...]"
    );
    process.exit(0);
  }

  if (!args["--lang"]) {
    console.error("Error: --lang option is required.");
    process.exit(1);
  }

  if (!args["--schema"] || args["--schema"].length === 0) {
    console.error("Error: At least one --schema option must be provided.");
    process.exit(1);
  }

  const lang = args["--lang"];
  const schemaFiles = args["--schema"];

  console.log("Language:", lang);
  console.log("Schemas:", schemaFiles);

  const inputData = new InputData();

  for (const schemaFile of schemaFiles) {
    const schemaContent = await fs.readFile(schemaFile, "utf-8");
    const schemaInput = new JSONSchemaInput(new FetchingJSONSchemaStore());
    // Determine the name for the type from the file name
    const typeName = path.basename(schemaFile, path.extname(schemaFile));
    await schemaInput.addSource({ name: typeName, schema: schemaContent });
    inputData.addInput(schemaInput);
  }

  const { lines } = await quicktype({
    inputData,
    lang: lang as any,
  });

  console.log("\nGenerated Code:\n");
  console.log(lines.join("\n"));
}

await main();
