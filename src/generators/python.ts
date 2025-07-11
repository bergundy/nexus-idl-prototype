import type { GeneratedCode } from "./types";
import { SchemaStore } from "../schemastore";
import { wrapDocstring } from "./utils";
import type { Schema } from "../schema";

export class PythonGenerator {
  public constructor(
    protected readonly schemaStore: SchemaStore,
    protected readonly schema: typeof Schema.infer
  ) {}

  public async generate(): Promise<GeneratedCode> {
    const imports: string[] = [
      "from typing import Any, Dict",
      "import nexusrpc",
    ];
    const body: string[] = [];

    for (const service of this.schema.services) {
      // Add service docstring
      const serviceName = service.name || service.identifier;
      const serviceDescription =
        service.description || `Service for ${serviceName}.`;

      // Add service definition comment
      body.push(`@nexusrpc.service`);
      body.push(`class ${toPythonClassName(service.identifier)}:`);
      const serviceDocLines = wrapDocstring(serviceDescription, {
        header: '    """',
        trailer: '    """',
        prefix: "   ",
        maxLength: 120,
      });
      serviceDocLines.forEach((line) => body.push(line));
      body.push("");

      // Generate operations
      for (const operation of service.operations) {
        const operationName = operation.name || operation.identifier;
        const operationDescription =
          operation.description || `Operation for ${operationName}.`;

        const [inputType, outputType] = await Promise.all([
          toPythonType(
            this.schemaStore,
            service.identifier,
            operation.identifier,
            operation.input
          ),
          toPythonType(
            this.schemaStore,
            service.identifier,
            operation.identifier,
            operation.output
          ),
        ]);

        // Add operation docstring

        body.push(
          `    ${toPythonMethodName(operation.identifier)}: nexusrpc.Operation[${inputType}, ${outputType}] = nexusrpc.Operation(name="${operationName}")`
        );
        const operationDocLines = wrapDocstring(operationDescription, {
          header: '    """',
          trailer: '    """',
          prefix: "   ",
          maxLength: 120,
        });
        operationDocLines.forEach((line) => body.push(line));
        body.push("");
      }

      body.push("");
    }

    return { imports, body };
  }
}

export async function toPythonType(
  store: SchemaStore,
  service: string,
  operation: string,
  io?: { $ref: string }
): Promise<string> {
  if (!io) {
    return "None";
  }
  const type = await store.resolveRef(service, operation, io);
  return type.title;
}

function toPythonClassName(identifier: string): string {
  // Convert to PascalCase for class names
  return identifier
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

function toPythonMethodName(identifier: string): string {
  // Convert to snake_case for method names
  return identifier
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "");
}
