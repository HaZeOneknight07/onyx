import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OnyxClient } from "@onyx/sdk";

export function registerSessionTools(server: McpServer, client: OnyxClient) {
  server.tool(
    "session_start",
    "Log the start of an agent session",
    {
      projectId: z.string().describe("The project ID"),
      sessionId: z.string().describe("Unique session identifier"),
      payload: z
        .record(z.unknown())
        .optional()
        .describe("Optional metadata (e.g. agent name, task description)"),
    },
    async ({ projectId, sessionId, payload }) => {
      const event = await client.createAgentEvent(projectId, {
        sessionId,
        eventType: "session_start",
        payload,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(event, null, 2) }],
      };
    }
  );

  server.tool(
    "session_end",
    "Log the end of an agent session with an optional summary",
    {
      projectId: z.string().describe("The project ID"),
      sessionId: z.string().describe("Session identifier from session_start"),
      summary: z.string().optional().describe("Summary of what was accomplished"),
      payload: z
        .record(z.unknown())
        .optional()
        .describe("Optional metadata (e.g. stats, errors)"),
    },
    async ({ projectId, sessionId, summary, payload }) => {
      const event = await client.createAgentEvent(projectId, {
        sessionId,
        eventType: "session_end",
        payload: { ...payload, summary },
      });
      return {
        content: [{ type: "text", text: JSON.stringify(event, null, 2) }],
      };
    }
  );
}
