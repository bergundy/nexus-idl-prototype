import type { GeneratedCode } from "./types";
import { BaseGenerator } from "./base";

export class TypeScriptGenerator extends BaseGenerator {
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

  protected getVoidType(): string {
    return "void";
  }
}
