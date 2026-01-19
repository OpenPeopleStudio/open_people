-- Automated data retention policies and cleanup

-- Retention policy definitions
CREATE TABLE IF NOT EXISTS retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name TEXT NOT NULL UNIQUE,
  table_name TEXT NOT NULL,
  retention_days INTEGER NOT NULL,
  delete_column TEXT NOT NULL DEFAULT 'created_at',
  enabled BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Retention execution log
CREATE TABLE IF NOT EXISTS retention_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID REFERENCES retention_policies(id),
  policy_name TEXT NOT NULL,
  table_name TEXT NOT NULL,
  rows_deleted INTEGER DEFAULT 0,
  execution_duration_ms INTEGER,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retention_executions_policy ON retention_executions(policy_id);
CREATE INDEX IF NOT EXISTS idx_retention_executions_executed ON retention_executions(executed_at DESC);

-- Insert default retention policies
INSERT INTO retention_policies (policy_name, table_name, retention_days, delete_column, enabled) VALUES
  ('message_attachments', 'message_attachments', 90, 'created_at', TRUE),
  ('staff_locations', 'staff_locations', 2, 'recorded_at', TRUE),
  ('recently_viewed', 'recently_viewed', 90, 'viewed_at', TRUE),
  ('activity_logs', 'activity_logs', 365, 'created_at', TRUE),
  ('data_exports', 'data_exports', 90, 'created_at', TRUE),
  ('consignor_portal_access', 'consignor_portal_access', 30, 'created_at', TRUE),
  ('tenant_isolation_tests', 'tenant_isolation_tests', 90, 'executed_at', TRUE)
ON CONFLICT (policy_name) DO UPDATE
SET retention_days = EXCLUDED.retention_days,
    enabled = EXCLUDED.enabled;

-- Function to execute retention policy
CREATE OR REPLACE FUNCTION execute_retention_policy(p_policy_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_policy RECORD;
  v_cutoff_date TIMESTAMP WITH TIME ZONE;
  v_rows_deleted INTEGER;
  v_start_time TIMESTAMP WITH TIME ZONE;
  v_duration_ms INTEGER;
  v_error_msg TEXT;
BEGIN
  -- Get policy details
  SELECT * INTO v_policy FROM retention_policies WHERE id = p_policy_id AND enabled = TRUE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Policy not found or disabled';
  END IF;
  
  v_start_time := clock_timestamp();
  v_cutoff_date := NOW() - (v_policy.retention_days || ' days')::INTERVAL;
  
  BEGIN
    -- Execute delete with dynamic SQL
    EXECUTE format(
      'DELETE FROM %I WHERE %I < $1',
      v_policy.table_name,
      v_policy.delete_column
    ) USING v_cutoff_date;
    
    GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
    v_duration_ms := EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time)) * 1000;
    
    -- Log successful execution
    INSERT INTO retention_executions (
      policy_id,
      policy_name,
      table_name,
      rows_deleted,
      execution_duration_ms,
      status
    ) VALUES (
      p_policy_id,
      v_policy.policy_name,
      v_policy.table_name,
      v_rows_deleted,
      v_duration_ms,
      'success'
    );
    
    -- Update last run time
    UPDATE retention_policies SET last_run_at = NOW() WHERE id = p_policy_id;
    
    RETURN v_rows_deleted;
    
  EXCEPTION WHEN OTHERS THEN
    v_error_msg := SQLERRM;
    v_duration_ms := EXTRACT(EPOCH FROM (clock_timestamp() - v_start_time)) * 1000;
    
    -- Log failed execution
    INSERT INTO retention_executions (
      policy_id,
      policy_name,
      table_name,
      rows_deleted,
      execution_duration_ms,
      status,
      error_message
    ) VALUES (
      p_policy_id,
      v_policy.policy_name,
      v_policy.table_name,
      0,
      v_duration_ms,
      'failed',
      v_error_msg
    );
    
    RAISE EXCEPTION 'Retention policy execution failed: %', v_error_msg;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to execute all retention policies
