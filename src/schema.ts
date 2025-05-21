import { type } from "arktype";

export const SCHEMA_URL = "http://api.nexus/draft-01/schema#";

export const Operation = type({
  identifier: "/^[a-zA-Z][a-zA-Z0-9_]*$/",
  "name?": "string",
  "description?": "string",
  "input?": "string",
  "output?": "string",
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
