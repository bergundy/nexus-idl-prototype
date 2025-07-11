# nexus-idl

A code generator from JSON schema and Nexus service definitions.

**⚠️ Work in progress, currently a TypeScript, Python, and Go prototype is implemented ⚠️**

## Usage

To generate code using the included sample schemas for TypeScript, run the following command:

```bash
bun ./index.ts --lang ts samples/schemas/separate/* > services.ts
```

Alternatively, generate from a single file that combines Nexus and JSON schemas:

```bash
bun ./index.ts --lang ts samples/schemas/combined/services.yml > services.ts
```

This will process all schemas in the `samples/schemas/` directory and output the generated TypeScript code to the
console.

In this example, `services.ts` will contain type definitions as well as Nexus service and operation definitions, you
should see the following at the end of the generated file:

```ts
export const UserService = nexus.service("directory.UserService", {
  getUser: nexus.operation<GetPersonRequest, GetPersonResponse>({
    name: "Get User",
  }),
});
```

- Sample TypeScript output can be found [here](./samples/output/ts/sample.ts).
- Sample Python output can be found [here](./samples/output/python/sample.py).
- Sample Go + Temporal output can be found [here](./src/plugins/temporal/samples/go/gen/gen.go).

- The `--lang` option specifies the output language (e.g., `ts` for TypeScript).
- The paths following the language are the schema files to process. You can specify individual files or use a glob
  pattern like `samples/schemas/*`.

## Plugins

The code generator supports plugins to generate additional custom code.
For example, there's a Temporal plugin included [in this repo](./src/plugins/temporal/index.ts), that generates a Go Temporal Workflow Nexus client.

To run the command with plugins use:

```
bun ./index.ts --lang go --plugin ./src/plugins/temporal/index.ts samples/schemas/combined/services.yml
```

## Contributing

### Install bun

See: https://bun.sh/docs/installation

### install dependencies

```bash
bun install
```

### Run

```bash
bun run index.ts
```
