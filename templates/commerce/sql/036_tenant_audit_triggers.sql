-- Tenant data isolation audit triggers and monitoring

-- Table to log potential cross-tenant access attempts
CREATE TABLE IF NOT EXISTS tenant_isolation_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('cross_tenant_read', 'cross_tenant_write', 'missing_tenant_filter', 'service_role_access')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  attempted_tenant_id UUID REFERENCES tenants(id),
  user_tenant_id UUID REFERENCES tenants(id),
  query_details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_tenant_isolation_alerts_type ON tenant_isolation_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_tenant_isolation_alerts_severity ON tenant_isolation_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_tenant_isolation_alerts_created ON tenant_isolation_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_isolation_alerts_unresolved ON tenant_isolation_alerts(created_at DESC) WHERE resolved_at IS NULL;

-- Table for tenant isolation test results
CREATE TABLE IF NOT EXISTS tenant_isolation_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name TEXT NOT NULL,
  test_type TEXT NOT NULL CHECK (test_type IN ('rls_policy', 'api_endpoint', 'function', 'view')),
  table_name TEXT,
  passed BOOLEAN NOT NULL,
  error_message TEXT,
  test_details JSONB DEFAULT '{}'::jsonb,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_isolation_tests_name ON tenant_isolation_tests(test_name);
CREATE INDEX IF NOT EXISTS idx_tenant_isolation_tests_passed ON tenant_isolation_tests(passed);
CREATE INDEX IF NOT EXISTS idx_tenant_isolation_tests_executed ON tenant_isolation_tests(executed_at DESC);

-- Function to check if query properly filters by tenant
CREATE OR REPLACE FUNCTION check_tenant_isolation(
  p_table_name TEXT,
  p_tenant_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_tenant_column BOOLEAN;
  v_row_count INTEGER;
BEGIN
  -- Check if table has tenant_id column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = p_table_name
    AND column_name = 'tenant_id'
  ) INTO v_has_tenant_column;
  
  IF NOT v_has_tenant_column THEN
    RETURN TRUE; -- Table doesn't need tenant filtering
  END IF;
  
  -- Try to count rows without tenant filter (should be blocked by RLS)
  EXECUTE format('SELECT COUNT(*) FROM %I WHERE tenant_id != $1', p_table_name)
    INTO v_row_count
    USING p_tenant_id;
  
  -- If we can see rows from other tenants, isolation is broken
  RETURN v_row_count = 0;
EXCEPTION
  WHEN insufficient_privilege THEN
    -- RLS is working - access denied
    RETURN TRUE;
  WHEN OTHERS THEN
    -- Log the error
    INSERT INTO tenant_isolation_alerts (
      alert_type,
      severity,
      table_name,
      operation,
      query_details
    ) VALUES (
      'missing_tenant_filter',
      'high',
      p_table_name,
      'SELECT',
      jsonb_build_object('error', SQLERRM)
    );
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to run tenant isolation tests
CREATE OR REPLACE FUNCTION run_tenant_isolation_tests()
RETURNS TABLE (
  test_name TEXT,
  passed BOOLEAN,
  details TEXT
) AS $$
DECLARE
  v_test_record RECORD;
  v_tables TEXT[];
  v_table TEXT;
  v_passed BOOLEAN;
  v_details TEXT;
BEGIN
  -- Get all tables with tenant_id column
  SELECT array_agg(table_name::TEXT)
  INTO v_tables
  FROM information_schema.columns
  WHERE column_name = 'tenant_id'
    AND table_schema = 'public';
  
  -- Test 1: Check RLS is enabled on all tenant tables
  FOR v_table IN SELECT unnest(v_tables) LOOP
    SELECT relrowsecurity
    INTO v_passed
    FROM pg_class
    WHERE relname = v_table;
    
    v_details := format('RLS enabled: %s', v_passed);
    
    INSERT INTO tenant_isolation_tests (
      test_name,
      test_type,
      table_name,
      passed,
      test_details
    ) VALUES (
      format('RLS enabled on %s', v_table),
      'rls_policy',
      v_table,
      COALESCE(v_passed, FALSE),
      jsonb_build_object('rls_enabled', v_passed)
    );
    
    RETURN QUERY SELECT 
      format('RLS enabled on %s', v_table)::TEXT,
      COALESCE(v_passed, FALSE),
      v_details;
  END LOOP;
  
  -- Test 2: Check that policies exist for tenant filtering
  FOR v_table IN SELECT unnest(v_tables) LOOP
    SELECT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = v_table
      AND policyname LIKE '%tenant%'
    ) INTO v_passed;
    
    v_details := format('Tenant policy exists: %s', v_passed);
    
    INSERT INTO tenant_isolation_tests (
      test_name,
      test_type,
      table_name,
      passed,
      test_details
    ) VALUES (
      format('Tenant policy on %s', v_table),
      'rls_policy',
      v_table,
      v_passed,
      jsonb_build_object('has_tenant_policy', v_passed)
    );
    
    RETURN QUERY SELECT 
      format('Tenant policy on %s', v_table)::TEXT,
      v_passed,
      v_details;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log service role usage (for auditing)
CREATE OR REPLACE FUNCTION log_service_role_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if current role is service role
  IF current_setting('role', true) = 'service_role' THEN
    INSERT INTO tenant_isolation_alerts (
      alert_type,
      severity,
      table_name,
      operation,
      query_details
    ) VALUES (
      'service_role_access',
      'low',
      TG_TABLE_NAME,
      TG_OP,
      jsonb_build_object(
        'trigger_name', TG_NAME,
        'table', TG_TABLE_NAME,
        'operation', TG_OP
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- RLS policies for audit tables
ALTER TABLE tenant_isolation_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_isolation_tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view isolation alerts" ON tenant_isolation_alerts;
CREATE POLICY "Admins can view isolation alerts"
ON tenant_isolation_alerts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

DROP POLICY IF EXISTS "Admins can manage isolation alerts" ON tenant_isolation_alerts;
CREATE POLICY "Admins can manage isolation alerts"
ON tenant_isolation_alerts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

DROP POLICY IF EXISTS "Admins can view test results" ON tenant_isolation_tests;
CREATE POLICY "Admins can view test results"
ON tenant_isolation_tests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

COMMENT ON TABLE tenant_isolation_alerts IS 'Logs potential tenant data isolation violations';
COMMENT ON TABLE tenant_isolation_tests IS 'Stores results of automated tenant isolation tests';
COMMENT ON FUNCTION check_tenant_isolation IS 'Tests if a table properly enforces tenant isolation';
COMMENT ON FUNCTION run_tenant_isolation_tests IS 'Runs comprehensive tenant isolation test suite';
