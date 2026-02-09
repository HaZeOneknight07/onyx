import { Hono } from "hono";
import { z } from "zod";
import { eq, and, or, inArray } from "drizzle-orm";
import { db, relations, documents } from "@onyx/db";
import { validate } from "../lib/validate";
import { NotFoundError, ValidationError } from "../lib/errors";
import type { AuthEnv } from "../middleware/auth";
import { emitRealtime } from "../lib/realtime";

const createRelationSchema = z.object({
  sourceDocId: z.string().uuid(),
  targetDocId: z.string().uuid(),
  relationType: z.string().min(1),
});

export const relationRoutes = new Hono<AuthEnv>()
  .get("/", async (c) => {
    const projectId = c.req.param("projectId")!;
    const sourceDocId = c.req.query("sourceDocId");
    const targetDocId = c.req.query("targetDocId");

    // Get all doc IDs in this project for scoping
    const projectDocs = await db
      .select({ id: documents.id })
      .from(documents)
      .where(eq(documents.projectId, projectId));
    const docIds = projectDocs.map((d) => d.id);

    if (docIds.length === 0) return c.json([]);

    const conditions = [inArray(relations.sourceDocId, docIds)];
    if (sourceDocId) conditions.push(eq(relations.sourceDocId, sourceDocId));
    if (targetDocId) conditions.push(eq(relations.targetDocId, targetDocId));

    const items = await db
      .select()
      .from(relations)
      .where(and(...conditions));

    return c.json(items);
  })
  .post("/", async (c) => {
    const projectId = c.req.param("projectId")!;
    const body = validate(createRelationSchema, await c.req.json());

    // Validate both docs belong to the project
    const docs = await db
      .select({ id: documents.id })
      .from(documents)
      .where(
        and(
          eq(documents.projectId, projectId),
          or(
            eq(documents.id, body.sourceDocId),
            eq(documents.id, body.targetDocId)
          )
        )
      );

    const foundIds = new Set(docs.map((d) => d.id));
    if (!foundIds.has(body.sourceDocId) || !foundIds.has(body.targetDocId)) {
      throw new ValidationError(
        "Both documents must belong to the current project"
      );
    }

    const [relation] = await db
      .insert(relations)
      .values({
        sourceDocId: body.sourceDocId,
        targetDocId: body.targetDocId,
        relationType: body.relationType,
      })
      .returning();

    emitRealtime({
      projectId,
      entity: "relations",
      action: "create",
      id: relation.id,
      payload: relation,
    });

    return c.json(relation, 201);
  })
  .delete("/:relationId", async (c) => {
    const { relationId } = c.req.param();
    const projectId = c.req.param("projectId")!;
    const [relation] = await db
      .delete(relations)
      .where(eq(relations.id, relationId))
      .returning();
    if (!relation) throw new NotFoundError("Relation not found");
    emitRealtime({
      projectId,
      entity: "relations",
      action: "delete",
      id: relation.id,
      payload: relation,
    });
    return c.json({ success: true });
  });
