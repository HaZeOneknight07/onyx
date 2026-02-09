import { Hono } from "hono";
import { z } from "zod";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { db, agentEvents } from "@onyx/db";
import { validate } from "../lib/validate";
import type { AuthEnv } from "../middleware/auth";
import { emitRealtime } from "../lib/realtime";

const createEventSchema = z.object({
  sessionId: z.string().uuid().optional(),
  eventType: z.string().min(1),
  payload: z.record(z.unknown()).optional(),
});

export const agentEventRoutes = new Hono<AuthEnv>()
  .get("/", async (c) => {
    const projectId = c.req.param("projectId")!;
    const eventType = c.req.query("eventType");
    const sessionId = c.req.query("sessionId");
    const from = c.req.query("from");
    const to = c.req.query("to");

    const conditions = [eq(agentEvents.projectId, projectId)];
    if (eventType) conditions.push(eq(agentEvents.eventType, eventType));
    if (sessionId) conditions.push(eq(agentEvents.sessionId, sessionId));
    if (from) conditions.push(gte(agentEvents.createdAt, new Date(from)));
    if (to) conditions.push(lte(agentEvents.createdAt, new Date(to)));

    const events = await db
      .select()
      .from(agentEvents)
      .where(and(...conditions))
      .orderBy(desc(agentEvents.createdAt));

    return c.json(events);
  })
  .post("/", async (c) => {
    const projectId = c.req.param("projectId")!;
    const body = validate(createEventSchema, await c.req.json());

    const [event] = await db
      .insert(agentEvents)
      .values({
        projectId,
        sessionId: body.sessionId,
        eventType: body.eventType,
        payload: body.payload,
      })
      .returning();

    emitRealtime({
      projectId,
      entity: "audit",
      action: "create",
      id: event.id,
      payload: event,
    });

    return c.json(event, 201);
  });
