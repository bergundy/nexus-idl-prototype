import { type } from "arktype";
import type { GeneratedCode, SupportedLanguage } from "./generator";
import type { Schema } from "./schema";

export const PluginSchema = type({
  name: "string",
  version: "string",
  description: "string?",
  author: "string?",
});

export type Plugin = typeof PluginSchema.infer & {
  generate: (
    schema: typeof Schema.infer,
    lang: SupportedLanguage
  ) => Promise<GeneratedCode>;
};

export async function loadPlugin(path: string) {
  const plugin = await import(path);
  const pluginSchema = PluginSchema(plugin);
  if (pluginSchema instanceof type.errors) {
    throw new Error(`Invalid plugin schema: ${pluginSchema.summary}`);
  }
  if (typeof plugin.generate !== "function") {
    throw new Error(`Plugin ${path} does not have a generate function`);
  }
  return { ...pluginSchema, generate: plugin.generate.bind(plugin) };
}
