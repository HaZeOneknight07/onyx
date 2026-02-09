import { Hono } from "hono";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db, apiTokens } from "@onyx/db";
import { validate } from "../lib/validate";
import { NotFoundError } from "../lib/errors";
import type { AuthEnv } from "../middleware/auth";
import { randomBytes, createHash } from "crypto";

const createTokenSchema = z.object({
  name: z.string().min(1).max(100),
  projectId: z.string().uuid().optional().nullable(),
  expiresAt: z.string().datetime().optional(),
});

function generateToken(): { token: string; hash: string; prefix: string } {
  const raw = randomBytes(32).toString("hex");
  const token = `ist_${raw}`;
  const hash = createHash("sha256").update(token).digest("hex");
  const prefix = `ist_${raw.slice(0, 8)}`;
  return { token, hash, prefix };
}

export const tokenRoutes = new Hono<AuthEnv>()
  .get("/", async (c) => {
    const userId = c.get("userId");
    const tokens = await db
      .select({
        id: apiTokens.id,
        name: apiTokens.name,
        projectId: apiTokens.projectId,
        prefix: apiTokens.prefix,
        lastUsedAt: apiTokens.lastUsedAt,
        expiresAt: apiTokens.expiresAt,
        createdAt: apiTokens.createdAt,
      })
      .from(apiTokens)
      .where(eq(apiTokens.userId, userId));
    return c.json(tokens);
  })
  .post("/", async (c) => {
    const userId = c.get("userId");
    const body = validate(createTokenSchema, await c.req.json());
    const { token, hash, prefix } = generateToken();

    const [created] = await db
      .insert(apiTokens)
      .values({
        userId,
        projectId: body.projectId ?? null,
        name: body.name,
        tokenHash: hash,
        prefix,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      })
      .returning({
        id: apiTokens.id,
        name: apiTokens.name,
        projectId: apiTokens.projectId,
        prefix: apiTokens.prefix,
        expiresAt: apiTokens.expiresAt,
        createdAt: apiTokens.createdAt,
      });

    // Return the raw token only on creation
    return c.json({ ...created, token }, 201);
  })
  .delete("/:tokenId", async (c) => {
    const userId = c.get("userId");
    const { tokenId } = c.req.param();

    const [deleted] = await db
      .delete(apiTokens)
      .where(and(eq(apiTokens.id, tokenId), eq(apiTokens.userId, userId)))
      .returning();

    if (!deleted) throw new NotFoundError("Token not found");
    return c.json({ success: true });
  });
