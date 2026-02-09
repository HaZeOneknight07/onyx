import { pgTable, uuid, text, timestamp, integer, vector } from "drizzle-orm/pg-core";
import { documentVersions } from "./documents";

export const chunks = pgTable("chunks", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentVersionId: uuid("document_version_id")
    .notNull()
    .references(() => documentVersions.id, { onDelete: "cascade" }),
  chunkIndex: integer("chunk_index").notNull(),
  headingPath: text("heading_path"),
  content: text("content").notNull(),
  tokenCount: integer("token_count").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const chunkEmbeddings = pgTable("chunk_embeddings", {
  id: uuid("id").primaryKey().defaultRandom(),
  chunkId: uuid("chunk_id")
    .notNull()
    .references(() => chunks.id, { onDelete: "cascade" }),
  embedding: vector("embedding", { dimensions: 768 }).notNull(),
  model: text("model").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
