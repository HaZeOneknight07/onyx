import { describe, expect, it } from "bun:test";
import { searchSchema } from "../src/routes/search";

describe("searchSchema", () => {
  it("applies defaults and accepts minimal input", () => {
    const result = searchSchema.parse({ query: "hello" });

    expect(result.query).toBe("hello");
    expect(result.limit).toBe(20);
    expect(result.semanticWeight).toBe(0.7);
    expect(result.filters).toBeUndefined();
  });

  it("rejects empty query and out-of-range values", () => {
    expect(() => searchSchema.parse({ query: "" })).toThrow();
    expect(() => searchSchema.parse({ query: "ok", limit: 0 })).toThrow();
    expect(() => searchSchema.parse({ query: "ok", limit: 101 })).toThrow();
    expect(() => searchSchema.parse({ query: "ok", semanticWeight: -0.1 })).toThrow();
    expect(() => searchSchema.parse({ query: "ok", semanticWeight: 1.1 })).toThrow();
  });

  it("accepts filters with arrays", () => {
    const result = searchSchema.parse({
      query: "test",
      filters: {
        docTypes: ["doc"],
        tags: ["mcp"],
        status: ["draft"],
      },
    });

    expect(result.filters?.docTypes).toEqual(["doc"]);
    expect(result.filters?.tags).toEqual(["mcp"]);
    expect(result.filters?.status).toEqual(["draft"]);
  });
});