CREATE OR REPLACE FUNCTION execute_all_retention_policies()
RETURNS TABLE (
  policy_name TEXT,
  rows_deleted INTEGER,
  status TEXT
) AS $$
DECLARE
  v_policy RECORD;
  v_deleted INTEGER;
BEGIN
  FOR v_policy IN 
    SELECT id, policy_name FROM retention_policies WHERE enabled = TRUE
  LOOP
    BEGIN
      v_deleted := execute_retention_policy(v_policy.id);
      
      RETURN QUERY SELECT 
        v_policy.policy_name,
        v_deleted,
        'success'::TEXT;
        
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT 
        v_policy.policy_name,
        0,
        'failed'::TEXT;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired message attachments
CREATE OR REPLACE FUNCTION cleanup_expired_message_attachments()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  -- Delete attachments for deleted messages
  DELETE FROM message_attachments ma
  WHERE NOT EXISTS (
    SELECT 1 FROM messages m
    WHERE m.id = ma.message_id
    AND m.deleted_at IS NULL
  );
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired user consents
CREATE OR REPLACE FUNCTION cleanup_expired_consents()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  -- Mark expired consents
  UPDATE user_consents
  SET consent_given = FALSE
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW()
    AND consent_given = TRUE;
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  -- Log the expiration in audit
  IF v_deleted > 0 THEN
    INSERT INTO consent_audit (
      user_id,
      tenant_id,
      consent_type_code,
      action,
      previous_state,
      new_state,
      details
    )
    SELECT
      user_id,
      tenant_id,
      consent_type_code,
      'expired',
      TRUE,
      FALSE,
      jsonb_build_object('expired_at', NOW())
    FROM user_consents
    WHERE expires_at IS NOT NULL
      AND expires_at < NOW()
      AND consent_given = FALSE
      AND NOT EXISTS (
        SELECT 1 FROM consent_audit ca
        WHERE ca.user_id = user_consents.user_id
          AND ca.consent_type_code = user_consents.consent_type_code
          AND ca.action = 'expired'
          AND ca.changed_at > NOW() - INTERVAL '1 hour'
      );
  END IF;
  
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to archive old orders
CREATE OR REPLACE FUNCTION archive_old_orders(p_years INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
  v_archived INTEGER;
  v_archive_date TIMESTAMP WITH TIME ZONE;
BEGIN
  v_archive_date := NOW() - (p_years || ' years')::INTERVAL;
  
  -- For now, just mark them (in production, move to cold storage)
  UPDATE orders
  SET status = 'archived'
  WHERE created_at < v_archive_date
    AND status NOT IN ('pending', 'paid', 'fulfilled', 'shipped')
    AND status != 'archived';
  
  GET DIAGNOSTICS v_archived = ROW_COUNT;
  RETURN v_archived;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies
ALTER TABLE retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view retention policies" ON retention_policies;
CREATE POLICY "Admins can view retention policies"
ON retention_policies FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

DROP POLICY IF EXISTS "Admins can manage retention policies" ON retention_policies;
CREATE POLICY "Admins can manage retention policies"
ON retention_policies FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('owner')
  )
);

DROP POLICY IF EXISTS "Admins can view retention executions" ON retention_executions;
CREATE POLICY "Admins can view retention executions"
ON retention_executions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

COMMENT ON TABLE retention_policies IS 'Defines automated data retention policies';
COMMENT ON TABLE retention_executions IS 'Logs retention policy executions';
COMMENT ON FUNCTION execute_retention_policy IS 'Executes a single retention policy';
COMMENT ON FUNCTION execute_all_retention_policies IS 'Executes all enabled retention policies';
COMMENT ON FUNCTION cleanup_expired_message_attachments IS 'Removes orphaned message attachments';
COMMENT ON FUNCTION cleanup_expired_consents IS 'Expires outdated user consents';
COMMENT ON FUNCTION archive_old_orders IS 'Archives orders older than specified years';
