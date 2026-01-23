-- ════════════════════════════════════════════════════════════════════════════
-- Data Point Signatures
-- Adds a per-row signature to captured datapoints for integrity/provenance.
--
-- How it works:
-- - Adds `signature` (TEXT) and `signed_at` (TIMESTAMPTZ) to key capture tables
-- - A trigger recomputes signature on every INSERT/UPDATE
--
-- Signature formats:
-- - `hmac-sha256:<hex>` when `app.data_signature_secret` is set
-- - `sha256:<hex>` fallback when secret is not set (integrity hash, not a secret-backed signature)
--
-- NOTE: For production-grade provenance, set `app.data_signature_secret` to a strong secret.
-- ════════════════════════════════════════════════════════════════════════════

-- Needed for `hmac()` and `digest()`
create extension if not exists pgcrypto;

-- Generate a deterministic signature for a row payload.
-- We exclude `signature` and `signed_at` so the signature is stable and verifiable.
create or replace function generate_data_signature(
  p_table_name text,
  p_row_data jsonb
)
returns text
language plpgsql
security definer
as $$
declare
  v_payload jsonb;
  v_secret text;
  v_sig text;
begin
  v_payload := p_row_data - 'signature' - 'signed_at';
  -- bind the signature to a table name to prevent cross-table replay
  v_payload := v_payload || jsonb_build_object('table', p_table_name);

  v_secret := current_setting('app.data_signature_secret', true);

  if v_secret is null or length(v_secret) = 0 then
    v_sig := 'sha256:' || encode(digest(v_payload::text, 'sha256'), 'hex');
  else
    v_sig := 'hmac-sha256:' || encode(hmac(v_payload::text, v_secret, 'sha256'), 'hex');
  end if;

  return v_sig;
end;
$$;

-- Trigger to set/recompute signature.
create or replace function set_row_signature()
returns trigger
language plpgsql
security definer
as $$
begin
  new.signed_at := now();
  new.signature := generate_data_signature(tg_table_name, to_jsonb(new));
  return new;
end;
$$;

-- Attach signature columns + triggers to the platform's "captured datapoint" tables.
do $$
declare
  v_server_version_num int := current_setting('server_version_num')::int;
  v_table text;
  v_is_partitioned boolean;
  v_partition record;
  v_tables text[] := array[
    -- Unified ledger / audit / eventing
    'activity_ledger',
    'event_outbox',
    'event_dispatch_log',
    'event_dlq',
    'vault_audit_log',

    -- Ingestion / user-generated data
    'email_messages',
    'notes',
    'note_versions',
    'note_api_access',
    'vault_files',
    'vault_inbox',

    -- Knowledge / RAG
    'knowledge_documents',
    'knowledge_chunks',
    'knowledge_facts',
    'knowledge_citations',

    -- AI / gateway telemetry
    'ai_runs',
    'ai_run_context_items',
    'gateway_requests',

    -- Time-series metrics
    'ai_metrics_hourly',
    'ai_metrics_daily',

    -- Experiments / analytics
    'exposure_events',
    'conversion_events',
    'email_events',

    -- Usage / tracking
    'api_key_usage',
    'experiment_usage',
    'email_logs',
    'email_usage',

    -- Jobs / queues
    'job_queue',
    'jobs',
    'ai_worker_jobs'
  ];
begin
  foreach v_table in array v_tables loop
    if to_regclass(format('public.%I', v_table)) is not null then
      execute format('alter table %I.%I add column if not exists signature text', 'public', v_table);
      execute format('alter table %I.%I add column if not exists signed_at timestamptz', 'public', v_table);

      select (c.relkind = 'p')
      into v_is_partitioned
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = v_table;

      -- Name intentionally sorts after other BEFORE triggers (e.g. updated_at/version triggers).
      -- Postgres < 14 can't create row-level triggers on partitioned *parents*; attach to partitions instead.
      if (not v_is_partitioned) or v_server_version_num >= 140000 then
        execute format('drop trigger if exists %I on %I.%I', 'zzz_set_row_signature', 'public', v_table);
        execute format(
          'create trigger %I before insert or update on %I.%I for each row execute function set_row_signature()',
          'zzz_set_row_signature',
          'public',
          v_table
        );
      end if;

      -- If the table is partitioned, attach triggers to partitions only on Postgres < 14.
      if v_is_partitioned and v_server_version_num < 140000 then
        for v_partition in
          select c_child.relname as partition_name
          from pg_inherits i
          join pg_class c_child on c_child.oid = i.inhrelid
          join pg_class c_parent on c_parent.oid = i.inhparent
          join pg_namespace n_parent on n_parent.oid = c_parent.relnamespace
          where n_parent.nspname = 'public'
            and c_parent.relname = v_table
        loop
          execute format('drop trigger if exists %I on %I.%I', 'zzz_set_row_signature', 'public', v_partition.partition_name);
          execute format(
            'create trigger %I before insert or update on %I.%I for each row execute function set_row_signature()',
            'zzz_set_row_signature',
            'public',
            v_partition.partition_name
          );
        end loop;
      end if;
    end if;
  end loop;
