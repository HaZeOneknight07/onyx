import { describe, expect, it } from "bun:test";
import { chunkMarkdown } from "../src/markdown-chunker";

const repeatWords = (word: string, count: number) => Array.from({ length: count }, () => word).join(" ");

describe("chunkMarkdown", () => {
  it("produces heading-aware chunks", () => {
    const md = [
      "# Intro",
      "Hello world.",
      "", 
      "## Setup",
      "Step one.",
      "", 
      "### Details",
      "More info.",
    ].join("\n");

    const chunks = chunkMarkdown(md, { maxTokens: 200, overlapTokens: 0 });

    expect(chunks.length).toBe(3);
    expect(chunks[0].headingPath).toBe("# Intro");
    expect(chunks[1].headingPath).toBe("# Intro > ## Setup");
    expect(chunks[2].headingPath).toBe("# Intro > ## Setup > ### Details");
  });

  it("returns a single chunk when there are no headings", () => {
    const md = "Plain text without headings.";
    const chunks = chunkMarkdown(md, { maxTokens: 200, overlapTokens: 0 });

    expect(chunks.length).toBe(1);
    expect(chunks[0].headingPath).toBe("");
    expect(chunks[0].content).toContain("Plain text");
  });

  it("sub-splits long sections with overlap", () => {
    const paragraphA = repeatWords("alpha", 60);
    const paragraphB = repeatWords("beta", 60);
    const paragraphC = repeatWords("gamma", 60);
    const md = ["# Section", paragraphA, "", paragraphB, "", paragraphC].join("\n");

    const chunks = chunkMarkdown(md, { maxTokens: 80, overlapTokens: 20 });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].headingPath).toBe("# Section");
    expect(chunks[1].headingPath).toBe("# Section");

    const first = chunks[0].content;
    const second = chunks[1].content;
    expect(second).toContain("beta");
    expect(first).toContain("alpha");
  });
});
