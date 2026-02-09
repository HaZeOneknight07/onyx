import { pgTable, uuid, text, timestamp, pgEnum, boolean, integer } from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { users } from "./users";

export const documentTypeEnum = pgEnum("document_type", [
  "doc",
  "note",
  "adr",
  "lesson",
  "snippet",
]);

export const documentStatusEnum = pgEnum("document_status", [
  "draft",
  "approved",
  "deprecated",
]);

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  type: documentTypeEnum("type").notNull().default("doc"),
  title: text("title").notNull(),
  status: documentStatusEnum("status").notNull().default("draft"),
  pinned: boolean("pinned").notNull().default(false),
  tags: text("tags").array(),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const documentVersions = pgTable("document_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  contentMarkdown: text("content_markdown").notNull(),
  contentHash: text("content_hash").notNull(),
  changeReason: text("change_reason"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
