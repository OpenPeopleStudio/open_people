# Ingestion API

Endpoint (default): `POST /api/personal-data/ingest`

Headers:
- `Content-Type: application/json`
- `X-INGEST-KEY: $PERSONAL_DATA_INGEST_KEY`

Body formats:
```json
{
  "events": [
    {
      "source": "iphone-15",
      "kind": "location",
      "ts": "2026-01-20T12:34:56Z",
      "payload": { "lat": 37.77, "lon": -122.4, "accuracy": 10 },
      "signature": "optional-signed-string",
      "blobBase64": "optional-binary-base64",
      "blobContentType": "application/octet-stream",
      "ingestMeta": { "app": "shortcuts" }
    }
  ]
}
```
Or send a single event object directly (it will be wrapped internally).

Environment:
- `PERSONAL_DATA_INGEST_KEY` – shared secret for collectors
- `PERSONAL_DATA_S3_*` – endpoint/creds/buckets for Minio (optional; if unset, blobs are skipped)
- `SUPABASE_SERVICE_ROLE_KEY` & `NEXT_PUBLIC_SUPABASE_URL` (or `PERSONAL_DATA_SUPABASE_*` if you wire a dedicated Supabase project)

Behavior:
- Calculates SHA-256 over `source`, `kind`, `ts`, and `payload` to dedupe.
- Stores payload in `personal_events`; optional blobs in Minio under `raw/<YYYY>/<MM>/<DD>/<source>/<kind>-<ts>.bin`.
- Responds with `{ inserted: N }` on success.
