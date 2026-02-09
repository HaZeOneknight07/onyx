import { Hono } from "hono";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { db } from "@onyx/db";
import { estimateTokens } from "@onyx/shared";
import { validate } from "../lib/validate";
import type { AuthEnv } from "../middleware/auth";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const EMBED_MODEL = "nomic-embed-text";
const DEFAULT_MAX_TOKENS = 8000;
const SEARCH_POOL_SIZE = 50;

const contextPackSchema = z.object({
  query: z.string().min(1),
  maxTokens: z.number().int().min(100).max(100000).optional().default(DEFAULT_MAX_TOKENS),
  includeMetadata: z.boolean().optional().default(true),
  filters: z
    .object({
      docTypes: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      status: z.array(z.string()).optional(),
    })
    .optional(),
});

async function getQueryEmbedding(text: string): Promise<number[]> {
  const res = await fetch(`${OLLAMA_URL}/api/embed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBED_MODEL, input: text }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Ollama embed error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as { embeddings: number[][] };
  return data.embeddings[0];
}

export const contextRoutes = new Hono<AuthEnv>().post("/packs", async (c) => {
  const projectId = c.req.param("projectId")!;
  const body = validate(contextPackSchema, await c.req.json());

  const queryEmbedding = await getQueryEmbedding(body.query);
  const embeddingLiteral = `[${queryEmbedding.join(",")}]`;

  const tagFilter = body.filters?.tags?.length
    ? sql`AND d.tags && ${body.filters.tags}`
    : sql``;

  const typeFilter = body.filters?.docTypes?.length
    ? sql`AND d.type = ANY(${body.filters.docTypes})`
    : sql``;

  const statusFilter = body.filters?.status?.length
    ? sql`AND d.status = ANY(${body.filters.status})`
    : sql``;

  // Fetch top N chunks by semantic similarity
  const results = await db.execute(sql`
    SELECT
      c.id AS chunk_id,
      c.content,
      c.heading_path,
      c.chunk_index,
      c.token_count,
      1 - (ce.embedding <=> ${embeddingLiteral}::vector) AS score,
      d.id AS document_id,
      d.title AS document_title,
      d.type AS document_type
    FROM chunks c
    JOIN chunk_embeddings ce ON ce.chunk_id = c.id
    JOIN document_versions dv ON dv.id = c.document_version_id
    JOIN documents d ON d.id = dv.document_id
    WHERE d.project_id = ${projectId}
      ${typeFilter}
      ${statusFilter}
      ${tagFilter}
    ORDER BY ce.embedding <=> ${embeddingLiteral}::vector ASC
    LIMIT ${SEARCH_POOL_SIZE}
  `);

  // Greedily pack chunks into token budget
  const rows = results as any[];
  let totalTokens = 0;
  const packed: any[] = [];

  for (const row of rows) {
    const chunkTokens = parseInt(row.token_count, 10);
    if (totalTokens + chunkTokens > (body.maxTokens ?? DEFAULT_MAX_TOKENS)) break;
    packed.push(row);
    totalTokens += chunkTokens;
  }

  // Build markdown output
  const markdownParts: string[] = [];

  for (const row of packed) {
    if (body.includeMetadata) {
      const meta = [`**${row.document_title}**`, `_Type: ${row.document_type}_`];
      if (row.heading_path) meta.push(`_Path: ${row.heading_path}_`);
      markdownParts.push(meta.join(" | "));
    }
    markdownParts.push(row.content);
    markdownParts.push("---");
  }

  const markdown = markdownParts.join("\n\n");

  return c.json({
    markdown,
    tokenCount: totalTokens,
    chunkCount: packed.length,
    query: body.query,
  });
});
