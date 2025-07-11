import type { FetchingJSONSchemaStore } from "quicktype-core";
import { Schema } from "./schema";
import type { GeneratedCode } from "./generators/types";
import { TypeScriptGenerator } from "./generators/typescript";
import { GoGenerator } from "./generators/go";
import { PythonGenerator } from "./generators/python";
import { SchemaStore } from "./schemastore";
import { JavaGenerator } from "./generators/java";

export const SUPPORTED_LANGUAGES = [
  "typescript",
  "ts",
  "go",
  "python",
  "py",
  "java",
] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export type { GeneratedCode };

export class Generator {
  constructor(
    private readonly schemaStore: SchemaStore,
    private readonly schema: typeof Schema.infer,
    private readonly lang: SupportedLanguage
  ) {}

  public async generate(): Promise<GeneratedCode> {
    switch (this.lang) {
      case "typescript":
      case "ts":
        const tsGenerator = new TypeScriptGenerator(
          this.schemaStore,
          this.schema
        );
        return await tsGenerator.generate();
      case "go":
        const goGenerator = new GoGenerator(this.schemaStore, this.schema);
        return await goGenerator.generate();
      case "python":
      case "py":
        const pythonGenerator = new PythonGenerator(
          this.schemaStore,
          this.schema
        );
        return await pythonGenerator.generate();
      case "java":
        const javaGenerator = new JavaGenerator(this.schemaStore, this.schema);
        return await javaGenerator.generate();
      default:
        throw new Error(`Unsupported language: ${this.lang}`);
    }
  }
}
