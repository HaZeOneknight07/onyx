import type { MiddlewareHandler } from "hono";
import { ForbiddenError, NotFoundError } from "../lib/errors";
import { db, projects, projectMembers } from "@onyx/db";
import { and, eq } from "drizzle-orm";
import type { AuthEnv } from "./auth";

export const projectScope: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const projectId = c.req.param("projectId");
  if (!projectId) return next();

  const userId = c.get("userId");
  const tokenProjectId = c.get("projectId");
  const isGlobalToken = c.get("isGlobalToken") === true;

  if (tokenProjectId && tokenProjectId !== projectId) {
    throw new ForbiddenError("Token is not authorized for this project");
  }

  if (isGlobalToken) {
    return next();
  }

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  const [membership] = await db
    .select({ userId: projectMembers.userId })
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));

  if (!membership) {
    throw new ForbiddenError("User is not a member of this project");
  }

  return next();
};
