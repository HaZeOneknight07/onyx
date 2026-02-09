import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { documents } from "./documents";
import { users } from "./users";

export const taskStatusEnum = pgEnum("task_status", [
  "todo",
  "doing",
  "blocked",
  "done",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: taskStatusEnum("status").notNull().default("todo"),
  priority: taskPriorityEnum("priority").notNull().default("medium"),
  tags: text("tags").array(),
  linkedDocId: uuid("linked_doc_id").references(() => documents.id),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
