import { estimateTokens } from "./token-counter";

export interface Chunk {
  content: string;
  headingPath: string;
  chunkIndex: number;
  tokenCount: number;
}

export interface ChunkOptions {
  maxTokens?: number;
  overlapTokens?: number;
}

const DEFAULT_MAX_TOKENS = 512;
const DEFAULT_OVERLAP_TOKENS = 50;

/**
 * Split markdown into heading-aware chunks.
 *
 * Strategy:
 * 1. Split by headings (# through ######)
 * 2. Track heading hierarchy to produce a headingPath like "# Intro > ## Setup"
 * 3. If a section exceeds maxTokens, sub-split on paragraph boundaries
 *    with overlapTokens overlap between consecutive sub-chunks
 */
export function chunkMarkdown(markdown: string, options?: ChunkOptions): Chunk[] {
  const maxTokens = options?.maxTokens ?? DEFAULT_MAX_TOKENS;
  const overlapTokens = options?.overlapTokens ?? DEFAULT_OVERLAP_TOKENS;

  const lines = markdown.split("\n");
  const sections = splitByHeadings(lines);
  const chunks: Chunk[] = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const tokenCount = estimateTokens(section.content);
    if (tokenCount <= maxTokens) {
      chunks.push({
        content: section.content,
        headingPath: section.headingPath,
        chunkIndex: chunkIndex++,
        tokenCount,
      });
    } else {
      const subChunks = subSplit(section.content, maxTokens, overlapTokens);
      for (const sub of subChunks) {
        chunks.push({
          content: sub,
          headingPath: section.headingPath,
          chunkIndex: chunkIndex++,
          tokenCount: estimateTokens(sub),
        });
      }
    }
  }

  return chunks;
}

interface Section {
  content: string;
  headingPath: string;
}

function splitByHeadings(lines: string[]): Section[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/;
  const sections: Section[] = [];
  const headingStack: { level: number; text: string }[] = [];
  let currentLines: string[] = [];

  function flushSection() {
    const content = currentLines.join("\n").trim();
    if (content) {
      sections.push({
        content,
        headingPath: headingStack.map((h) => `${"#".repeat(h.level)} ${h.text}`).join(" > "),
      });
    }
    currentLines = [];
  }

  for (const line of lines) {
    const match = line.match(headingRegex);
    if (match) {
      flushSection();
      const level = match[1].length;
      const text = match[2].trim();
      // Pop headings at same or deeper level
      while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
        headingStack.pop();
      }
      headingStack.push({ level, text });
      currentLines.push(line);
    } else {
      currentLines.push(line);
    }
  }

  flushSection();

  // If no sections were created (no headings), return everything as one section
  if (sections.length === 0 && lines.length > 0) {
    const content = lines.join("\n").trim();
    if (content) {
      sections.push({ content, headingPath: "" });
    }
  }

  return sections;
}

function subSplit(text: string, maxTokens: number, overlapTokens: number): string[] {
  const paragraphs = text.split(/\n\n+/);
  const result: string[] = [];
  let current: string[] = [];
  let currentTokens = 0;

  for (const para of paragraphs) {
    const paraTokens = estimateTokens(para);

    if (currentTokens + paraTokens > maxTokens && current.length > 0) {
      result.push(current.join("\n\n"));

      // Find overlap: take trailing paragraphs up to overlapTokens
      const overlap: string[] = [];
      let overlapCount = 0;
      for (let i = current.length - 1; i >= 0; i--) {
        const t = estimateTokens(current[i]);
        if (overlapCount + t > overlapTokens) break;
        overlap.unshift(current[i]);
        overlapCount += t;
      }

      current = [...overlap, para];
      currentTokens = overlapCount + paraTokens;
    } else {
      current.push(para);
      currentTokens += paraTokens;
    }
  }

  if (current.length > 0) {
    result.push(current.join("\n\n"));
  }

  return result;
}
