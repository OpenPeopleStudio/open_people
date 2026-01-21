-- ═══════════════════════════════════════════════════════════════════════════
-- API Gateway Schema
-- Tables for policy-aware routing, provider management, and request logging
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- Gateway Providers
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gateway_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Provider info
    provider_name VARCHAR(100) NOT NULL, -- 'openai', 'anthropic', 'google', 'azure', 'custom'
    display_name VARCHAR(255),
    
    -- Connection
    base_url VARCHAR(500) NOT NULL,
    api_key_encrypted BYTEA, -- Encrypted API key
    
    -- Models available
    available_models JSONB DEFAULT '[]', -- ['gpt-4', 'gpt-3.5-turbo']
    
    -- Limits
    rate_limit_rpm INTEGER, -- Requests per minute
    rate_limit_tpm INTEGER, -- Tokens per minute
    
    -- Health
    is_healthy BOOLEAN DEFAULT true,
    last_health_check TIMESTAMPTZ,
    health_check_failures INTEGER DEFAULT 0,
    
    -- Priority for routing
    priority INTEGER DEFAULT 0,
    
    -- Compliance & Security flags
    pii_approved BOOLEAN DEFAULT false, -- Provider approved for PII data
    hipaa_compliant BOOLEAN DEFAULT false,
    data_residency VARCHAR(50), -- 'US', 'EU', 'APAC'
    
    -- Cost tracking
    cost_per_1k_input DECIMAL(10, 6) DEFAULT 0,
    cost_per_1k_output DECIMAL(10, 6) DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Gateway API Keys (for external access to gateway)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gateway_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Key identification
    name VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(20) NOT NULL, -- First few chars for identification (e.g., "op_sk_abc...")
    key_hash VARCHAR(64) NOT NULL, -- SHA-256 of full key
    
    -- Scope
    allowed_models JSONB, -- NULL = all
    allowed_applications JSONB,
    
    -- Limits
    rate_limit_rpm INTEGER,
    monthly_budget DECIMAL(10,2),
    
    -- Tracking
    last_used_at TIMESTAMPTZ,
    total_requests BIGINT DEFAULT 0,
    total_tokens BIGINT DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    -- Security
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Gateway Routing Rules
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gateway_routing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Condition (JSONB for flexibility)
    condition JSONB NOT NULL,
    -- Examples:
    -- { "type": "pii_detected", "pii_types": ["ssn", "credit_card"] }
    -- { "type": "risk_level", "levels": ["high", "critical"] }
    -- { "type": "model", "values": ["gpt-4"] }
    -- { "type": "budget_exceeded" }
    
    -- Action
    action JSONB NOT NULL,
    -- Examples:
    -- { "type": "route_to_provider", "provider_id": "..." }
    -- { "type": "use_model", "model": "gpt-4o-mini" }
    -- { "type": "add_system_prompt", "prompt": "..." }
    -- { "type": "block", "reason": "..." }
    
    -- Priority (higher = evaluated first)
    priority INTEGER DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gateway_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Request identification
    request_id VARCHAR(64) NOT NULL,
    api_key_id UUID REFERENCES gateway_api_keys(id),
    
    -- Request details
    requested_model VARCHAR(255),
    actual_provider VARCHAR(100),
    actual_model VARCHAR(255),
    
    -- Routing
    routing_rule_id UUID REFERENCES gateway_routing_rules(id),
    failover_occurred BOOLEAN DEFAULT false,
    failover_attempts INTEGER DEFAULT 0,
    
    -- Metrics
    input_tokens INTEGER,
    output_tokens INTEGER,
    latency_ms INTEGER,
    
    -- Status
    status VARCHAR(20) NOT NULL, -- 'success', 'error', 'timeout'
    error_code VARCHAR(50),
    error_message TEXT,
    
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

