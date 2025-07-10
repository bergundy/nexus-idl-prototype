import type { GeneratedCode } from "./types";
import { BaseGenerator } from "./base";
import { wrapDocstring } from "./utils";

export class GoGenerator extends BaseGenerator {
  public async generate(): Promise<GeneratedCode> {
    const imports: string[] = ['import "github.com/nexus-rpc/sdk-go/nexus"'];
    const body: string[] = [];

    // Generate grouped constants and references by service
    for (const service of this.schema.services) {
      const serviceName = service.name || service.identifier;
      const serviceConstantName = this.toGoConstant(service.identifier);

      const description =
        service.description || `represents the ${serviceName} service.`;
      const docLines = wrapDocstring(
        `${serviceConstantName}ServiceName ${description}`,
        {
          prefix: "//",
        }
      );
      docLines.forEach((line) => body.push(line));
      body.push(
        `const ${serviceConstantName}ServiceName = ${JSON.stringify(serviceName)}`
      );

      // Store operation information for interface generation
      const operations = new Array<{
        methodName: string;
        inputType: string;
        outputType: string;
      }>();

      // Operations for this service
      for (const operation of service.operations) {
        const operationName = operation.name || operation.identifier;
        const constantName = this.toGoConstant(
          `${service.identifier}_${operation.identifier}`
        );

        const description =
          operation.description || `represents the ${operationName} operation.`;
        let docLines = wrapDocstring(
          `${constantName}OperationName ${description}`,
          {
            prefix: "//",
          }
        );
        docLines.forEach((line) => body.push(line));
        body.push(
          `const ${constantName}OperationName = ${JSON.stringify(operationName)}`
        );

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

        docLines = wrapDocstring(`${constantName}Operation ${description}`, {
          prefix: "//",
        });
        docLines.forEach((line) => body.push(line));
        body.push(
          `var ${constantName}Operation = nexus.NewOperationReference[${inputType}, ${outputType}](${constantName}OperationName)`
        );

        // Store operation info for interface generation
        operations.push({
          methodName: this.toGoConstant(operation.identifier),
          inputType,
          outputType,
        });
      }

      // Generate handler interface
      const interfaceName = `${serviceConstantName}Handler`;
      const interfaceDescription = `defines the handler interface for the ${serviceConstantName} service.`;
      const interfaceDocLines = wrapDocstring(
        `${interfaceName} ${interfaceDescription}`,
        { prefix: "//" }
      );
      interfaceDocLines.forEach((line) => body.push(line));
      body.push(`type ${interfaceName} interface {`);

      // Add methods for each operation
      for (const opInfo of operations) {
        body.push(
          `\t${opInfo.methodName}() nexus.Operation[${opInfo.inputType}, ${opInfo.outputType}]`
        );
      }

      body.push("}");

      // Add blank line between services (except after the last service)
      if (service !== this.schema.services[this.schema.services.length - 1]) {
        body.push("");
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
      .split(/[_\.\-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");
  }
}
