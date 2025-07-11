import { describe, it, expect } from "bun:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { main } from "../../cli";

describe("go", () => {
  it("should generate go code", async () => {});

  it("should generate working go code", async () => {
    const output = await generateGoCode();
    const expected = await readFile(
      path.resolve(
        new URL("./samples/go/gen/gen.go", import.meta.url).pathname
      ),
      "utf8"
    );
    expect(output).toEqual(expected);
  });
});

function createOutput(lines: string[]) {
  return {
    async write(chunk: string): Promise<number> {
      lines.push(chunk);
      return chunk.length;
    },
  };
}

async function generateGoCode(): Promise<string> {
  const lines = new Array<string>();

  await main(
    [
      "--lang",
      "go",
      "--plugin",
      path.resolve(new URL("./index.ts", import.meta.url).pathname),
      path.resolve(
        new URL(
          "../../../samples/schemas/combined/services.yml",
          import.meta.url
        ).pathname
      ),
    ],
    createOutput(lines)
  );

  return lines.join("");
}
