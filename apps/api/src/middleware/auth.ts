import type { MiddlewareHandler } from "hono";
import { UnauthorizedError } from "../lib/errors";
import { db, apiTokens } from "@onyx/db";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";
import { auth } from "../lib/auth";

export type AuthEnv = {
  Variables: {
    userId: string;
    projectId?: string;
    isGlobalToken?: boolean;
  };
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const authMiddleware: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const authHeader = c.req.header("Authorization");

  // Try API token auth (ist_ prefix)
  if (authHeader?.startsWith("Bearer ist_")) {
    const token = authHeader.slice(7); // "Bearer " = 7 chars
    const hash = hashToken(token);

    const [apiToken] = await db
      .select()
      .from(apiTokens)
      .where(eq(apiTokens.tokenHash, hash));

    if (!apiToken) throw new UnauthorizedError("Invalid API token");
    if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
      throw new UnauthorizedError("API token expired");
    }

    // Update last used
    await db
      .update(apiTokens)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiTokens.id, apiToken.id));

    c.set("userId", apiToken.userId);
    if (apiToken.projectId) {
      c.set("projectId", apiToken.projectId);
      c.set("isGlobalToken", false);
    } else {
      c.set("isGlobalToken", true);
    }
    return next();
  }

  // Try Better Auth session
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (session?.user) {
    c.set("userId", session.user.id);
    c.set("isGlobalToken", false);
    return next();
  }

  throw new UnauthorizedError();
};
