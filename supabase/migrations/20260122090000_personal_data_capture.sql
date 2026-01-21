-- Personal data capture schema: events, blobs, views, and timeseries helpers.
begin;

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_extension where extname = 'timescaledb') then
    -- Optional: install Timescale if available in this Postgres build.
    perform 1;
  end if;
end$$;

create table if not exists public.personal_events (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  kind text not null,
  ts timestamptz not null,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  hash bytea not null,
  signature text,
  blob_path text,
  curated_path text,
  ingest_method text,
  ingest_meta jsonb not null default '{}'::jsonb,
  batch_id uuid not null default gen_random_uuid(),
  compacted_at timestamptz,
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists personal_events_hash_key on public.personal_events(hash);
create index if not exists personal_events_ts_idx on public.personal_events(ts);
create index if not exists personal_events_source_kind_ts_idx on public.personal_events(source, kind, ts);
create index if not exists personal_events_compacted_idx on public.personal_events(compacted_at nulls first);

-- Timescale hypertable (safe no-op if extension absent or already migrated).
do $$
begin
  if exists (select 1 from pg_extension where extname = 'timescaledb') then
    perform create_hypertable('public.personal_events', 'ts', if_not_exists => true, migrate_data => true);
  end if;
end$$;

create table if not exists public.personal_blobs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.personal_events(id) on delete cascade,
  storage_path text not null,
  content_type text,
  bytes bigint,
  inserted_at timestamptz not null default now()
);

-- Derived views for common slices
create or replace view public.personal_locations as
select
  id,
  ts,
  (payload->>'lat')::double precision as lat,
  (payload->>'lon')::double precision as lon,
  (payload->>'accuracy')::double precision as accuracy,
  source,
  kind,
  ingest_method
from public.personal_events
where kind = 'location';

create or replace view public.personal_notifications as
select
  id,
  ts,
  payload->>'app' as app,
  payload->>'title' as title,
  payload->>'text' as text,
  payload->>'channel' as channel,
  source,
  ingest_method
from public.personal_events
where kind = 'notification';

create or replace view public.personal_browser_history as
select
  id,
  ts,
  payload->>'url' as url,
  payload->>'title' as title,
  payload->>'duration_ms' as duration_ms,
  source,
  ingest_method
from public.personal_events
where kind = 'browser_history';

create or replace view public.personal_app_usage as
select
  id,
  ts,
  payload->>'app' as app,
  payload->>'window' as window,
  (payload->>'duration_ms')::bigint as duration_ms,
  source,
  ingest_method
from public.personal_events
where kind = 'app_usage';

create or replace view public.personal_timeblocks as
select
  id,
  ts,
  payload->>'label' as label,
  (payload->>'start')::timestamptz as start_at,
  (payload->>'end')::timestamptz as end_at,
  source,
  ingest_method
from public.personal_events
where kind = 'timeblock';

-- Continuous aggregate (optional if Timescale is present)
do $$
begin
  if exists (select 1 from pg_extension where extname = 'timescaledb') then
    if not exists (select 1 from timescaledb_information.continuous_aggregates where view_name = 'personal_event_counts') then
      perform public.create_hypertable('public.personal_events', 'ts', if_not_exists => true, migrate_data => true);
      execute $agg$
        create materialized view public.personal_event_counts
        with (timescaledb.continuous) as
        select time_bucket('1 hour', ts) as bucket,
               source,
               kind,
               count(*) as events
        from public.personal_events
        group by bucket, source, kind
      $agg$;
      perform add_continuous_aggregate_policy('public.personal_event_counts', start_offset => interval '7 days', end_offset => interval '1 hour', schedule_interval => interval '15 minutes');
    end if;
  end if;
end$$;

commit;
