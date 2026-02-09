import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OnyxClient } from "@onyx/sdk";

export function registerProjectTools(server: McpServer, client: OnyxClient) {
  server.tool(
    "project_list",
    "List all projects in the information store",
    {},
    async () => {
      const projects = await client.listProjects();
      return {
        content: [{ type: "text", text: JSON.stringify(projects, null, 2) }],
      };
    }
  );

  server.tool(
    "project_get",
    "Get details for a specific project by ID",
    { projectId: z.string().describe("The project ID") },
    async ({ projectId }) => {
      const project = await client.getProject(projectId);
      return {
        content: [{ type: "text", text: JSON.stringify(project, null, 2) }],
      };
    }
  );

  server.tool(
    "project_create",
    "Create a new project",
    {
      slug: z.string().min(1).describe("URL-safe slug, e.g. my-project"),
      name: z.string().min(1).describe("Project name"),
      description: z.string().optional().describe("Optional description"),
    },
    async ({ slug, name, description }) => {
      const project = await client.createProject({ slug, name, description });
      return {
        content: [{ type: "text", text: JSON.stringify(project, null, 2) }],
      };
    }
  );

  server.tool(
    "project_update",
    "Update a project",
    {
      projectId: z.string().describe("The project ID"),
      name: z.string().optional().describe("Updated project name"),
      description: z.string().optional().describe("Updated description"),
    },
    async ({ projectId, name, description }) => {
      const project = await client.updateProject(projectId, { name, description });
      return {
        content: [{ type: "text", text: JSON.stringify(project, null, 2) }],
      };
    }
  );

  server.tool(
    "project_delete",
    "Delete a project by ID",
    { projectId: z.string().describe("The project ID") },
    async ({ projectId }) => {
      const result = await client.deleteProject(projectId);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
