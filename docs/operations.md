# Operations

This document covers deployment, backups, and observability for Onyx.

## Running the Full Stack

A single command handles Docker, migrations, and all services:

```sh
# Development — infra containers + watch mode services
bun run app:full --dev

# Production — infra containers + build + compiled services
bun run app:full --production
```

`Ctrl+C` gracefully stops all services and Docker containers.

## Deployment (Docker only)

If you prefer to run everything inside Docker without local Bun services:

```sh
docker compose -f docker-compose.deploy.yml up --build
```

Service notes:
- `api` listens on port `8088`
- `web` serves the UI on port `8080`
- `postgres` uses `pgvector/pgvector:pg16`
- `redis` provides queues for workers

## Environment Variables

Required:
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`

Common:
- `BETTER_AUTH_URL`
- `OLLAMA_URL`
- `REDIS_HOST`
- `REDIS_PORT`

MCP:
- `ONYX_API_URL`
- `ONYX_API_TOKEN`

When running the MCP server via Bun, prefer loading `.env`:

```sh
bun --env-file=../../.env run src/index.ts
```

## Global Admin API Tokens

You can create a **global admin** API token by omitting `projectId` when creating a token.
This token is not scoped to a single project and can create new projects.

Example:

```sh
curl -X POST http://localhost:8088/api/v1/tokens \
  -H "Authorization: Bearer <SESSION_OR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"global-admin","expiresAt":"2026-03-01T00:00:00Z"}'
```

Use short expirations, rotate regularly, and store securely.

## Backup and Restore

Backup:

```sh
bun run db:backup
```

Restore:

```sh
bun run db:restore
```

Scripts:
- `scripts/db-backup.sh`
- `scripts/db-restore.sh`

The scripts use `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` and default to `localhost:5432`, `postgres`, `postgres`, and `onyx`.

## Observability

Health:
- `GET /health`

Metrics (Prometheus-style):
- `GET /metrics`

Logging:
- `pino` logger is exported from `@onyx/shared` and used in API/worker/MCP
- Configure log level with `LOG_LEVEL` (default `debug` in dev, `info` in prod)
