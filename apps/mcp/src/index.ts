import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { OnyxClient } from "@onyx/sdk";
import { logger } from "@onyx/shared";
import { registerProjectTools } from "./tools/projects";
import { registerSearchTools } from "./tools/search";
import { registerDocumentTools } from "./tools/documents";
import { registerTaskTools } from "./tools/tasks";
import { registerSessionTools } from "./tools/sessions";

const apiUrl = process.env.ONYX_API_URL ?? "http://localhost:3000";
const apiToken = process.env.ONYX_API_TOKEN;

if (!apiToken) {
  logger.error("ONYX_API_TOKEN environment variable is required");
  process.exit(1);
}

const client = new OnyxClient({ baseUrl: apiUrl, token: apiToken });
const server = new McpServer({
  name: "ais",
  version: "0.1.0",
});

registerProjectTools(server, client);
registerSearchTools(server, client);
registerDocumentTools(server, client);
registerTaskTools(server, client);
registerSessionTools(server, client);

const transport = new StdioServerTransport();
// Keep process alive for stdio-based MCP clients.
process.stdin.resume();
await server.connect(transport);
