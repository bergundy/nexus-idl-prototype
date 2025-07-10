import path from "path";
import type { FetchingJSONSchemaStore } from "quicktype-core";
import { Schema } from "../schema";
import type { GeneratedCode } from "./types";

export class GoGenerator {
  constructor(
    private readonly schemaStore: FetchingJSONSchemaStore,
    private readonly path: string,
    private readonly schema: typeof Schema.infer
  ) {}

  public async generate(): Promise<GeneratedCode> {
    const imports: string[] = ['import "github.com/nexus-rpc/sdk-go/nexus"'];
    const body: string[] = [];

    // Generate string constants for service names
    body.push("// Service name constants");
    for (const service of this.schema.services) {
      const serviceName = service.name || service.identifier;
      body.push(
        `const ${this.toGoConstant(service.identifier)}Service = "${serviceName}"`
      );
    }
    body.push("");

    // Generate string constants for operation names
    body.push("// Operation name constants");
    for (const service of this.schema.services) {
      for (const operation of service.operations) {
        const operationName = operation.name || operation.identifier;
        const constantName = this.toGoConstant(
          `${service.identifier}_${operation.identifier}`
        );
        body.push(`const ${constantName}OperationName = "${operationName}"`);
      }
    }
    body.push("");

    // Generate OperationReference variables
    body.push("// Operation references");
    for (const service of this.schema.services) {
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

        const constantName = this.toGoConstant(
          `${service.identifier}_${operation.identifier}`
        );

        body.push(
          `var ${constantName}Operation = nexus.NewOperationReference[${inputType}, ${outputType}](${constantName}OperationName)`
        );
      }
    }

    return { imports, body };
  }

  private async getType(
    service: string,
    operation: string,
    t?: { $ref: string }
  ): Promise<string> {
    if (!t) {
      return "any";
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

  private toGoConstant(name: string): string {
    // Convert to PascalCase for Go constants
    return name
      .split(/[_-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join("");
  }
}
