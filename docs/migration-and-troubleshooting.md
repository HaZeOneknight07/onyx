# Migration Guide & Troubleshooting

This document covers migration workflows and common issues for Onyx.

## Migration Guide

### 1) Prerequisites

- Bun 1.3+
- Postgres 16 with `pgvector`
- Redis 7+
- Environment variables configured in `.env`

### 2) Database Setup

From the repo root:

```sh
bun run db:generate
bun run db:migrate
```

If you are starting fresh, this creates the required schema and tables.

### 3) Updating Schema

When schema changes are made in `packages/db/src/schema`:

```sh
bun run db:generate
bun run db:migrate
```

### 4) Seeding (Optional)

```sh
bun run db:seed
```

### 5) Application Startup

```sh
bun run dev:api
bun run dev:worker
bun run dev:web
```

### 6) MCP Server

```sh
bun run dev:mcp
```

Ensure `ONYX_API_TOKEN` and `ONYX_API_URL` are set.

---

## Troubleshooting

### MCP server shows “handshaking ... connection closed”

- Ensure Codex/Claude is configured to run the server with `cwd` set to `apps/mcp`.
- Use `bun run src/index.ts` (not `--filter`) when launched by a client.
- Verify `ONYX_API_TOKEN` is set; server exits immediately if missing.

### MCP server exits immediately

- STDIO servers exit when stdin closes. Ensure a client keeps stdin/stdout open.
- Run it via Codex/Claude MCP config, not a plain shell.
- Prefer loading `.env` via Bun when starting the MCP server.

### `bun install` fails with tempdir permission

- Ensure Bun can write to tempdir. On macOS:

```sh
TMPDIR=/tmp bun install
```

### Worker not processing jobs

- Check Redis connectivity (`REDIS_HOST`, `REDIS_PORT`).
- Ensure `apps/worker` is running.

### Search returns no semantic results

- Verify embeddings service is running (default `OLLAMA_URL=http://localhost:11434`).
- Confirm chunking/embeddings workers are running.

### `DATABASE_URL` errors

- Verify Postgres is running and accessible.
- Confirm `DATABASE_URL` in `.env` is correct.
- Ensure migrations were applied.

### Web UI can’t authenticate

- Verify `BETTER_AUTH_URL` and `BETTER_AUTH_SECRET` are set.
- Confirm API is running and reachable from the browser.

### Health/metrics endpoints

- `GET /health` returns status + uptime + timestamp.
- `GET /metrics` returns Prometheus-style counters.

---

## Rollback & Restore

Restore from a backup created by `db:backup`:

```sh
bun run db:restore
```

Scripts are in `scripts/db-backup.sh` and `scripts/db-restore.sh`.
