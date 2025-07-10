import path from "path";
import type { FetchingJSONSchemaStore } from "quicktype-core";
import { Schema } from "../schema";
import type { GeneratedCode } from "./types";

export abstract class BaseGenerator {
  constructor(
    protected readonly schemaStore: FetchingJSONSchemaStore,
    protected readonly path: string,
    protected readonly schema: typeof Schema.infer
  ) {}

  public abstract generate(): Promise<GeneratedCode>;

  protected async getType(
    service: string,
    operation: string,
    t?: { $ref: string }
  ): Promise<string> {
    if (!t) {
      return this.getVoidType();
    }

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

    return schema.title;
  }

  protected abstract getVoidType(): string;
}
