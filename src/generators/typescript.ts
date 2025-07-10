import path from "path";
import type { FetchingJSONSchemaStore } from "quicktype-core";
import { Schema } from "../schema";
import type { GeneratedCode } from "./types";

export class TypeScriptGenerator {
  constructor(
    private readonly schemaStore: FetchingJSONSchemaStore,
    private readonly path: string,
    private readonly schema: typeof Schema.infer
  ) {}

  public async generate(): Promise<GeneratedCode> {
    const imports: string[] = ['import * as nexus from "nexus-rpc"'];
    const body: string[] = [];
    for (const service of this.schema.services) {
      body.push(
        `export const ${service.identifier} = nexus.service("${(
          service.name || service.identifier
        ).replaceAll('"', '\"')}", {`
      );
      for (const operation of service.operations) {
        const [inputType, outputType] = await Promise.all([
          this.getType(
            service.identifier,
            operation.identifier,
            operation.input
          ),
          this.getType(
            service.identifier,
            operation.identifier,
            operation.output
          ),
        ]);
        body.push(
          `  ${operation.identifier}: nexus.operation<${inputType}, ${outputType}>({`
        );
        body.push(
          `    name: "${(operation.name || operation.identifier).replaceAll(
            '"',
            '\"'
          )}",`
        );
        body.push(`  }),`);
      }
      body.push(`});`);
    }
    return { imports, body };
  }

  private async getType(
    service: string,
    operation: string,
    t?: { $ref: string }
  ) {
    if (!t) {
      return "void";
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
}
