import { type } from "arktype";
import { JSONSchemaInput, FetchingJSONSchemaStore } from "quicktype-core";
import fs from "fs/promises";
import path from "path";
import { Schema, SCHEMA_URL } from "./schema";

export class SchemaLoader {
  public readonly jsonSchemaInput = new JSONSchemaInput(
    new FetchingJSONSchemaStore()
  );
  public readonly nexusSchemas: (typeof Schema.infer)[] = [];

  public static async load(schemaFiles: string[]) {
    const loader = new this(schemaFiles);
    await Promise.all(schemaFiles.map(loader.loadSchema.bind(loader)));
    return loader;
  }

  private constructor(private readonly schemaFiles: string[]) {}

  private async loadSchema(schemaFile: string) {
    const schemaContent = await fs.readFile(schemaFile, "utf-8");
    const schemaUntyped = JSON.parse(schemaContent);
    const topLevelName = path.basename(schemaFile, path.extname(schemaFile));

    if (schemaUntyped.$schema === SCHEMA_URL) {
      const schema = Schema(schemaUntyped);
      if (schema instanceof type.errors) {
        throw new Error(
          `Nexus schema validation error in ${schemaFile}: ${schema.summary}`
        );
      }
      this.nexusSchemas.push(schema);
    } else {
      // Assume it's a standard JSON schema
      await this.jsonSchemaInput.addSource({
        name: topLevelName,
        schema: schemaContent,
        uris: [path.resolve(schemaFile)], // Provide absolute URI to help resolver
      });
    }
  }
}
