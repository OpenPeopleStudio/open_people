#!/usr/bin/env bash
set -euo pipefail

# Usage: scripts/personal-data/backup.sh /path/to/backup-dir
# Requires: pg_dump, optional minio/mc in PATH.

BACKUP_DIR="${1:-./backups}"
mkdir -p "${BACKUP_DIR}"

PGHOST="${PGHOST:-127.0.0.1}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-${POSTGRES_USER:-personal}}"
PGPASSWORD="${PGPASSWORD:-${POSTGRES_PASSWORD:-personal}}"
PGDATABASE="${PGDATABASE:-${POSTGRES_DB:-personal}}"

export PGPASSWORD
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
PG_FILE="${BACKUP_DIR}/postgres-${STAMP}.dump"

echo "Dumping Postgres to ${PG_FILE}..."
pg_dump -h "${PGHOST}" -p "${PGPORT}" -U "${PGUSER}" -F c -f "${PG_FILE}" "${PGDATABASE}"

if command -v mc >/dev/null 2>&1; then
  ENDPOINT="${PERSONAL_DATA_S3_ENDPOINT:-http://127.0.0.1:9000}"
  ACCESS="${PERSONAL_DATA_S3_ACCESS_KEY:-${MINIO_ROOT_USER:-minioadmin}}"
  SECRET="${PERSONAL_DATA_S3_SECRET_KEY:-${MINIO_ROOT_PASSWORD:-minioadmin}}"
  RAW_BUCKET="${PERSONAL_DATA_S3_BUCKET_RAW:-personal-raw}"
  CURATED_BUCKET="${PERSONAL_DATA_S3_BUCKET_CURATED:-personal-curated}"

  echo "Syncing Minio buckets (raw + curated)..."
  mc alias set personal "${ENDPOINT}" "${ACCESS}" "${SECRET}"
  mc mirror personal/${RAW_BUCKET} "${BACKUP_DIR}/minio/${RAW_BUCKET}"
  mc mirror personal/${CURATED_BUCKET} "${BACKUP_DIR}/minio/${CURATED_BUCKET}"
else
  echo "mc not installed; skipping Minio mirror."
fi

echo "Backup complete -> ${BACKUP_DIR}"
