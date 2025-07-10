export function wrapDocstring(
  text: string,
  options: {
    prefix: string;
    maxLength?: number;
  }
): string[] {
  if (text.length === 0) {
    return [];
  }

  const { prefix, maxLength = 120 } = options;
  const lines: string[] = [];
  const words = text.split(" ");
  let currentLine = prefix;

  for (const word of words) {
    // Check if adding this word would exceed the max length
    if (
      currentLine.length + word.length + 1 > maxLength &&
      currentLine.length > prefix.length
    ) {
      lines.push(currentLine);
      currentLine = prefix + " " + word;
    } else {
      currentLine += " " + word;
    }
  }

  // Add the last line if it has content
  if (currentLine.length > prefix.length) {
    lines.push(currentLine);
  }

  return lines;
}
