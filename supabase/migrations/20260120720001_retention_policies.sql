-- ═══════════════════════════════════════════════════════════════════════════
-- Retention Policies Schema
-- Unified retention configuration for all data stores
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- Retention Policies
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Default retention
    default_days INTEGER NOT NULL DEFAULT 365,
    default_action VARCHAR(20) NOT NULL DEFAULT 'delete', -- 'delete', 'archive', 'anonymize'
    
    -- Category-specific overrides (JSONB)
    overrides JSONB DEFAULT '{}',
    -- Example:
    -- {
    --   "audit_logs": {"days": 365, "action": "archive"},
    --   "cache_entries": {"days": 7, "action": "delete"},
    --   "gateway_requests": {"days": 90, "action": "delete"}
    -- }
    
    -- Compliance requirements
    compliance_frameworks JSONB, -- ["SOC2", "GDPR", "HIPAA"]
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Retention Executions (audit log)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS retention_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    policy_id UUID REFERENCES retention_policies(id),
    
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Summary
    rules_executed INTEGER DEFAULT 0,
    total_records_affected BIGINT DEFAULT 0,
    
    -- Detailed results
    results JSONB,
    -- [
    --   {"category": "audit_logs", "records_affected": 1234, "action": "delete"},
    --   {"category": "cache_entries", "records_affected": 5678, "action": "delete"}
    -- ]
    
    -- Execution type
    execution_type VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'manual'
    triggered_by UUID REFERENCES auth.users(id),
    
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_retention_policies_tenant 
    ON retention_policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_retention_policies_active 
    ON retention_policies(tenant_id, is_active) 
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_retention_executions_tenant 
    ON retention_executions(tenant_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_retention_executions_policy 
    ON retention_executions(policy_id, executed_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "retention_policies_tenant_isolation" ON retention_policies
    FOR ALL USING (
        tenant_id = current_user_tenant_id()
        OR is_super_admin()
    );

CREATE POLICY "retention_executions_tenant_isolation" ON retention_executions
    FOR ALL USING (
        tenant_id = current_user_tenant_id()
        OR is_super_admin()
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- Retention Cleanup Function
-- Generic function to execute retention cleanup for any table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION execute_retention_cleanup(
    p_table_name TEXT,
    p_tenant_id UUID,
    p_retention_days INTEGER,
    p_action TEXT DEFAULT 'delete'
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_cutoff_date TIMESTAMPTZ;
    v_sql TEXT;
BEGIN
    v_cutoff_date := NOW() - (p_retention_days || ' days')::INTERVAL;
    
    IF p_action = 'delete' THEN
        v_sql := format(
            'WITH deleted AS (
                DELETE FROM %I 
                WHERE tenant_id = %L 
                  AND created_at < %L
                RETURNING 1
            )
            SELECT COUNT(*) FROM deleted',
            p_table_name, p_tenant_id, v_cutoff_date
        );
    ELSIF p_action = 'anonymize' THEN
        -- Anonymize context fields
        v_sql := format(
            'WITH updated AS (
                UPDATE %I 
                SET context = context || ''{"anonymized": true}''::jsonb
                WHERE tenant_id = %L 
                  AND created_at < %L
                  AND NOT COALESCE((context->>''anonymized'')::boolean, false)
                RETURNING 1
            )
            SELECT COUNT(*) FROM updated',
            p_table_name, p_tenant_id, v_cutoff_date
        );
    ELSE
        -- Default to counting (dry run)
        v_sql := format(
            'SELECT COUNT(*) FROM %I 
             WHERE tenant_id = %L AND created_at < %L',
            p_table_name, p_tenant_id, v_cutoff_date
        );
    END IF;
    
    EXECUTE v_sql INTO v_count;
    
    RETURN COALESCE(v_count, 0);
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Retention cleanup error for %: %', p_table_name, SQLERRM;
    RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- Execute All Retention Policies (for cron job)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION execute_all_retention_policies()
RETURNS TABLE(
    tenant_id UUID,
    policy_id UUID,
    records_affected BIGINT
) AS $$
DECLARE
    v_policy RECORD;
    v_category TEXT;
    v_override JSONB;
    v_days INTEGER;
    v_action TEXT;
    v_count INTEGER;
    v_total BIGINT;
    v_table_mapping JSONB := '{
        "audit_logs": "activity_ledger",
        "ai_traces": "ai_runs",
        "cache_entries": "cache_entries",
        "gateway_requests": "gateway_requests",
        "webhook_payloads": "webhook_deliveries"
    }'::JSONB;
BEGIN
    -- Loop through all active retention policies
    FOR v_policy IN 
        SELECT * FROM retention_policies WHERE is_active = true
    LOOP
        v_total := 0;
        
        -- Execute retention for each category in the mapping
        FOR v_category, v_override IN 
            SELECT key, value FROM jsonb_each(v_policy.overrides)
        LOOP
            v_days := (v_override->>'days')::INTEGER;
            v_action := COALESCE(v_override->>'action', v_policy.default_action);
            
            -- Get table name for this category
            IF v_table_mapping ? v_category THEN
                v_count := execute_retention_cleanup(
                    v_table_mapping->>v_category,
                    v_policy.tenant_id,
                    v_days,
                    v_action
                );
                v_total := v_total + v_count;
            END IF;
        END LOOP;
        
        -- Log execution
        INSERT INTO retention_executions (
            tenant_id, policy_id, rules_executed, 
            total_records_affected, execution_type
        ) VALUES (
            v_policy.tenant_id, v_policy.id, 
            jsonb_array_length(to_jsonb(array_agg(v_category))),
            v_total, 'scheduled'
        );
        
        -- Return result
        tenant_id := v_policy.tenant_id;
        policy_id := v_policy.id;
        records_affected := v_total;
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- Note: Default retention policy templates should be created per-tenant
-- via application code or a separate seed script, not in the migration.
-- ─────────────────────────────────────────────────────────────────────────────
