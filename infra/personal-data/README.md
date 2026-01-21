# Personal Data Stack (Self-Hosted)

This compose stack brings up Postgres (Timescale), Minio object storage, optional Traefik ingress, and optional Tailscale sidecar for private access.

## Quick start
1) Copy `env.sample` to `.env` in this folder and fill secrets:
   - `POSTGRES_PASSWORD`, `MINIO_ROOT_PASSWORD`, `PERSONAL_DATA_INGEST_KEY`.
2) Start core services:
   - `docker compose -f infra/personal-data/docker-compose.yml --env-file infra/personal-data/.env up -d postgres minio`
3) (Optional) Add ingress + VPN:
   - `docker compose -f infra/personal-data/docker-compose.yml --env-file infra/personal-data/.env --profile ingress up -d traefik`
   - `docker compose -f infra/personal-data/docker-compose.yml --env-file infra/personal-data/.env --profile vpn up -d tailscale` (requires `TAILSCALE_AUTHKEY`).

Data volumes are stored under `infra/personal-data/volumes/`.

Buckets are created automatically (`personal-raw`, `personal-curated` by default) by the `minio-setup` job.

## Ports
- Postgres: `5432`
- Minio API/console: `9000` / `9001`
- Traefik dashboard (dev only): `8080`

## Notes
- Traefik ACME is set for TLS-ALPN; supply a real email and domain or disable the profile locally.
- Tailscale runs with `network_mode: host` to avoid hairpin issues; if you prefer WireGuard, swap the service accordingly.
- Keep `.env` out of version control. Use the provided `env.sample` as a template.
