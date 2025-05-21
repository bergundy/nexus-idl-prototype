# nexus-idl

A code generator from JSON schema and Nexus service definitions.

**⚠️ Work in progress, currently a TypeScript prototype is implemented ⚠️**


## Usage

To generate code using the included sample schemas for TypeScript, run the following command:

```bash
bun ./index.ts --lang ts samples/schemas/*
```

This will process all schemas in the `samples/schemas/` directory and output the generated TypeScript code to the console.

- The `--lang` option specifies the output language (e.g., `ts` for TypeScript).
- The paths following the language are the schema files to process. You can specify individual files or use a glob pattern like `samples/schemas/*`.

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
