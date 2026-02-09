import { Hono } from "hono";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, projects, projectMembers } from "@onyx/db";
import { validate } from "../lib/validate";
import { NotFoundError } from "../lib/errors";
import type { AuthEnv } from "../middleware/auth";

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
});

export const projectRoutes = new Hono<AuthEnv>()
  .get("/", async (c) => {
    const userId = c.get("userId");
    const userProjects = await db
      .select({ project: projects })
      .from(projects)
      .innerJoin(projectMembers, eq(projects.id, projectMembers.projectId))
      .where(eq(projectMembers.userId, userId));
    return c.json(userProjects.map((r) => r.project));
  })
  .post("/", async (c) => {
    const userId = c.get("userId");
    const body = validate(createProjectSchema, await c.req.json());

    const [project] = await db.insert(projects).values(body).returning();
    await db.insert(projectMembers).values({
      projectId: project.id,
      userId,
      role: "owner",
    });

    return c.json(project, 201);
  })
  .get("/:projectId", async (c) => {
    const { projectId } = c.req.param();
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));
    if (!project) throw new NotFoundError("Project not found");
    return c.json(project);
  })
  .patch("/:projectId", async (c) => {
    const { projectId } = c.req.param();
    const body = validate(updateProjectSchema, await c.req.json());

    const [project] = await db
      .update(projects)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(projects.id, projectId))
      .returning();

    if (!project) throw new NotFoundError("Project not found");
    return c.json(project);
  })
  .delete("/:projectId", async (c) => {
    const { projectId } = c.req.param();
    const [project] = await db
      .delete(projects)
      .where(eq(projects.id, projectId))
      .returning();
    if (!project) throw new NotFoundError("Project not found");
    return c.json({ success: true });
  });
