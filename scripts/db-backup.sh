#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
DEFAULT_NAME="ais_backup_${TIMESTAMP}.dump"
OUTPUT_PATH="${1:-${BACKUP_DIR}/${DEFAULT_NAME}}"

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-postgres}"
PGPASSWORD="${PGPASSWORD:-postgres}"
PGDATABASE="${PGDATABASE:-ais}"

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "pg_dump not found. Install PostgreSQL client tools." >&2
  exit 1
fi

mkdir -p "$(dirname "${OUTPUT_PATH}")"

export PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE

pg_dump \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file "${OUTPUT_PATH}"

echo "Backup written to ${OUTPUT_PATH}"
