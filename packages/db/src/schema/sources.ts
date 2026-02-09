import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { projects } from "./projects";

export const sources = pgTable("sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  title: text("title"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }),
  etag: text("etag"),
  contentHash: text("content_hash"),
});

export const sourceSnapshots = pgTable("source_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceId: uuid("source_id")
    .notNull()
    .references(() => sources.id, { onDelete: "cascade" }),
  contentMarkdown: text("content_markdown").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  contentHash: text("content_hash").notNull(),
});
