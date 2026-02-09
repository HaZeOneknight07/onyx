import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OnyxClient } from "@onyx/sdk";

export function registerDocumentTools(server: McpServer, client: OnyxClient) {
  server.tool(
    "doc_list",
    "List documents in a project",
    {
      projectId: z.string().describe("The project ID"),
    },
    async ({ projectId }) => {
      const docs = await client.listDocuments(projectId);
      return {
        content: [{ type: "text", text: JSON.stringify(docs, null, 2) }],
      };
    }
  );

  server.tool(
    "doc_get",
    "Get a document with its current version content",
    {
      projectId: z.string().describe("The project ID"),
      docId: z.string().describe("The document ID"),
    },
    async ({ projectId, docId }) => {
      const doc = await client.getDocument(projectId, docId);
      return {
        content: [{ type: "text", text: JSON.stringify(doc, null, 2) }],
      };
    }
  );

  server.tool(
    "doc_upsert",
    "Create a new document or update an existing one. Omit docId to create, include docId to update.",
    {
      projectId: z.string().describe("The project ID"),
      docId: z.string().optional().describe("Document ID (omit to create new)"),
      title: z.string().describe("Document title"),
      content: z.string().describe("Markdown content"),
      type: z
        .enum(["doc", "note", "adr", "lesson", "snippet"])
        .optional()
        .describe("Document type (default: doc)"),
      tags: z.array(z.string()).optional().describe("Tags for the document"),
      pinned: z.boolean().optional().describe("Whether to pin the document"),
      status: z
        .enum(["draft", "approved", "deprecated"])
        .optional()
        .describe("Document status (updates only)"),
      changeReason: z
        .string()
        .optional()
        .describe("Reason for the change (updates only)"),
    },
    async ({ projectId, docId, title, content, type, tags, pinned, status, changeReason }) => {
      if (docId) {
        const doc = await client.updateDocument(projectId, docId, {
          title,
          content,
          tags,
          pinned,
          status,
          changeReason,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(doc, null, 2) }],
        };
      } else {
        const doc = await client.createDocument(projectId, {
          title,
          content,
          type,
          tags,
          pinned,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(doc, null, 2) }],
        };
      }
    }
  );

  server.tool(
    "doc_versions",
    "List version history for a document",
    {
      projectId: z.string().describe("The project ID"),
      docId: z.string().describe("The document ID"),
    },
    async ({ projectId, docId }) => {
      const versions = await client.listDocumentVersions(projectId, docId);
      return {
        content: [{ type: "text", text: JSON.stringify(versions, null, 2) }],
      };
    }
  );
}
