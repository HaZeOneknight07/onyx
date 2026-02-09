import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { documents } from "./documents";

export const relations = pgTable("relations", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceDocId: uuid("source_doc_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  targetDocId: uuid("target_doc_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  relationType: text("relation_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
