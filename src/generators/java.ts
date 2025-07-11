import type { GeneratedCode } from "./types";
import { SchemaStore } from "../schemastore";
import { wrapDocstring } from "./utils";
import type { Schema } from "../schema";

export class JavaGenerator {
  public constructor(
    protected readonly schemaStore: SchemaStore,
    protected readonly schema: typeof Schema.infer
  ) {}

  public async generate(): Promise<GeneratedCode> {
    if (!this.schema.javaPackage) {
      throw new Error("javaPackage is required to generate Java code");
    }
    const headers = [`package ${this.schema.javaPackage};`];

    const imports: string[] = [
      "import io.nexusrpc.Operation;",
      "import io.nexusrpc.Service;",
      "import javax.annotation.Nonnull;",
      "import javax.annotation.Nullable;",
    ];

    const body: string[] = [];

    for (const service of this.schema.services) {
      const serviceName = service.name || service.identifier;
      const serviceInterfaceName = toJavaClassName(service.identifier);
      const serviceDescription =
        service.description || `Service for ${serviceName}.`;

      // Generate service interface
      const serviceDocLines = wrapDocstring(serviceDescription, {
        header: "/**",
        trailer: " */",
        prefix: " * ",
        maxLength: 120,
      });
      serviceDocLines.forEach((line) => body.push(line));

      body.push(`@Service("${serviceName}")`);
      body.push(`public interface ${serviceInterfaceName} {`);
      body.push("");

      // Generate operations
      for (const operation of service.operations) {
        const operationName = operation.name || operation.identifier;
        const operationMethodName = toJavaMethodName(operation.identifier);
        const operationDescription =
          operation.description || `Operation for ${operationName}.`;

        const [inputType, outputType] = await Promise.all([
          toJavaType(
            this.schemaStore,
            service.identifier,
            operation.identifier,
            operation.input
          ),
          toJavaType(
            this.schemaStore,
            service.identifier,
            operation.identifier,
            operation.output
          ),
        ]);

        // Generate operation method
        const operationDocLines = wrapDocstring(operationDescription, {
          header: "    /**",
          trailer: "     */",
          prefix: "     * ",
          maxLength: 120,
        });
        operationDocLines.forEach((line) => body.push(line));

        body.push(`    @Operation("${operationName}")`);
        const params = inputType === "void" ? "" : `@Nonnull ${inputType} input`;
        body.push(`    ${outputType} ${operationMethodName}(${params});`);
        body.push("");
      }

      body.push("}");
      body.push("");
    }

    return {
      headers,
      imports,
      body,
    };
  }
}

export async function toJavaType(
  store: SchemaStore,
  service: string,
  operation: string,
  io?: { $ref: string }
): Promise<string> {
  if (!io) {
    return "void";
  }
  const type = await store.resolveRef(service, operation, io);
  return type.title || "Object";
}

function toJavaClassName(identifier: string): string {
  // Convert to PascalCase for class names
  return identifier
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

function toJavaMethodName(identifier: string): string {
  // Convert to camelCase for method names
  const parts = identifier.split(/[-_]/);
  return (
    parts[0].toLowerCase() +
    parts
      .slice(1)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("")
  );
}
