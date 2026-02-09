import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OnyxClient } from "@onyx/sdk";

export function registerSearchTools(server: McpServer, client: OnyxClient) {
  server.tool(
    "search",
    "Semantic search within a project's documents",
    {
      projectId: z.string().describe("The project ID to search within"),
      query: z.string().describe("Search query"),
      limit: z.number().optional().describe("Max results to return (default 10)"),
      filters: z
        .object({
          docTypes: z.array(z.string()).optional(),
          tags: z.array(z.string()).optional(),
          status: z.array(z.string()).optional(),
        })
        .optional()
        .describe("Optional filters for document type, tags, or status"),
    },
    async ({ projectId, query, limit, filters }) => {
      const response = await client.search(projectId, {
        query,
        limit,
        filters,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
      };
    }
  );

  server.tool(
    "context_pack",
    "Generate a token-budgeted context pack from relevant documents",
    {
      projectId: z.string().describe("The project ID"),
      query: z.string().describe("Query to find relevant context for"),
      maxTokens: z
        .number()
        .optional()
        .describe("Maximum token budget (default 4000)"),
      filters: z
        .object({
          docTypes: z.array(z.string()).optional(),
          tags: z.array(z.string()).optional(),
          status: z.array(z.string()).optional(),
        })
        .optional()
        .describe("Optional filters"),
    },
    async ({ projectId, query, maxTokens, filters }) => {
      const pack = await client.generateContextPack(projectId, {
        query,
        maxTokens,
        filters,
      });
      return {
        content: [{ type: "text", text: pack.markdown }],
      };
    }
  );
}
