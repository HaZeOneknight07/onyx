import { Hono } from "hono";
import { z } from "zod";
import { sql, eq, and, inArray, desc } from "drizzle-orm";
import { db, chunks, chunkEmbeddings, documentVersions, documents } from "@onyx/db";
import { validate } from "../lib/validate";
import type { AuthEnv } from "../middleware/auth";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const EMBED_MODEL = "nomic-embed-text";

export const searchSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
  semanticWeight: z.number().min(0).max(1).optional().default(0.7),
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

export const searchRoutes = new Hono<AuthEnv>().post("/", async (c) => {
  const projectId = c.req.param("projectId")!;
  const body = validate(searchSchema, await c.req.json());

  const queryEmbedding = await getQueryEmbedding(body.query);
  const embeddingLiteral = `[${queryEmbedding.join(",")}]`;

  // Build filter conditions
  const conditions = [eq(documents.projectId, projectId)];
  if (body.filters?.docTypes?.length) {
    conditions.push(inArray(documents.type, body.filters.docTypes as any));
  }
  if (body.filters?.status?.length) {
    conditions.push(inArray(documents.status, body.filters.status as any));
  }

  const sw = body.semanticWeight ?? 0.7;
  const tw = 1 - sw;

  // Use parameterized query via drizzle sql template
  const tagFilter = body.filters?.tags?.length
    ? sql`AND d.tags && ${body.filters.tags}`
    : sql``;

  const typeFilter = body.filters?.docTypes?.length
    ? sql`AND d.type = ANY(${body.filters.docTypes})`
    : sql``;

  const statusFilter = body.filters?.status?.length
    ? sql`AND d.status = ANY(${body.filters.status})`
    : sql``;

  const results = await db.execute(sql`
    WITH semantic AS (
      SELECT
        c.id AS chunk_id,
        1 - (ce.embedding <=> ${embeddingLiteral}::vector) AS semantic_score
      FROM chunks c
      JOIN chunk_embeddings ce ON ce.chunk_id = c.id
    ),
    fulltext AS (
      SELECT
        c.id AS chunk_id,
        ts_rank(to_tsvector('english', c.content), plainto_tsquery('english', ${body.query})) AS text_score
      FROM chunks c
      WHERE to_tsvector('english', c.content) @@ plainto_tsquery('english', ${body.query})
    )
    SELECT
      c.id AS chunk_id,
      c.document_version_id,
      c.content,
      c.heading_path,
      c.chunk_index,
      c.token_count,
      COALESCE(s.semantic_score, 0) AS semantic_score,
      COALESCE(f.text_score, 0) AS text_score,
      (${sw} * COALESCE(s.semantic_score, 0) + ${tw} * COALESCE(f.text_score, 0)) AS combined_score,
      d.id AS document_id,
      d.title AS document_title,
      d.type AS document_type,
      d.status AS document_status,
      d.tags AS document_tags
    FROM chunks c
    JOIN document_versions dv ON dv.id = c.document_version_id
    JOIN documents d ON d.id = dv.document_id
    LEFT JOIN semantic s ON s.chunk_id = c.id
    LEFT JOIN fulltext f ON f.chunk_id = c.id
    WHERE d.project_id = ${projectId}
      ${typeFilter}
      ${statusFilter}
      ${tagFilter}
      AND (s.chunk_id IS NOT NULL OR f.chunk_id IS NOT NULL)
    ORDER BY combined_score DESC
    LIMIT ${body.limit}
  `);

  const searchResults = (results as any[]).map((r) => ({
    chunkId: r.chunk_id,
    documentId: r.document_id,
    documentTitle: r.document_title,
    documentType: r.document_type,
    documentStatus: r.document_status,
    documentTags: r.document_tags,
    content: r.content,
    headingPath: r.heading_path,
    chunkIndex: r.chunk_index,
    tokenCount: r.token_count,
    semanticScore: parseFloat(r.semantic_score),
    textScore: parseFloat(r.text_score),
    combinedScore: parseFloat(r.combined_score),
  }));

  return c.json({ results: searchResults, query: body.query });
});
