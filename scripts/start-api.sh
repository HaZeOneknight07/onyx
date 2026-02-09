#!/bin/sh
set -euo pipefail

echo "> env DATABASE_URL=$DATABASE_URL"
echo "> generating db schema"
bun run db:generate
echo "> running migrations"
set +e
attempt=0
max_attempts=12
while ! bun run db:migrate; do
  attempt=$((attempt + 1))
  echo "> db:migrate attempt $attempt failed, retrying in 5s"
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "> db:migrate failed after $attempt attempts"
    exit 1
  fi
  sleep 5
done
set -e
echo "> starting api"
exec bun apps/api/dist/index.js
