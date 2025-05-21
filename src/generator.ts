import { Schema } from "./schema";

export const SUPPORTED_LANGUAGES = ["typescript", "ts"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export type GeneratedCode = {
  imports: string[];
  body: string[];
};

export function generate(
  schema: typeof Schema.infer,
  lang: SupportedLanguage
): GeneratedCode {
  const imports: string[] = ['import * as nexus from "nexus-rpc"'];
  const body: string[] = [];
  for (const service of schema.services) {
    body.push(
      `export const ${service.identifier} = nexus.service("${(service.name || service.identifier).replaceAll('"', '\\"')}", {`
    );
    for (const operation of service.operations) {
      body.push(
        `  ${operation.identifier}: nexus.operation<${operation.input || "void"}, ${operation.output || "void"}>({`
      );
      body.push(
        `    name: "${(operation.name || operation.identifier).replaceAll('"', '\\"')}",`
      );
      body.push(`  }),`);
    }
    body.push(`});`);
  }
  return { imports, body };
}
