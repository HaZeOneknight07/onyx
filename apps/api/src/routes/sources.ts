import { Hono } from "hono";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { db, sources, sourceSnapshots } from "@onyx/db";
import { validate } from "../lib/validate";
import { NotFoundError } from "../lib/errors";
import type { AuthEnv } from "../middleware/auth";
import { emitRealtime } from "../lib/realtime";

const createSourceSchema = z.object({
  url: z.string().url(),
  title: z.string().max(200).optional(),
});

const updateSourceSchema = z.object({
  url: z.string().url().optional(),
  title: z.string().max(200).optional(),
});

export const sourceRoutes = new Hono<AuthEnv>()
  .get("/", async (c) => {
    const projectId = c.req.param("projectId")!;
    const items = await db
      .select()
      .from(sources)
      .where(eq(sources.projectId, projectId));
    return c.json(items);
  })
  .post("/", async (c) => {
    const projectId = c.req.param("projectId")!;
    const body = validate(createSourceSchema, await c.req.json());

    const [source] = await db
      .insert(sources)
      .values({ projectId, url: body.url, title: body.title })
      .returning();

    emitRealtime({
      projectId,
      entity: "sources",
      action: "create",
      id: source.id,
      payload: source,
    });

    return c.json(source, 201);
  })
  .get("/:sourceId", async (c) => {
    const { sourceId } = c.req.param();
    const [source] = await db
      .select()
      .from(sources)
      .where(eq(sources.id, sourceId));
    if (!source) throw new NotFoundError("Source not found");
    return c.json(source);
  })
  .patch("/:sourceId", async (c) => {
    const { sourceId } = c.req.param();
    const body = validate(updateSourceSchema, await c.req.json());

    const [source] = await db
      .update(sources)
      .set(body)
      .where(eq(sources.id, sourceId))
      .returning();

    if (!source) throw new NotFoundError("Source not found");
    emitRealtime({
      projectId: source.projectId,
      entity: "sources",
      action: "update",
      id: source.id,
      payload: source,
    });
    return c.json(source);
  })
  .delete("/:sourceId", async (c) => {
    const { sourceId } = c.req.param();
    const projectId = c.req.param("projectId")!;
    const [source] = await db
      .delete(sources)
      .where(eq(sources.id, sourceId))
      .returning();
    if (!source) throw new NotFoundError("Source not found");
    emitRealtime({
      projectId,
      entity: "sources",
      action: "delete",
      id: source.id,
      payload: source,
    });
    return c.json({ success: true });
  })
  .get("/:sourceId/snapshots", async (c) => {
    const { sourceId } = c.req.param();
    const snapshots = await db
      .select()
      .from(sourceSnapshots)
      .where(eq(sourceSnapshots.sourceId, sourceId))
      .orderBy(desc(sourceSnapshots.fetchedAt));
    return c.json(snapshots);
  });
