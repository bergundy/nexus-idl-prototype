import { test, expect, describe } from "bun:test";
import { wrapDocstring } from "./utils";

describe("wrapDocstring", () => {
  test("should wrap text within default maxLength", () => {
    const text =
      "This is a long line that should be wrapped when it exceeds the maximum length limit of 120 characters by default and should continue on the next line";
    const result = wrapDocstring(text, { prefix: "///" });

    expect(result).toBeArray();
    expect(result.length).toBeGreaterThan(1);
    expect(result[0]).toStartWith("/// ");
    expect(result[1]).toStartWith("/// ");

    // Check that no line exceeds 120 characters
    result.forEach((line) => {
      expect(line.length).toBeLessThanOrEqual(120);
    });
  });

  test("should handle short text that doesn't need wrapping", () => {
    const text = "Short text";
    const result = wrapDocstring(text, { prefix: "///" });

    expect(result).toEqual(["/// Short text"]);
  });

  test("should handle empty text", () => {
    const text = "";
    const result = wrapDocstring(text, { prefix: "///" });

    expect(result).toEqual([]);
  });

  test("should handle single word", () => {
    const text = "SingleWord";
    const result = wrapDocstring(text, { prefix: "///" });

    expect(result).toEqual(["/// SingleWord"]);
  });

  test("should respect custom maxLength", () => {
    const text = "This is a test with custom maximum length";
    const result = wrapDocstring(text, { prefix: "///", maxLength: 30 });

    expect(result.length).toBeGreaterThan(1);
    result.forEach((line) => {
      expect(line.length).toBeLessThanOrEqual(30);
    });
  });

  test("should handle different prefix lengths", () => {
    const text = "This is a test with a longer prefix";
    const result = wrapDocstring(text, { prefix: "// This is a long prefix:" });

    expect(result).toBeArray();
    expect(result[0]).toStartWith("// This is a long prefix:");
    if (result.length > 1) {
      expect(result[1]).toStartWith("// This is a long prefix: ");
    }
  });

  test("should handle very long single words", () => {
    const text =
      "This supercalifragilisticexpialidocious word is very long and might cause issues";
    const result = wrapDocstring(text, { prefix: "///", maxLength: 40 });

    expect(result).toBeArray();
    expect(result.length).toBeGreaterThan(1);

    // Even with long words, lines should not exceed maxLength unless unavoidable
    result.forEach((line) => {
      expect(line.length).toBeLessThanOrEqual(40);
    });
  });

  test("should handle multiple spaces between words", () => {
    const text = "This  has   multiple    spaces between words";
    const result = wrapDocstring(text, { prefix: "///" });

    expect(result).toBeArray();
    expect(result[0]).toStartWith("///");
    // Function preserves original spacing between words
    expect(result[0]).toContain("This  has   multiple    spaces between words");
  });

  test("should handle text that exactly fits on one line", () => {
    const text =
      "This text is exactly the right length to fit on one line with the prefix";
    const prefix = "///";
    const maxLength = prefix.length + 1 + text.length; // prefix + space + text

    const result = wrapDocstring(text, { prefix, maxLength });

    expect(result).toEqual([`/// ${text}`]);
  });

  test("should handle text with newlines or multiple sentences", () => {
    const text =
      "First sentence. Second sentence with more words. Third sentence to test wrapping.";
    const result = wrapDocstring(text, { prefix: "///", maxLength: 50 });

    expect(result).toBeArray();
    expect(result.length).toBeGreaterThan(1);
    result.forEach((line) => {
      expect(line.length).toBeLessThanOrEqual(50);
      expect(line).toStartWith("///");
    });
  });

  test("should preserve word boundaries", () => {
    const text = "The quick brown fox jumps over the lazy dog";
    const result = wrapDocstring(text, { prefix: "//", maxLength: 25 });

    expect(result).toBeArray();

    // Check that words are not broken
    const joinedText = result.join(" ").replace(/\/\/\s?/g, "");
    expect(joinedText).toContain("The quick brown fox jumps over the lazy dog");
  });

  test("should handle edge case where prefix is very long relative to maxLength", () => {
    const text = "Short text";
    const result = wrapDocstring(text, {
      prefix: "// This is a very long prefix that takes up most of the line",
      maxLength: 80,
    });

    expect(result).toBeArray();
    expect(result[0]).toStartWith(
      "// This is a very long prefix that takes up most of the line"
    );
  });
});
