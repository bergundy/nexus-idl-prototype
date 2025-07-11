import type { GeneratedCode } from "../../generator";
import { toGoConstant, toGoType } from "../../generators/go";
import { wrapDocstring } from "../../generators/utils";
import type { Schema } from "../../schema";
import type { SchemaStore } from "../../schemastore";

export async function generateGo(
  schemaStore: SchemaStore,
  schema: typeof Schema.infer
): Promise<GeneratedCode> {
  const imports: string[] = [];
  const body: string[] = [];

  // Add Go-specific imports
  imports.push('import "go.temporal.io/sdk/workflow"');

  // Generate a typed service client for each service.
  for (const service of schema.services) {
    const serviceConstantName = toGoConstant(service.identifier);
    const serviceName = service.name || service.identifier;

    // Generate a typed service client for the service.
    body.push(
      ...wrapDocstring(
        `${serviceConstantName}WorkflowClient is an in-workflow Nexus client for the ${serviceName} service.`,
        {
          prefix: "//",
        }
      )
    );
    body.push(`type ${serviceConstantName}WorkflowClient struct {`);
    body.push(`\tc workflow.NexusClient`);
    body.push(`}`);

    body.push("");

    body.push(
      ...wrapDocstring(
        `New${serviceConstantName}WorkflowClient creates a new in-workflow Nexus client for the ${serviceName} service.`,
        {
          prefix: "//",
        }
      )
    );
    body.push(
      `func New${serviceConstantName}WorkflowClient(endpoint string) *${serviceConstantName}WorkflowClient {`
    );
    body.push(
      `\tc := workflow.NewNexusClient(endpoint, ${serviceConstantName}ServiceName)`
    );
    body.push(`\treturn &${serviceConstantName}WorkflowClient{c}`);
    body.push(`}`);

    body.push("");

    for (const operation of service.operations) {
      const operationConstantName = toGoConstant(operation.identifier);
      const operationName = operation.name || operation.identifier;

      const [inputType, outputType] = await Promise.all([
        toGoType(
          schemaStore,
          service.identifier,
          operation.identifier,
          operation.input
        ),
        toGoType(
          schemaStore,
          service.identifier,
          operation.identifier,
          operation.output
        ),
      ]);

      const futureType = `${serviceConstantName}${operationConstantName}Future`;

      // Generate a future type for the operation.
      body.push(
        ...wrapDocstring(
          `${futureType} is a future for the ${operationName} operation.`,
          {
            prefix: "//",
          }
        )
      );
      body.push(`type ${futureType} struct {`);
      body.push(`\tworkflow.NexusOperationFuture`);
      body.push(`}`);

      body.push("");

      body.push("// GetTyped gets the typed result of the operation.");
      if (outputType === "nexus.NoValue") {
        body.push(
          `func (f ${futureType}) GetTyped(ctx workflow.Context) error {`
        );
        body.push(`\treturn f.Get(ctx, nil)`);
      } else {
        body.push(
          `func (f ${futureType}) GetTyped(ctx workflow.Context) (${outputType}, error) {`
        );
        body.push(`\tvar output ${outputType}`);
        body.push(`\terr := f.Get(ctx, &output)`);
        body.push(`\treturn output, err`);
      }
      body.push(`}`);

      body.push("");

      // Generate an async method for the operation.
      body.push(
        ...wrapDocstring(
          `${operationConstantName}Async executes the ${operationName} operation and returns a future.`,
          {
            prefix: "//",
          }
        )
      );
      if (inputType === "nexus.NoValue") {
        body.push(
          `func (c *${serviceConstantName}WorkflowClient) ${operationConstantName}Async(ctx workflow.Context, options workflow.NexusOperationOptions) ${futureType} {`
        );
        body.push(
          `\tfut := c.c.ExecuteOperation(ctx, ${serviceConstantName}${operationConstantName}OperationName, nil, options)`
        );
      } else {
        body.push(
          `func (c *${serviceConstantName}WorkflowClient) ${operationConstantName}Async(ctx workflow.Context, input ${inputType}, options workflow.NexusOperationOptions) ${futureType} {`
        );
        body.push(
          `\tfut := c.c.ExecuteOperation(ctx, ${serviceConstantName}${operationConstantName}OperationName, input, options)`
        );
      }
      body.push(`\treturn ${futureType}{fut}`);
      body.push(`}`);

      body.push("");

      // Generate a synchronous method for the operation.
      body.push(
        ...wrapDocstring(
          `${operationConstantName} executes the ${operationName} operation and returns the result.`,
          {
            prefix: "//",
          }
        )
      );
      const returnType = outputType === "nexus.NoValue" ? "error" : `(${outputType}, error)`;
      if (inputType === "nexus.NoValue") {
        body.push(
          `func (c *${serviceConstantName}WorkflowClient) ${operationConstantName}(ctx workflow.Context, options workflow.NexusOperationOptions) ${returnType} {`
        );
        body.push(
          `\tfut := c.${operationConstantName}Async(ctx, options)`
        );
      } else {
        body.push(
          `func (c *${serviceConstantName}WorkflowClient) ${operationConstantName}(ctx workflow.Context, input ${inputType}, options workflow.NexusOperationOptions) ${returnType} {`
        );
        body.push(
          `\tfut := c.${operationConstantName}Async(ctx, input, options)`
        );
      }
      body.push(`\treturn fut.GetTyped(ctx)`);
      body.push(`}`);

      body.push("");
    }
  }

  return { imports, body };
}
