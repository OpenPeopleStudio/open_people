-- ═══════════════════════════════════════════════════════════════════════════
-- Partition RLS backfill for gateway_requests_* and ai_metrics_hourly_*
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  part RECORD;
  policy_name TEXT;
BEGIN
  -- gateway_requests partitions
  FOR part IN
    SELECT n.nspname AS schema_name, c.relname AS table_name
    FROM pg_inherits i
    JOIN pg_class c ON c.oid = i.inhrelid
    JOIN pg_class p ON p.oid = i.inhparent
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE p.relname = 'gateway_requests'
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', part.schema_name, part.table_name);
    policy_name := format('%s_tenant_isolation', part.table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', policy_name, part.schema_name, part.table_name);
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I FOR ALL USING (tenant_id = current_user_tenant_id() OR is_super_admin()) WITH CHECK (tenant_id = current_user_tenant_id() OR is_super_admin())',
      policy_name,
      part.schema_name,
      part.table_name
    );
  END LOOP;

  -- ai_metrics_hourly partitions
  FOR part IN
    SELECT n.nspname AS schema_name, c.relname AS table_name
    FROM pg_inherits i
    JOIN pg_class c ON c.oid = i.inhrelid
    JOIN pg_class p ON p.oid = i.inhparent
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE p.relname = 'ai_metrics_hourly'
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', part.schema_name, part.table_name);
    policy_name := format('%s_tenant_isolation', part.table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', policy_name, part.schema_name, part.table_name);
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I FOR ALL USING (tenant_id = current_user_tenant_id() OR is_super_admin()) WITH CHECK (tenant_id = current_user_tenant_id() OR is_super_admin())',
      policy_name,
      part.schema_name,
      part.table_name
    );
  END LOOP;
END $$;
