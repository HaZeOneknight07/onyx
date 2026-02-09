import { Hono } from "hono";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, sources } from "@onyx/db";
import { urlFetchQueue } from "@onyx/shared/queues";
import { validate } from "../lib/validate";
import { NotFoundError } from "../lib/errors";
import type { AuthEnv } from "../middleware/auth";

const ingestSchema = z
  .object({
    sourceId: z.string().uuid().optional(),
    url: z.string().url().optional(),
    title: z.string().max(200).optional(),
  })
  .refine((data) => data.sourceId || data.url, {
    message: "Either sourceId or url must be provided",
  });

export const ingestRoutes = new Hono<AuthEnv>().post("/", async (c) => {
  const projectId = c.req.param("projectId")!;
  const body = validate(ingestSchema, await c.req.json());

  let sourceId: string;
  let url: string;

  if (body.sourceId) {
    // Use existing source
    const [source] = await db
      .select()
      .from(sources)
      .where(eq(sources.id, body.sourceId));
    if (!source) throw new NotFoundError("Source not found");
    sourceId = source.id;
    url = source.url;
  } else {
    // Create a new source
    const [source] = await db
      .insert(sources)
      .values({
        projectId,
        url: body.url!,
        title: body.title,
      })
      .returning();
    sourceId = source.id;
    url = source.url;
  }

  const job = await urlFetchQueue.add("fetch", { sourceId, url });

  return c.json(
    {
      jobId: job.id,
      sourceId,
      status: "queued" as const,
    },
    202
  );
});
