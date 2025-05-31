import { type } from "arktype";

export const SCHEMA_URL = "http://api.nexus/schema/draft-01#";

export const Operation = type({
  identifier: "/^[a-zA-Z][a-zA-Z0-9_]*$/",
  "name?": "string",
  "description?": "string",
  // In the future, we can support inlining the schema here, but for now we'll just use a reference.
  "input?": { $ref: "string" },
  "output?": { $ref: "string" },
});

export const Service = type({
  identifier: "/^[a-zA-Z][a-zA-Z0-9_]*$/",
  "name?": "string",
  "description?": "string",
  operations: Operation.array(),
});

export const Schema = type({
  $schema: `'${SCHEMA_URL}'`,
  services: Service.array(),
});
