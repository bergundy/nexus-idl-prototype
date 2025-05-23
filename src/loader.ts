import { type } from "arktype";
import { JSONSchemaInput, FetchingJSONSchemaStore } from "quicktype-core";
import fs from "fs/promises";
import path from "path";
import { Schema, SCHEMA_URL } from "./schema";

export class SchemaLoader {
  public readonly schemaStore = new FetchingJSONSchemaStore();
  public readonly jsonSchemaInput = new JSONSchemaInput(this.schemaStore);
  public readonly nexusSchemas: {
    schema: typeof Schema.infer;
    path: string;
  }[] = [];

  public static async load(schemaFiles: string[]) {
    const loader = new this(schemaFiles);
    await Promise.all(schemaFiles.map(loader.loadSchema.bind(loader)));
    return loader;
  }

  private constructor(private readonly schemaFiles: string[]) {}

  private async loadSchema(schemaFile: string) {
    const schemaContent = await fs.readFile(schemaFile, "utf-8");
    const schemaUntyped = JSON.parse(schemaContent);

    if (schemaUntyped.$schema === SCHEMA_URL) {
      const schema = Schema(schemaUntyped);
      if (schema instanceof type.errors) {
        throw new Error(
          `Nexus schema validation error in ${schemaFile}: ${schema.summary}`
        );
      }
      this.nexusSchemas.push({ schema, path: schemaFile });
      // If there are no definitions, we can skip the rest of the logic.
      if (!schemaUntyped.definitions) {
        return;
      }
    }
    // Check for a 'definitions' block, common in combined schemas like models.json
    if (
      schemaUntyped.definitions &&
      typeof schemaUntyped.definitions === "object" &&
      schemaUntyped.definitions !== null &&
      !Array.isArray(schemaUntyped.definitions)
    ) {
      for (const [defName, definitionValue] of Object.entries(
        schemaUntyped.definitions
      )) {
        // Ensure definitionValue is an object before treating it as a schema
        if (typeof definitionValue !== "object" || definitionValue === null) {
          throw new Error(
            `Skipping non-object definition '${defName}' in ${schemaFile}`
          );
        }
        const definitionUntyped = definitionValue as Record<string, any>;
        if (definitionUntyped.$ref) {
          definitionUntyped.$ref = definitionUntyped.$ref.replace(
            "#/definitions/",
            "./"
          );
        }

        // Assume it's a standard JSON schema definition
        const definitionString = JSON.stringify(definitionUntyped);
        await this.jsonSchemaInput.addSource({
          name: defName, // Use the definition key as the name
          schema: definitionString,
          // URI pointing to the definition within the file for reference resolution
          // uris: [`#/definitions/${defName}`],
          // uris: [path.resolve(schemaFile) + `#/definitions/${defName}`],
          uris: [path.resolve(schemaFile) + `/definitions/${defName}`],
        });
      }
    } else {
      // Original logic for single-schema files (or files not using 'definitions' for schemas)
      const topLevelName = path.basename(schemaFile, path.extname(schemaFile));
      // Assume it's a standard JSON schema
      await this.jsonSchemaInput.addSource({
        name: topLevelName,
        schema: schemaContent, // Original full content
        uris: [path.resolve(schemaFile)],
      });
    }
  }
}
