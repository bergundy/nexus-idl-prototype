/**
 * Options for wrapping docstring text into multiple lines.
 */
export interface WrapDocstringOptions {
  /** The prefix to add to each line (e.g., comment markers like " * ") */
  prefix: string;
  /** Maximum length of each line before wrapping (default: 120) */
  maxLength?: number;
  /** Optional string to prepend before the wrapped content */
  header?: string;
  /** Optional string to append after the wrapped content */
  trailer?: string;
}

/**
 * Wraps a text string into multiple lines with specified formatting options.
 *
 * This function takes a text string and wraps it into multiple lines based on
 * word boundaries, ensuring no line exceeds the specified maximum length.
 * Each line is prefixed with the provided prefix string.
 *
 * @param text - The text to wrap
 * @param options - Configuration options for wrapping
 * @returns An array of wrapped lines, or empty array if text is empty
 *
 * @example
 * ```typescript
 * const lines = wrapDocstring("This is a long text that needs wrapping", {
 *   prefix: " * ",
 *   maxLength: 20,
 *   pre: "/**",
 *   post: "*\/"
 * });
 * // Returns: ["/**", " * This is a long", " * text that needs", " * wrapping", " *\/"]
 * ```
 */
export function wrapDocstring(
  text: string,
  options: WrapDocstringOptions
): string[] {
  if (text.length === 0) {
    return [];
  }

  const { prefix, maxLength = 120, header: pre, trailer: post } = options;
  const lines: string[] = [];

  // Add pre string if provided
  if (pre) {
    lines.push(pre);
  }

  const words = text.split(" ");
  let currentLine = prefix;

  for (const word of words) {
    // Check if adding this word would exceed the max length
    if (currentLine.length + word.length + 1 > maxLength) {
      lines.push(currentLine.trimEnd());
      currentLine = prefix + " " + word;
    } else {
      currentLine += " " + word;
    }
  }

  // Add the last line if it has content
  if (currentLine.length > prefix.length) {
    lines.push(currentLine.trimEnd());
  }

  // Add post string if provided
  if (post) {
    lines.push(post);
  }

  return lines;
}
