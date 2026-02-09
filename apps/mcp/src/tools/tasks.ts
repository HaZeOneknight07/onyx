import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OnyxClient } from "@onyx/sdk";

export function registerTaskTools(server: McpServer, client: OnyxClient) {
  server.tool(
    "task_list",
    "List tasks in a project",
    {
      projectId: z.string().describe("The project ID"),
    },
    async ({ projectId }) => {
      const tasks = await client.listTasks(projectId);
      return {
        content: [{ type: "text", text: JSON.stringify(tasks, null, 2) }],
      };
    }
  );

  server.tool(
    "task_create",
    "Create a new task in a project",
    {
      projectId: z.string().describe("The project ID"),
      title: z.string().describe("Task title"),
      description: z.string().optional().describe("Task description"),
      priority: z
        .enum(["low", "medium", "high", "urgent"])
        .optional()
        .describe("Task priority (default: medium)"),
      tags: z.array(z.string()).optional().describe("Tags for the task"),
      linkedDocId: z
        .string()
        .optional()
        .describe("ID of a linked document"),
    },
    async ({ projectId, title, description, priority, tags, linkedDocId }) => {
      const task = await client.createTask(projectId, {
        title,
        description,
        priority,
        tags,
        linkedDocId,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(task, null, 2) }],
      };
    }
  );

  server.tool(
    "task_update",
    "Update an existing task's status or details",
    {
      projectId: z.string().describe("The project ID"),
      taskId: z.string().describe("The task ID"),
      title: z.string().optional().describe("New title"),
      description: z.string().optional().describe("New description"),
      status: z
        .enum(["todo", "doing", "blocked", "done"])
        .optional()
        .describe("New status"),
      priority: z
        .enum(["low", "medium", "high", "urgent"])
        .optional()
        .describe("New priority"),
      tags: z.array(z.string()).optional().describe("New tags"),
      linkedDocId: z
        .string()
        .nullable()
        .optional()
        .describe("Linked document ID (null to unlink)"),
    },
    async ({ projectId, taskId, ...updates }) => {
      const task = await client.updateTask(projectId, taskId, updates);
      return {
        content: [{ type: "text", text: JSON.stringify(task, null, 2) }],
      };
    }
  );

  server.tool(
    "task_delete",
    "Delete a task by ID",
    {
      projectId: z.string().describe("The project ID"),
      taskId: z.string().describe("The task ID"),
    },
    async ({ projectId, taskId }) => {
      const result = await client.deleteTask(projectId, taskId);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
