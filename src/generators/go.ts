import type { GeneratedCode } from "./types";
import { wrapDocstring } from "./utils";
import type { Schema } from "../schema";
import { SchemaStore } from "../schemastore";

export class GoGenerator {
  constructor(
    protected readonly schemaStore: SchemaStore,
    protected readonly schema: typeof Schema.infer
  ) {}

  public async generate(): Promise<GeneratedCode> {
    if (!this.schema.goPackage) {
      throw new Error("goPackage is required to generate Go code");
    }
    const headers: string[] = [`package ${this.schema.goPackage}`];
    const imports: string[] = ['import "github.com/nexus-rpc/sdk-go/nexus"'];
    const body: string[] = [];

    // Generate grouped constants and references by service
    for (const service of this.schema.services) {
      const serviceName = service.name || service.identifier;
      const serviceConstantName = toGoConstant(service.identifier);

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

      body.push("");

      // Store operation information for interface generation
      const operations = new Array<{
        methodName: string;
        inputType: string;
        outputType: string;
      }>();

      // Operations for this service
      for (const operation of service.operations) {
        const operationName = operation.name || operation.identifier;
        const constantName = toGoConstant(
          `${service.identifier}_${operation.identifier}`
        );

        body.push("");

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

        body.push("");

        const [inputType, outputType] = await Promise.all([
          this.schemaStore.getType(
            service.identifier,
            operation.identifier,
            "nexus.NoValue",
            operation.input
          ),
          this.schemaStore.getType(
            service.identifier,
            operation.identifier,
            "nexus.NoValue",
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

        body.push("");

        // Store operation info for interface generation
        operations.push({
          methodName: toGoConstant(operation.identifier),
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
          `\t${opInfo.methodName}(name string) nexus.Operation[${opInfo.inputType}, ${opInfo.outputType}]`
        );
      }

      body.push("}");

      body.push("");

      // Generate unimplemented struct
      const unimplementedStructName = `Unimplemented${interfaceName}`;
      const unimplementedDescription = `provides an unimplemented version of ${interfaceName}.`;
      const unimplementedDocLines = wrapDocstring(
        `${unimplementedStructName} ${unimplementedDescription}`,
        { prefix: "//" }
      );
      unimplementedDocLines.forEach((line) => body.push(line));
      body.push(`type ${unimplementedStructName} struct{}`);
      body.push("");

      // Generate unimplemented operation structs for each operation
      for (const opInfo of operations) {
        const unimplementedOpStructName = `unimplemented${serviceConstantName}${opInfo.methodName}`;
        const unimplementedOpDescription = `provides an unimplemented ${opInfo.methodName} operation.`;
        const unimplementedOpDocLines = wrapDocstring(
          `${unimplementedOpStructName} ${unimplementedOpDescription}`,
          { prefix: "//" }
        );
        unimplementedOpDocLines.forEach((line) => body.push(line));
        body.push(`type ${unimplementedOpStructName} struct {`);
        body.push(
          `\tnexus.UnimplementedOperation[${opInfo.inputType}, ${opInfo.outputType}]`
        );
        body.push(`\tname string`);
        body.push(`}`);
        body.push("");

        body.push(`func (op *${unimplementedOpStructName}) Name() string {`);
        body.push(`\treturn op.name`);
        body.push(`}`);
        body.push("");
      }

      // Generate methods for unimplemented struct
      for (const opInfo of operations) {
        const methodDescription = `returns an unimplemented operation.`;
        const methodDocLines = wrapDocstring(
          `${opInfo.methodName} ${methodDescription}`,
          { prefix: "//" }
        );
        methodDocLines.forEach((line) => body.push(line));
        body.push(
          `func (${unimplementedStructName}) ${opInfo.methodName}(name string) nexus.Operation[${opInfo.inputType}, ${opInfo.outputType}] {`
        );
        const unimplementedOpStructName = `unimplemented${serviceConstantName}${opInfo.methodName}`;
        body.push(`\treturn &${unimplementedOpStructName}{name: name}`);
        body.push("}");
        body.push("");
      }

      // Generate New service constructor function
      const newFunctionName = `New${serviceConstantName}`;
      const newFunctionDescription = `creates a new ${serviceConstantName} service from a handler with all operations registered.`;
      const newFunctionDocLines = wrapDocstring(
        `${newFunctionName} ${newFunctionDescription}`,
        { prefix: "//" }
      );
      newFunctionDocLines.forEach((line) => body.push(line));
      body.push(
        `func ${newFunctionName}(handler ${interfaceName}) (*nexus.Service, error) {`
      );
      body.push(
        `\tservice := nexus.NewService(${serviceConstantName}ServiceName)`
      );
      body.push("");

      // Register each operation
      for (const opInfo of operations) {
        const constantName = toGoConstant(
          `${service.identifier}_${opInfo.methodName}`
        );
        body.push(
          `\terr := service.Register(handler.${opInfo.methodName}(${constantName}OperationName))`
        );
        body.push(`\tif err != nil {`);
        body.push(`\t\treturn nil, err`);
        body.push(`\t}`);
        body.push("");
      }

      body.push(`\treturn service, nil`);
      body.push("}");

      // Add blank line between services (except after the last service)
      if (service !== this.schema.services[this.schema.services.length - 1]) {
        body.push("");
      }
    }

    return { headers, imports, body };
  }
}

/**
 * Convert to PascalCase for Go constants
 */
export function toGoConstant(name: string): string {
  return name
    .split(/[_\.\-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}
