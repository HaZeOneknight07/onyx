import { Hono } from "hono";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db, tasks } from "@onyx/db";
import { validate } from "../lib/validate";
import { NotFoundError } from "../lib/errors";
import type { AuthEnv } from "../middleware/auth";
import { emitRealtime } from "../lib/realtime";

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  tags: z.array(z.string()).optional(),
  linkedDocId: z.string().uuid().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(["todo", "doing", "blocked", "done"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  tags: z.array(z.string()).optional(),
  linkedDocId: z.string().uuid().nullable().optional(),
});

export const taskRoutes = new Hono<AuthEnv>()
  .get("/", async (c) => {
    const projectId = c.req.param("projectId")!;
    const projectTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .orderBy(desc(tasks.createdAt));
    return c.json(projectTasks);
  })
  .post("/", async (c) => {
    const projectId = c.req.param("projectId")!;
    const userId = c.get("userId");
    const body = validate(createTaskSchema, await c.req.json());

    const [task] = await db
      .insert(tasks)
      .values({
        projectId,
        title: body.title,
        description: body.description,
        priority: body.priority,
        tags: body.tags,
        linkedDocId: body.linkedDocId,
        createdBy: userId,
      })
      .returning();

    emitRealtime({
      projectId,
      entity: "tasks",
      action: "create",
      id: task.id,
      payload: task,
    });

    return c.json(task, 201);
  })
  .get("/:taskId", async (c) => {
    const { taskId } = c.req.param();
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId));
    if (!task) throw new NotFoundError("Task not found");
    return c.json(task);
  })
  .patch("/:taskId", async (c) => {
    const { taskId } = c.req.param();
    const body = validate(updateTaskSchema, await c.req.json());

    const [task] = await db
      .update(tasks)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(tasks.id, taskId))
      .returning();

    if (!task) throw new NotFoundError("Task not found");
    emitRealtime({
      projectId: task.projectId,
      entity: "tasks",
      action: "update",
      id: task.id,
      payload: task,
    });
    return c.json(task);
  })
  .delete("/:taskId", async (c) => {
    const { taskId } = c.req.param();
    const projectId = c.req.param("projectId")!;
    const [task] = await db
      .delete(tasks)
      .where(eq(tasks.id, taskId))
      .returning();
    if (!task) throw new NotFoundError("Task not found");
    emitRealtime({
      projectId,
      entity: "tasks",
      action: "delete",
      id: task.id,
      payload: task,
    });
    return c.json({ success: true });
  });
