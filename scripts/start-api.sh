#!/bin/sh
set -euo pipefail

echo "> generating db schema"
bun run db:generate
echo "> running migrations"
bun run db:migrate
echo "> starting api"
exec bun apps/api/dist/index.js