end;
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- Data Point Signatures
-- Adds a per-row signature to captured datapoints for integrity/provenance.
--
-- How it works:
-- - Adds `signature` (TEXT) and `signed_at` (TIMESTAMPTZ) to key capture tables
-- - A trigger recomputes signature on every INSERT/UPDATE
--
-- Signature formats:
-- - `hmac-sha256:<hex>` when `app.data_signature_secret` is set
-- - `sha256:<hex>` fallback when secret is not set (integrity hash, not a secret-backed signature)
--
-- NOTE: For production-grade provenance, set `app.data_signature_secret` to a strong secret.
-- ════════════════════════════════════════════════════════════════════════════

-- Needed for `hmac()` and `digest()`
create extension if not exists pgcrypto;

-- Generate a deterministic signature for a row payload.
-- We exclude `signature` and `signed_at` so the signature is stable and verifiable.
create or replace function generate_data_signature(
  p_table_name text,
  p_row_data jsonb
)
returns text
language plpgsql
security definer
as $$
declare
  v_payload jsonb;
  v_secret text;
  v_sig text;
begin
  v_payload := p_row_data - 'signature' - 'signed_at';
  -- bind the signature to a table name to prevent cross-table replay
  v_payload := v_payload || jsonb_build_object('table', p_table_name);

  v_secret := current_setting('app.data_signature_secret', true);

  if v_secret is null or length(v_secret) = 0 then
    v_sig := 'sha256:' || encode(digest(v_payload::text, 'sha256'), 'hex');
  else
    v_sig := 'hmac-sha256:' || encode(hmac(v_payload::text, v_secret, 'sha256'), 'hex');
  end if;

  return v_sig;
end;
$$;

-- Trigger to set/recompute signature.
create or replace function set_row_signature()
returns trigger
language plpgsql
security definer
as $$
begin
  new.signed_at := now();
  new.signature := generate_data_signature(tg_table_name, to_jsonb(new));
  return new;
end;
$$;

-- Attach signature columns + triggers to the platform's "captured datapoint" tables.
do $$
declare
  v_server_version_num int := current_setting('server_version_num')::int;
  v_table text;
  v_is_partitioned boolean;
  v_partition record;
  v_tables text[] := array[
    -- Unified ledger / audit / eventing
    'activity_ledger',
    'event_outbox',
    'event_dispatch_log',
    'event_dlq',
    'vault_audit_log',

    -- Ingestion / user-generated data
    'email_messages',
    'notes',
    'note_versions',
    'note_api_access',
    'vault_files',
    'vault_inbox',

    -- Knowledge / RAG
    'knowledge_documents',
    'knowledge_chunks',
    'knowledge_facts',
    'knowledge_citations',

    -- AI / gateway telemetry
    'ai_runs',
    'ai_run_context_items',
    'gateway_requests',

    -- Time-series metrics
    'ai_metrics_hourly',
    'ai_metrics_daily',

    -- Experiments / analytics
    'exposure_events',
    'conversion_events',
    'email_events',

    -- Usage / tracking
    'api_key_usage',
    'experiment_usage',
    'email_logs',
    'email_usage',

    -- Jobs / queues
    'job_queue',
    'jobs',
    'ai_worker_jobs'
  ];
begin
  foreach v_table in array v_tables loop
    if to_regclass(format('public.%I', v_table)) is not null then
      execute format('alter table %I.%I add column if not exists signature text', 'public', v_table);
      execute format('alter table %I.%I add column if not exists signed_at timestamptz', 'public', v_table);

      select (c.relkind = 'p')
      into v_is_partitioned
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = v_table;

      -- Name intentionally sorts after other BEFORE triggers (e.g. updated_at/version triggers).
      -- Postgres < 14 can't create row-level triggers on partitioned *parents*; attach to partitions instead.
      if (not v_is_partitioned) or v_server_version_num >= 140000 then
        execute format('drop trigger if exists %I on %I.%I', 'zzz_set_row_signature', 'public', v_table);
        execute format(
          'create trigger %I before insert or update on %I.%I for each row execute function set_row_signature()',
          'zzz_set_row_signature',
          'public',
          v_table
        );
      end if;

      -- If the table is partitioned, attach triggers to partitions only on Postgres < 14.
      if v_is_partitioned and v_server_version_num < 140000 then
        for v_partition in
          select c_child.relname as partition_name
          from pg_inherits i
          join pg_class c_child on c_child.oid = i.inhrelid
          join pg_class c_parent on c_parent.oid = i.inhparent
          join pg_namespace n_parent on n_parent.oid = c_parent.relnamespace
          where n_parent.nspname = 'public'
            and c_parent.relname = v_table
        loop
          execute format('drop trigger if exists %I on %I.%I', 'zzz_set_row_signature', 'public', v_partition.partition_name);
          execute format(
            'create trigger %I before insert or update on %I.%I for each row execute function set_row_signature()',
            'zzz_set_row_signature',
            'public',
            v_partition.partition_name
          );
        end loop;
      end if;
    end if;
  end loop;
end;
$$;
