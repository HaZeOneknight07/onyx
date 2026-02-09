# Onyx

A TypeScript monorepo for storing, searching, and retrieving project knowledge for LLM/agent workflows. It includes a REST API, background workers, a web UI, and an MCP server for tool-based agent access.

**Highlights**
- Document versioning and task management
- Hybrid search (semantic + full-text) with chunking and embeddings
- MCP server for agent tools and session logging
- Web UI for search, documents, and tasks

**Stack**
- Runtime: Bun
- API: Hono + Drizzle + Postgres (pgvector)
- Worker: BullMQ + Redis
- Web: Vite + React
- MCP: stdio-based server

**Repository Layout**
- `apps/api` REST API
- `apps/worker` background jobs (chunking, embeddings, url ingest)
- `apps/web` React frontend
- `apps/mcp` MCP stdio server for agent tools
- `packages/db` Drizzle schema and DB access
- `packages/shared` shared utilities (queues, chunker, logger)
- `packages/sdk` internal typed client

## Prerequisites
- Bun 1.3+
- Postgres 16 with `pgvector` extension
- Redis 7+
- (Optional) Ollama for embeddings (`OLLAMA_URL`)

## Environment

Create `.env` (see `.env.example`). Required values:

| Variable | Description | Default |
| --- | --- | --- |
| `DATABASE_URL` | Postgres connection string | none |
| `REDIS_HOST` | Redis host (worker) | `localhost` |
| `REDIS_PORT` | Redis port (worker) | `6379` |
| `OLLAMA_URL` | Embedding service | `http://localhost:11434` |
| `BETTER_AUTH_URL` | Auth base URL | `http://localhost:3000` |
| `BETTER_AUTH_SECRET` | Auth secret | none |

For the MCP server:

| Variable | Description | Default |
| --- | --- | --- |
| `ONYX_API_URL` | API base URL | `http://localhost:3000` |
| `ONYX_API_TOKEN` | API token for MCP | none |

### Global Admin API Tokens

You can create a **global admin** API token by omitting `projectId` when creating a token.
This token is not scoped to a single project and can create new projects.

Example:

```sh
curl -X POST http://localhost:3000/api/v1/tokens \
  -H "Authorization: Bearer <SESSION_OR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"global-admin","expiresAt":"2026-03-01T00:00:00Z"}'
```

Use short expirations, rotate regularly, and store securely.

## Running the Full Stack

A single command starts Docker infrastructure (Postgres + Redis), runs DB migrations, and launches all four services (API, worker, web, MCP).

### Development

```sh
bun run app:full --dev
```

This will:
1. Start `docker-compose.yml` (Postgres + pgvector, Redis) and wait for healthy containers
2. Run `bun run db:push` to apply schema migrations
3. Start **api**, **worker**, **web**, and **mcp** in watch/dev mode

### Production

```sh
bun run app:full --production
```

This will:
1. Start `docker-compose.deploy.yml` (Postgres, Redis, plus containerized api/worker/web) and wait for healthy containers
2. Build all workspaces (`bun run build`)
3. Start **api**, **worker**, **web** (preview), and **mcp** from compiled output

Press `Ctrl+C` to gracefully shut down all services and stop Docker containers.

### Individual Services

You can still run services individually:

```sh
bun run dev:api
bun run dev:worker
bun run dev:web
bun run dev:mcp
```

## Testing

```sh
bun test
bun run test:unit
bun run test:integration
```

Integration tests for MCP tools require `ONYX_API_TOKEN` and a running API.

## MCP Tools

The MCP server exposes tools for projects (including create/update/delete), docs, search, tasks (including delete), sessions, and context packs. Example for Codex config:

```toml
[mcp_servers.onyx]
command = "bun"
args = ["--env-file", "../../.env", "run", "src/index.ts"]
env = { ONYX_API_TOKEN = "YOUR_TOKEN", ONYX_API_URL = "https://onyx.ashmorestudios.com" }
cwd = "/ABSOLUTE/PATH/TO/apps/mcp"
startup_timeout_sec = 20
```

See `docs/mcp-handover.md` for a complete list of tool names and usage notes.

## Deployment

**Full stack (recommended):**

```sh
bun run app:full --production
```

**Docker-only (without local Bun services):**

```sh
docker compose -f docker-compose.deploy.yml up --build
```

Dockerfiles:
- `docker/Dockerfile.api`
- `docker/Dockerfile.worker`
- `docker/Dockerfile.web`

## Backup and Restore

```sh
bun run db:backup
bun run db:restore
```

Scripts are in `scripts/db-backup.sh` and `scripts/db-restore.sh`. They use standard `PG*` environment variables.

## Observability

- Health endpoint: `GET /health`
- Metrics endpoint: `GET /metrics`

Structured logging uses `pino` via `packages/shared/src/logger.ts`.