DO $$ BEGIN
  CREATE TABLE gateway_requests_2026_01 PARTITION OF gateway_requests
      FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE TABLE gateway_requests_2026_02 PARTITION OF gateway_requests
      FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE TABLE gateway_requests_2026_03 PARTITION OF gateway_requests
      FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE TABLE gateway_requests_2026_04 PARTITION OF gateway_requests
      FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE TABLE gateway_requests_2026_05 PARTITION OF gateway_requests
      FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE TABLE gateway_requests_2026_06 PARTITION OF gateway_requests
      FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Tenant Rate Limits (for budget-based routing)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenant_rate_limits (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Request limits
    requests_per_minute INTEGER,
    requests_per_day INTEGER,
    
    -- Token limits
    tokens_per_day BIGINT,
    tokens_per_month BIGINT,
    
    -- Cost limits
    cost_per_day DECIMAL(10,2),
    cost_per_month DECIMAL(10,2),
    
    -- Alerts
    alert_at_percentage INTEGER DEFAULT 80, -- Alert when 80% of budget used
    alert_email VARCHAR(255),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_gateway_providers_tenant 
    ON gateway_providers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gateway_providers_active 
    ON gateway_providers(tenant_id, is_active, is_healthy);
    
CREATE INDEX IF NOT EXISTS idx_gateway_api_keys_tenant 
    ON gateway_api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gateway_api_keys_hash 
    ON gateway_api_keys(key_hash) WHERE is_active = true;
    
CREATE INDEX IF NOT EXISTS idx_gateway_routing_rules_tenant 
    ON gateway_routing_rules(tenant_id, priority DESC);
    
CREATE INDEX IF NOT EXISTS idx_gateway_requests_tenant_time 
    ON gateway_requests(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gateway_requests_request_id 
    ON gateway_requests(request_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE gateway_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE gateway_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE gateway_routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE gateway_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_rate_limits ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies to keep migration idempotent
DROP POLICY IF EXISTS "gateway_providers_tenant_isolation" ON gateway_providers;
DROP POLICY IF EXISTS "gateway_api_keys_tenant_isolation" ON gateway_api_keys;
DROP POLICY IF EXISTS "gateway_routing_rules_tenant_isolation" ON gateway_routing_rules;
DROP POLICY IF EXISTS "gateway_requests_tenant_isolation" ON gateway_requests;
DROP POLICY IF EXISTS "tenant_rate_limits_tenant_isolation" ON tenant_rate_limits;

-- Gateway providers policies
CREATE POLICY "gateway_providers_tenant_isolation" ON gateway_providers
    FOR ALL USING (
        tenant_id = current_user_tenant_id()
        OR is_super_admin()
    );

-- Gateway API keys policies
CREATE POLICY "gateway_api_keys_tenant_isolation" ON gateway_api_keys
    FOR ALL USING (
        tenant_id = current_user_tenant_id()
        OR is_super_admin()
    );

-- Gateway routing rules policies
CREATE POLICY "gateway_routing_rules_tenant_isolation" ON gateway_routing_rules
    FOR ALL USING (
        tenant_id = current_user_tenant_id()
        OR is_super_admin()
    );

-- Gateway requests policies
CREATE POLICY "gateway_requests_tenant_isolation" ON gateway_requests
    FOR ALL USING (
        tenant_id = current_user_tenant_id()
        OR is_super_admin()
    );

-- Tenant rate limits policies
CREATE POLICY "tenant_rate_limits_tenant_isolation" ON tenant_rate_limits
    FOR ALL USING (
        tenant_id = current_user_tenant_id()
        OR is_super_admin()
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper Functions
-- ─────────────────────────────────────────────────────────────────────────────

-- Function to get daily spend for a tenant
CREATE OR REPLACE FUNCTION get_tenant_daily_spend(p_tenant_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total_spend DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(estimated_cost_usd), 0)
    INTO total_spend
    FROM ai_runs
    WHERE tenant_id = p_tenant_id
      AND created_at >= CURRENT_DATE;
    
    RETURN total_spend;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get monthly spend for a tenant
CREATE OR REPLACE FUNCTION get_tenant_monthly_spend(p_tenant_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total_spend DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(estimated_cost_usd), 0)
    INTO total_spend
    FROM ai_runs
    WHERE tenant_id = p_tenant_id
      AND created_at >= date_trunc('month', CURRENT_DATE);
    
    RETURN total_spend;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if tenant is over budget
CREATE OR REPLACE FUNCTION is_tenant_over_budget(p_tenant_id UUID)
RETURNS TABLE(
    over_daily BOOLEAN,
    over_monthly BOOLEAN,
    daily_spent DECIMAL(10,2),
    monthly_spent DECIMAL(10,2),
    daily_limit DECIMAL(10,2),
    monthly_limit DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE WHEN trl.cost_per_day IS NOT NULL 
             THEN get_tenant_daily_spend(p_tenant_id) >= trl.cost_per_day 
             ELSE false END,
        CASE WHEN trl.cost_per_month IS NOT NULL 
             THEN get_tenant_monthly_spend(p_tenant_id) >= trl.cost_per_month 
             ELSE false END,
        get_tenant_daily_spend(p_tenant_id),
        get_tenant_monthly_spend(p_tenant_id),
        trl.cost_per_day,
        trl.cost_per_month
    FROM tenant_rate_limits trl
    WHERE trl.tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
