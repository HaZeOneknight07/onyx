/**
 * Estimate token count using word count / 0.75 heuristic.
 * This approximation works reasonably well for English text
 * and avoids external tokenizer dependencies.
 */
export function estimateTokens(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.ceil(words / 0.75);
}

/**
 * Truncate text to fit within a token budget.
 * Splits on whitespace boundaries to avoid cutting words.
 */
export function truncateToTokens(text: string, maxTokens: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  const maxWords = Math.floor(maxTokens * 0.75);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ");
}
