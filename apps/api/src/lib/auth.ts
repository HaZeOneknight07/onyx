import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@onyx/db";
import { users, sessions, accounts, verifications } from "@onyx/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.WEB_URL ||
    "http://localhost:5173",
  trustedOrigins: [
    process.env.WEB_URL,
    process.env.BETTER_AUTH_URL,
    "http://localhost:5173",
  ].filter(Boolean),
  secret: process.env.BETTER_AUTH_SECRET,
});
