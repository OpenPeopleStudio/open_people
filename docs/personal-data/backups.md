# Backups & Retention

## What gets backed up
- Postgres (compressed custom format via `pg_dump`)
- Minio buckets (`personal-raw`, `personal-curated`) mirrored locally

## How to run
```bash
./scripts/personal-data/backup.sh /secure/offline-backups
```

Schedule (example crontab):
```
0 3 * * * /bin/bash /path/to/repo/scripts/personal-data/backup.sh /secure/offline-backups >> /var/log/personal-backups.log 2>&1
```

## Retention
- Keep 30 days of daily backups locally.
- Copy weekly snapshots to an offline disk (encrypted) or a cold-storage bucket protected by object lock/versioning.

## Restore quick notes
```bash
pg_restore -h 127.0.0.1 -U personal -d personal /secure/offline-backups/postgres-<stamp>.dump
# Minio: mc mirror /secure/offline-backups/minio/personal-raw personal/personal-raw
```

## Alerts (local only)
- Add a healthcheck cron to verify the freshest backup timestamp and send an `ntfy` push or email if older than 24h.
- Keep logs on encrypted disk; avoid sending metadata to third-party services.
