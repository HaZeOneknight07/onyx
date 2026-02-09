import type { Job } from "bullmq";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import { parseHTML } from "linkedom";
import { eq } from "drizzle-orm";
import { db, sources, sourceSnapshots } from "@onyx/db";
import { chunkingQueue } from "@onyx/shared/queues";
import { logger } from "@onyx/shared";
import { createHash } from "crypto";

export interface UrlFetchJobData {
  sourceId: string;
  url: string;
}

export async function processUrlFetch(job: Job<UrlFetchJobData>) {
  const { sourceId, url } = job.data;
  logger.info({ url }, "url-fetch: fetching");

  // Fetch the URL
  const response = await fetch(url, {
    headers: { "User-Agent": "Onyx-Bot/0.1 (onyx)" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const etag = response.headers.get("etag");

  // Parse HTML with linkedom and extract readable content
  const { document } = parseHTML(html);
  const reader = new Readability(document);
  const article = reader.parse();

  if (!article) {
    throw new Error(`Failed to extract readable content from ${url}`);
  }

  // Convert to markdown
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
  });
  const markdown = turndown.turndown(article.content);

  // Compute content hash
  const contentHash = createHash("sha256").update(markdown).digest("hex");

  // Check if content has changed
  const [source] = await db
    .select()
    .from(sources)
    .where(eq(sources.id, sourceId));

  if (!source) {
    logger.warn({ sourceId }, "url-fetch: source not found, skipping");
    return;
  }

  if (source.contentHash === contentHash) {
    logger.info({ url }, "url-fetch: content unchanged, skipping");
    // Still update fetchedAt
    await db
      .update(sources)
      .set({ fetchedAt: new Date() })
      .where(eq(sources.id, sourceId));
    return;
  }

  // Create snapshot
  const [snapshot] = await db
    .insert(sourceSnapshots)
    .values({
      sourceId,
      contentMarkdown: markdown,
      contentHash,
    })
    .returning();

  // Update source record
  await db
    .update(sources)
    .set({
      fetchedAt: new Date(),
      contentHash,
      etag,
      title: source.title || article.title || null,
    })
    .where(eq(sources.id, sourceId));

  logger.info(
    { snapshotId: snapshot.id, sourceId },
    "url-fetch: created snapshot"
  );

  // Queue chunking job for the snapshot content
  // Note: URL snapshots don't have a documentVersionId, so we store the content
  // as a document version first or handle it differently based on your needs.
  // For now, we log completion — chunking integration for sources can be added
  // when the source-to-document pipeline is defined.
  logger.info({ url }, "url-fetch: completed");
}
