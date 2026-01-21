-- Backfill op tagging on existing rows where a meta jsonb or op_tag boolean exists.
-- Safe to run multiple times; it only updates rows missing the tag.
-- Run in a privileged SQL console (psql/Supabase SQL editor).

do $$
declare
  rec record;
begin
  for rec in
    select table_schema, table_name, column_name
    from information_schema.columns
    where (column_name = 'meta' or column_name = 'op_tag')
      and table_schema in ('public', 'storage', 'auth')
      and table_name in (
        -- Core / tenants
        'tenants','tenant_domains','tenant_billing','profiles','tenant_usage',
        -- Storage
        'storage_subscriptions','storage_buckets','storage_files','storage_usage',
        -- Notifications
        'notification_subscriptions','notification_templates','notification_deliveries',
        'user_notification_preferences','in_app_notifications','notification_usage',
        -- Experiments / feature flags
        'experiment_subscriptions','audiences','experiments','experiment_variants',
        'feature_flags','exposure_events','conversion_events','experiment_usage',
        -- Vault
        'vault_spaces','vault_encryption_keys','vault_folders','vault_files',
        'vault_automation_rules','vault_inbox','vault_suggestions','vault_audit_log',
        'vault_sessions','vault_recovery_codes','vault_backups',
        -- Gateway
        'gateway_providers','gateway_api_keys','gateway_routing_rules','gateway_requests','tenant_rate_limits',
        -- Platform settings
        'platform_settings','settings_audit_log',
        -- Event/outbox
        'event_outbox','event_dispatch_log','event_dlq','event_sink_config','event_tenant_limits',
        -- Secrets
        'encrypted_secrets','secret_access_log','break_glass_access','tenant_dek_registry',
        -- Email workspace
        'email_threads','email_labels','email_thread_labels','email_assignments',
        'email_comments','email_slas','email_ai_queue','email_rules','email_suggestions',
        'email_policies','email_audit_log','email_rate_limits','email_metrics',
        'email_user_activity','email_accounts','email_messages','email_attachments',
        -- AI workers / jobs
        'ai_worker_jobs',
        -- RAG / KB lineage
        'kb_source_connectors','kb_document_lineage','kb_chunk_lineage','kb_retrieval_sessions',
        'kb_retrieval_results','kb_retrieval_result_chunks','kb_retrieval_feedback',
        'kb_eval_test_sets','kb_eval_test_cases','kb_eval_runs','kb_eval_case_results',
        'kb_pii_scan_results','kb_pii_chunk_detections','kb_pii_policies'
      )
  loop
    if rec.column_name = 'meta' then
      execute format(
        'update %I.%I set meta = coalesce(meta, ''{}''::jsonb) || ''{"op": true}'' where coalesce((meta->>''op'')::boolean, false) is distinct from true;',
        rec.table_schema, rec.table_name
      );
    elsif rec.column_name = 'op_tag' then
      execute format(
        'update %I.%I set op_tag = true where coalesce(op_tag, false) is distinct from true;',
        rec.table_schema, rec.table_name
      );
    end if;
  end loop;
end $$ language plpgsql;
