import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";

type ToolCallResult = {
  content?: Array<{ type: string; text?: string }>;
  structuredContent?: unknown;
  isError?: boolean;
};

type Project = { id: string; name?: string; slug?: string };

type ListToolsResult = {
  tools: Array<{ name: string }>;
};

type ListProjectsResult = Array<Project>;

type ListDocsResult = Array<unknown>;

type ListTasksResult = Array<unknown>;

const ONYX_API_TOKEN = process.env.ONYX_API_TOKEN;
const ONYX_API_URL = process.env.ONYX_API_URL ?? "http://localhost:3000";
const HAS_ENV = Boolean(ONYX_API_TOKEN);

const TEST_TIMEOUT_MS = 20_000;

const parseJsonText = <T>(result: ToolCallResult): T => {
  const text = result.content?.find((item) => item.type === "text")?.text;
  if (!text) {
    throw new Error("Tool response missing text content");
  }
  return JSON.parse(text) as T;
};

if (!HAS_ENV) {
  it("integration: mcp tools (skipped - ONYX_API_TOKEN missing)", () => {
    expect(true).toBe(true);
  });
} else {
  describe("integration: mcp tools", () => {
    let client: Client;
    let transport: StdioClientTransport;

    beforeAll(async () => {
      const cwd = path.resolve(import.meta.dir, "..");
      transport = new StdioClientTransport({
        command: "bun",
        args: ["run", "src/index.ts"],
        cwd,
        env: {
          ...process.env,
          ONYX_API_TOKEN,
          ONYX_API_URL,
        },
      });

      client = new Client({ name: "mcp-integration-test", version: "0.0.1" });
      await client.connect(transport);
    }, TEST_TIMEOUT_MS);

    afterAll(async () => {
      await transport.close();
    });

    it(
      "lists expected tools",
      async () => {
        const result = (await client.listTools()) as ListToolsResult;
        const names = result.tools.map((tool) => tool.name);

        expect(names).toEqual(
          expect.arrayContaining([
            "project_list",
            "project_get",
            "search",
            "doc_list",
            "doc_get",
            "doc_upsert",
            "doc_versions",
            "task_list",
            "task_create",
            "task_update",
            "session_start",
            "session_end",
            "context_pack",
          ])
        );
      },
      TEST_TIMEOUT_MS
    );

    it(
      "can call project_list, doc_list, and task_list",
      async () => {
        const projectsResult = (await client.callTool({
          name: "project_list",
          arguments: {},
        })) as ToolCallResult;

        const projects = parseJsonText<ListProjectsResult>(projectsResult);
        expect(Array.isArray(projects)).toBe(true);

        if (projects.length === 0) {
          return;
        }

        const projectId = projects[0].id;

        const docsResult = (await client.callTool({
          name: "doc_list",
          arguments: { projectId },
        })) as ToolCallResult;

        const docs = parseJsonText<ListDocsResult>(docsResult);
        expect(Array.isArray(docs)).toBe(true);

        const tasksResult = (await client.callTool({
          name: "task_list",
          arguments: { projectId },
        })) as ToolCallResult;

        const tasks = parseJsonText<ListTasksResult>(tasksResult);
        expect(Array.isArray(tasks)).toBe(true);
      },
      TEST_TIMEOUT_MS
    );
  });
}
