# Read-Only Access (Analytics)

## Spin up dashboards
- Start analytics tools (profile `analytics`):
  - `docker compose -f infra/personal-data/docker-compose.yml --env-file infra/personal-data/.env --profile analytics up -d metabase grafana`
  - Metabase: http://localhost:3001
  - Grafana: http://localhost:3002

## Connect to Postgres
- Connection string: `postgres://POSTGRES_USER:POSTGRES_PASSWORD@localhost:5432/POSTGRES_DB`
- Recommended read-only role: create a `personal_ro` role and grant `select` on `personal_events` and derived views.
- Useful tables/views: `personal_events`, `personal_locations`, `personal_notifications`, `personal_browser_history`, `personal_app_usage`, `personal_timeblocks`, `personal_event_counts`.

## Connect to Minio (raw/curated data)
- Endpoint: `http://localhost:9000`
- Access key/secret: from `.env`
- Buckets: `personal-raw`, `personal-curated`
- In Grafana/Metabase, use the S3/Parquet connectors or point DuckDB to `s3://personal-curated/<parquet>`.

## Notebooks
- Jupyter/Polars (local):
  ```bash
  python -m venv .venv && source .venv/bin/activate
  pip install duckdb polars
  python - <<'PY'
  import duckdb
  con = duckdb.connect()
  con.sql("SET s3_endpoint='localhost:9000'; SET s3_url_style='path'; SET s3_use_ssl=false; SET s3_access_key_id='<key>'; SET s3_secret_access_key='<secret>'")
  print(con.sql(\"select * from read_parquet('s3://personal-curated/**/*.parquet') limit 5\"))
  PY
  ```

## Exports
- Use signed URLs from Minio (`mc presign`) for one-off shares.
- For CSV exports, query `personal_event_counts` or a view in Metabase and export there to avoid pulling raw data.
