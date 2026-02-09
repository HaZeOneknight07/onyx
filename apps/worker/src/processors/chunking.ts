import type { Job } from "bullmq";
import { eq } from "drizzle-orm";
import { db, documentVersions, chunks } from "@onyx/db";
import { chunkMarkdown, logger } from "@onyx/shared";
import { embeddingsQueue } from "@onyx/shared/queues";

export interface ChunkingJobData {
  documentId: string;
  versionId: string;
}

export async function processChunking(job: Job<ChunkingJobData>) {
  const { documentId, versionId } = job.data;
  logger.info({ documentId, versionId }, "chunking: processing document version");

  // Fetch the document version content
  const [version] = await db
    .select()
    .from(documentVersions)
    .where(eq(documentVersions.id, versionId));

  if (!version) {
    logger.warn({ versionId }, "chunking: version not found, skipping");
    return;
  }

  // Delete old chunks for this version (re-chunking support)
  await db.delete(chunks).where(eq(chunks.documentVersionId, versionId));

  // Run chunking
  const chunkResults = chunkMarkdown(version.contentMarkdown);
  logger.info(
    { versionId, chunkCount: chunkResults.length },
    "chunking: generated chunks"
  );

  if (chunkResults.length === 0) return;

  // Insert chunks
  const inserted = await db
    .insert(chunks)
    .values(
      chunkResults.map((c) => ({
        documentVersionId: versionId,
        chunkIndex: c.chunkIndex,
        headingPath: c.headingPath || null,
        content: c.content,
        tokenCount: c.tokenCount,
      }))
    )
    .returning();

  // Queue embedding jobs for each chunk
  await embeddingsQueue.addBulk(
    inserted.map((chunk) => ({
      name: "embed",
      data: { chunkId: chunk.id, content: chunk.content },
    }))
  );

  logger.info(
    { versionId, queuedCount: inserted.length },
    "chunking: queued embedding jobs"
  );
}
