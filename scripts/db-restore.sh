#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-postgres}"
PGPASSWORD="${PGPASSWORD:-postgres}"
PGDATABASE="${PGDATABASE:-ais}"

if ! command -v pg_restore >/dev/null 2>&1; then
  echo "pg_restore not found. Install PostgreSQL client tools." >&2
  exit 1
fi

BACKUP_PATH="${1:-}"
if [[ -z "${BACKUP_PATH}" ]]; then
  if [[ ! -d "${BACKUP_DIR}" ]]; then
    echo "Backup directory not found: ${BACKUP_DIR}" >&2
    exit 1
  fi
  BACKUP_PATH="$(ls -t "${BACKUP_DIR}"/*.dump 2>/dev/null | head -n 1 || true)"
fi

if [[ -z "${BACKUP_PATH}" || ! -f "${BACKUP_PATH}" ]]; then
  echo "Backup file not found. Provide a .dump path or ensure ${BACKUP_DIR} has backups." >&2
  exit 1
fi

export PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE

pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --dbname "${PGDATABASE}" \
  "${BACKUP_PATH}"

echo "Restore completed from ${BACKUP_PATH}"
