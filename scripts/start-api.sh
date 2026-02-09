#!/bin/sh
set -euo pipefail

bun_url=${DATABASE_URL:?}
db_host="${DB_HOST:-${bun_url#*@}}"
db_host="${db_host%%[:/]*}"

echo "> DATABASE_URL=$bun_url"
echo "> waiting for DNS to resolve $db_host"
while ! getent hosts "$db_host" >/dev/null 2>&1; do
  echo "> waiting for $db_host"
  sleep 1
done

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
