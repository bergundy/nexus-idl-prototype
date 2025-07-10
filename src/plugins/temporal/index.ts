import type { GeneratedCode, SupportedLanguage } from "../../generator";
import type { Schema } from "../../schema";
import type { SchemaStore } from "../../schemastore";
import type { Plugin } from "../../plugin";
import { generateGo } from "./go";

class TemporalPlugin implements Plugin {
  public readonly name = "temporal";
  public readonly version = "0.0.1";
  public readonly description =
    "Generates Temporal Workflow Nexus clients from service schemas";
  public readonly author = "Temporal Technologies Inc. <sdk@temporal.io>";

  public async generate(
    schemaStore: SchemaStore,
    schema: typeof Schema.infer,
    lang: SupportedLanguage
  ): Promise<GeneratedCode> {
    const imports: string[] = [];
    const body: string[] = [];

    // Add language-specific imports
    switch (lang) {
      case "typescript":
      case "ts":
        // Nothing to do for TypeScript
        return { imports, body };
      case "go":
        return generateGo(schemaStore, schema);
    }

    return { imports, body };
  }
}

export default new TemporalPlugin();
