import { Hono } from "hono";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { db, documents, documentVersions, relations } from "@onyx/db";
import { validate } from "../lib/validate";
import { NotFoundError } from "../lib/errors";
import type { AuthEnv } from "../middleware/auth";
import { createHash } from "crypto";
import { chunkingQueue } from "@onyx/shared/queues";
import { emitRealtime } from "../lib/realtime";

const createDocSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(["doc", "note", "adr", "lesson", "snippet"]).default("doc"),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
  pinned: z.boolean().optional(),
});

const updateDocSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  type: z.enum(["doc", "note", "adr", "lesson", "snippet"]).optional(),
  content: z.string().min(1).optional(),
  status: z.enum(["draft", "approved", "deprecated"]).optional(),
  tags: z.array(z.string()).optional(),
  pinned: z.boolean().optional(),
  changeReason: z.string().optional(),
});

function contentHash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export const documentRoutes = new Hono<AuthEnv>()
  .get("/", async (c) => {
    const projectId = c.req.param("projectId")!;
    const docs = await db
      .select()
      .from(documents)
      .where(eq(documents.projectId, projectId))
      .orderBy(desc(documents.updatedAt));
    return c.json(docs);
  })
  .post("/", async (c) => {
    const projectId = c.req.param("projectId")!;
    const userId = c.get("userId");
    const body = validate(createDocSchema, await c.req.json());

    const [doc] = await db
      .insert(documents)
      .values({
        projectId,
        title: body.title,
        type: body.type,
        tags: body.tags,
        pinned: body.pinned,
        createdBy: userId,
      })
      .returning();

    const [version] = await db
      .insert(documentVersions)
      .values({
        documentId: doc.id,
        version: 1,
        contentMarkdown: body.content,
        contentHash: contentHash(body.content),
        createdBy: userId,
      })
      .returning();

    await chunkingQueue.add("chunk", { documentId: doc.id, versionId: version.id });

    emitRealtime({
      projectId,
      entity: "documents",
      action: "create",
      id: doc.id,
      payload: { ...doc, currentVersion: version },
    });

    return c.json({ ...doc, currentVersion: version }, 201);
  })
  .get("/:docId", async (c) => {
    const { docId } = c.req.param();
    const [doc] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, docId));
    if (!doc) throw new NotFoundError("Document not found");

    const [latestVersion] = await db
      .select()
      .from(documentVersions)
      .where(eq(documentVersions.documentId, docId))
      .orderBy(desc(documentVersions.version))
      .limit(1);

    return c.json({ ...doc, currentVersion: latestVersion });
  })
  .patch("/:docId", async (c) => {
    const { docId } = c.req.param();
    const userId = c.get("userId");
    const body = validate(updateDocSchema, await c.req.json());

    const [existing] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, docId));
    if (!existing) throw new NotFoundError("Document not found");

    const updates: Record<string, any> = { updatedAt: new Date() };
    if (body.title) updates.title = body.title;
    if (body.type) updates.type = body.type;
    if (body.status) updates.status = body.status;
    if (body.tags) updates.tags = body.tags;
    if (body.pinned !== undefined) updates.pinned = body.pinned;

    const [doc] = await db
      .update(documents)
      .set(updates)
      .where(eq(documents.id, docId))
      .returning();

    let version;
    if (body.content) {
      const [latestVersion] = await db
        .select()
        .from(documentVersions)
        .where(eq(documentVersions.documentId, docId))
        .orderBy(desc(documentVersions.version))
        .limit(1);

      [version] = await db
        .insert(documentVersions)
        .values({
          documentId: docId,
          version: (latestVersion?.version ?? 0) + 1,
          contentMarkdown: body.content,
          contentHash: contentHash(body.content),
          changeReason: body.changeReason,
          createdBy: userId,
        })
        .returning();

      await chunkingQueue.add("chunk", { documentId: docId, versionId: version.id });
    }

    emitRealtime({
      projectId: doc.projectId,
      entity: "documents",
      action: "update",
      id: doc.id,
      payload: { ...doc, currentVersion: version },
    });

    return c.json({ ...doc, currentVersion: version });
  })
  .delete("/:docId", async (c) => {
    const { docId } = c.req.param();
    const projectId = c.req.param("projectId")!;
    const [doc] = await db
      .delete(documents)
      .where(eq(documents.id, docId))
      .returning();
    if (!doc) throw new NotFoundError("Document not found");
    emitRealtime({
      projectId,
      entity: "documents",
      action: "delete",
      id: doc.id,
      payload: doc,
    });
    return c.json({ success: true });
  })
  .get("/:docId/versions", async (c) => {
    const { docId } = c.req.param();
    const versions = await db
      .select()
      .from(documentVersions)
      .where(eq(documentVersions.documentId, docId))
      .orderBy(desc(documentVersions.version));
    return c.json(versions);
  })
  .get("/:docId/backlinks", async (c) => {
    const { docId } = c.req.param();
    const backlinks = await db
      .select()
      .from(relations)
      .where(eq(relations.targetDocId, docId));
    return c.json(backlinks);
  });
