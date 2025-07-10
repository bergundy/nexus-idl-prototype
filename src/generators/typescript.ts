import type { GeneratedCode } from "./types";
import { BaseGenerator } from "./base";
import { wrapDocstring } from "./utils";

export class TypeScriptGenerator extends BaseGenerator {
  public async generate(): Promise<GeneratedCode> {
    const imports: string[] = ['import * as nexus from "nexus-rpc"'];
    const body: string[] = [];
    for (const service of this.schema.services) {
      // Add service docstring
      const serviceName = service.name || service.identifier;
      const serviceDescription =
        service.description || `Represents the ${serviceName} service.`;
      const serviceDocLines = wrapDocstring(serviceDescription, {
        prefix: " *",
        maxLength: 120,
        header: "/**",
        trailer: " */",
      });

      serviceDocLines.forEach((line) => body.push(line));

      body.push(
        `export const ${service.identifier} = nexus.service(${JSON.stringify(serviceName)}, {`
      );
      for (const operation of service.operations) {
        // Add operation docstring
        const operationName = operation.name || operation.identifier;
        const operationDescription =
          operation.description || `Represents the ${operationName} operation.`;
        const operationDocLines = wrapDocstring(operationDescription, {
          prefix: "   *",
          maxLength: 120,
          header: "  /**",
          trailer: "   */",
        });

        operationDocLines.forEach((line) => body.push(line));

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
        body.push(`    name: ${JSON.stringify(operationName)},`);
        body.push(`  }),`);
      }
      body.push(`});`);
    }
    return { imports, body };
  }

  protected getVoidType(): string {
    return "void";
  }
}
