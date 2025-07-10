import type { GeneratedCode } from "./types";
import { BaseGenerator } from "./base";

export class GoGenerator extends BaseGenerator {
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

  protected getVoidType(): string {
    return "nexus.NoValue";
  }

  private toGoConstant(name: string): string {
    // Convert to PascalCase for Go constants
    return name
      .split(/[_-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join("");
  }
}
