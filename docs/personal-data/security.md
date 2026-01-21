# Personal Data Capture – Security Baseline

Principles: encrypt early, isolate networks, minimize blast radius, and keep audit trails locally.

## Keys
- Ingestion secret: `PERSONAL_DATA_INGEST_KEY` shared by collectors and API.
- S3/Minio access: `PERSONAL_DATA_S3_ACCESS_KEY` / `PERSONAL_DATA_S3_SECRET_KEY` (least-privilege, rotate quarterly).
- Public-key encryption for payloads: generate an `age` keypair per device; collectors encrypt JSON/NDJSON before upload.
- Database: keep Postgres volume on an encrypted disk (FileVault/LUKS). For cloud disks, enable volume encryption.

Generate an age keypair (local-only):
```bash
sh scripts/personal-data/generate-age-key.sh
```

## VPN and ingress
- Prefer running ingestion behind `tailscale` (profile `vpn` in the compose file) or a WireGuard tunnel. Avoid exposing ports 80/443 to the internet unless fronted by Traefik with auth.
- If exposing Traefik, enable HTTP basic auth or mTLS on `websecure` entrypoint and pin allowed IPs.

## Storage encryption
- Minio: enable server-side encryption by setting `MINIO_KMS_SECRET_KEY` (see Minio KMS docs) or store Minio data on an encrypted host volume.
- Object payloads: encrypt at client with age before upload; server stores ciphertext.
- Postgres: avoid storing raw secrets in tables; store OAuth tokens encrypted with age, decrypt only in jobs runtime.

## Auditing
- Log ingestion attempts (source, IP, signature hash) locally; rotate logs weekly.
- Enable `pg_audit` or Postgres `log_statement='mod'` if you need write traces; ensure logs stay on encrypted disk.
