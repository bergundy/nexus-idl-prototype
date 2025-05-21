import { Schema } from "./schema";

export const SUPPORTED_LANGUAGES = ["typescript", "ts"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export async function generate(
  schema: typeof Schema.infer,
  lang: SupportedLanguage
): Promise<string[]> {
  const lines: string[] = ['import * as nexus from "nexus-rpc"', ""];
  for (const service of schema.services) {
    lines.push(
      `export const ${service.identifier}Service = nexus.service("${(service.name || service.identifier).replaceAll('"', '\\"')}", {`
    );
    for (const operation of service.operations) {
      lines.push(
        `  ${operation.identifier}: nexus.operation<${operation.input || "void"}, ${operation.output || "void"}>({`
      );
      lines.push(
        `    name: ${(operation.name || operation.identifier).replaceAll('"', '\\"')},`
      );
      lines.push(`  }),`);
    }
    lines.push(`});`);
  }
  return lines;
}
