import path from "node:path";
import type { FetchingJSONSchemaStore } from "quicktype-core";
import { TypeSchema } from "./schema";
import { type } from "arktype";

export class SchemaStore {
  constructor(
    protected readonly schemaStore: FetchingJSONSchemaStore,
    protected readonly path: string
  ) {}

  public async resolveRef(
    service: string,
    operation: string,
    t: { $ref: string }
  ): Promise<typeof TypeSchema.infer> {
    const schemaPath = t.$ref.startsWith("#")
      ? path.resolve(this.path)
      : path.isAbsolute(t.$ref)
        ? t.$ref
        : path.resolve(path.dirname(this.path), t.$ref);

    let schema = await this.schemaStore.fetch(schemaPath);
    if (schema == null) {
      throw new Error(
        `Could not find schema ${t.$ref} for service ${service}, operation ${operation}`
      );
    }

    if (t.$ref.startsWith("#")) {
      const parts = t.$ref.slice(1).split("/");
      for (const part of parts) {
        schema = schema[part as keyof typeof schema];
        if (schema == null) {
          throw new Error(
            `Could not find resolve schema reference href ${t.$ref} for service ${service}, operation ${operation}`
          );
        }
      }
    }

    if (typeof schema !== "object" || typeof schema.title !== "string") {
      throw new Error(
        `Invalid schema ${t.$ref} for service ${service}, operation ${operation}, missing "title" property`
      );
    }

    // Default to object type
    const typeSchema = TypeSchema({ type: "object", ...schema });
    if (typeSchema instanceof type.errors) {
      throw new Error(`Invalid type schema: ${typeSchema.summary}`);
    }
    return typeSchema;
  }
}
