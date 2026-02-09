import type { Job } from "bullmq";
import { db, chunkEmbeddings } from "@onyx/db";
import { logger } from "@onyx/shared";

export interface EmbeddingsJobData {
  chunkId: string;
  content: string;
}

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const EMBED_MODEL = "nomic-embed-text";

async function getEmbedding(text: string): Promise<number[]> {
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

export async function processEmbeddings(job: Job<EmbeddingsJobData>) {
  const { chunkId, content } = job.data;
  logger.info({ chunkId }, "embeddings: processing chunk");

  const embedding = await getEmbedding(content);

  await db.insert(chunkEmbeddings).values({
    chunkId,
    embedding,
    model: EMBED_MODEL,
  });

  logger.info(
    { chunkId, dimensions: embedding.length },
    "embeddings: stored embedding"
  );
}
