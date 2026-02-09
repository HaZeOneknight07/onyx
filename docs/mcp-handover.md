# MCP Handover

This repo exposes an MCP (Model Context Protocol) server in `apps/mcp` that provides tools for interacting with Onyx. The server runs over STDIO and is intended to be launched by a client (Codex, Claude, or a custom MCP client).

## Quick Start (Codex)

1. Ensure the Onyx service is running and reachable at `ONYX_API_URL`.
2. Set `ONYX_API_TOKEN` in your environment or Codex config.
3. Configure Codex to launch the MCP server from the `apps/mcp` package directory.

Example `~/.codex/config.toml`:

```toml
[mcp_servers.onyx]
command = "bun"
args = ["--env-file", "../../.env", "run", "src/index.ts"]
env = { ONYX_API_TOKEN = "YOUR_TOKEN", ONYX_API_URL = "https://api-onyx.ashmorestudios.com" }
cwd = "/Users/ty/Desktop/agent-information-store/apps/mcp"
startup_timeout_sec = 20
```

In Codex, run `/mcp` to verify the server is enabled and see available tools.

## Server Location

- Entry point: `apps/mcp/src/index.ts`
- Package: `apps/mcp/package.json`
- Transport: STDIO (`StdioServerTransport`)

`process.stdin.resume()` is required to keep the STDIO server alive when launched by clients.

## Available MCP Tools

These tools are registered by the server and exposed to MCP clients:

- `project_list`: List all projects in Onyx.
- `project_get`: Get a project by ID.
- `project_create`: Create a new project.
- `project_update`: Update a project.
- `project_delete`: Delete a project.
- `search`: Semantic/text search within a project.
- `doc_list`: List documents for a project.
- `doc_get`: Get a document and its current version.
- `doc_upsert`: Create or update a document.
- `doc_versions`: List document versions.
- `task_list`: List tasks for a project.
- `task_create`: Create a task.
- `task_update`: Update a task.
- `task_delete`: Delete a task.
- `session_start`: Log the start of a session.
- `session_end`: Log the end of a session.
- `context_pack`: Build a context pack from relevant documents.

Tool behavior is defined in `apps/mcp/src/tools/*`.

## Operational Notes

- This server is STDIO-only. It is not an HTTP server.
- The MCP client must keep stdin/stdout open for the handshake to succeed.
- If `ONYX_API_TOKEN` is missing, the server exits immediately.

## Troubleshooting

Symptoms:
- MCP startup fails with `handshaking ... connection closed`.

Likely causes and fixes:
- The server is launched from the wrong working directory.
  - Fix by setting `cwd` to `.../apps/mcp` and using `bun run src/index.ts`.
- STDIO is not kept open by the client.
  - Ensure the client supports STDIO MCP servers and spawns the process.
- Missing or invalid `ONYX_API_TOKEN`.

## For Onyx Operators

Use `/mcp` in Codex to list tools and verify the server is enabled. The tools listed above are the authoritative interface for interacting with Onyx.
