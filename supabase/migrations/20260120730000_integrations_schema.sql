-- ═══════════════════════════════════════════════════════════════════════════
-- Integrations Schema
-- Device-bound tokens and registered devices for enterprise plugins
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- Plugin Tokens (device-bound, short-lived)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS plugin_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id VARCHAR(64) NOT NULL, -- Hash of device fingerprint
    
    -- Token security
    token_hash VARCHAR(64) NOT NULL, -- SHA-256 of actual token
    token_prefix VARCHAR(20) NOT NULL, -- For identification (e.g., "op_pt_abc...")
    
    -- Device attestation
    attestation JSONB NOT NULL,
    -- {
    --   "platform": "browser",
    --   "fingerprint_hash": "...",
    --   "user_agent": "...",
    --   "created_at": "..."
    -- }
    
    -- Scopes
    scopes JSONB DEFAULT '["chat", "read"]',
    
    -- Expiration
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Usage tracking
    last_used_at TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    revoked_at TIMESTAMPTZ,
    revoke_reason VARCHAR(50),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Registered Devices
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS registered_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id VARCHAR(64) NOT NULL,
    
    -- Device info
    attestation JSONB NOT NULL,
    
    -- Trust status
    is_trusted BOOLEAN DEFAULT true,
    
    -- Activity
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, user_id, device_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Integration Configs (per-application context minimization settings)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS integration_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    application_id VARCHAR(255), -- e.g., "slack", "teams", "vscode"
    
    -- Context minimization config
    context_minimization JSONB DEFAULT '{
        "allow_page_content": true,
        "allow_code_context": true,
        "allow_file_attachments": true,
        "allow_clipboard_content": true,
        "allow_screenshot_content": false,
        "max_context_tokens": 8000,
        "max_file_size_bytes": 100000,
        "max_files_count": 5,
        "strip_credentials_patterns": true
    }',
    
    -- Integration-specific settings
    settings JSONB DEFAULT '{}',
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, application_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- HITL Escalation Items
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hitl_escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Source info
    source_type VARCHAR(50) NOT NULL, -- 'chat_bot', 'gateway', 'workflow'
    source_id VARCHAR(255), -- Conversation ID, request ID, etc.
    
    -- Context
    thread_context JSONB, -- Messages, context, etc.
    escalation_reason TEXT,
    
    -- Priority
    priority VARCHAR(20) DEFAULT 'normal', -- 'normal', 'high', 'urgent'
    
    -- Assignment
    assigned_to UUID REFERENCES auth.users(id),
    assigned_team VARCHAR(100),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'resolved', 'cancelled'
    
    -- Resolution
    resolution TEXT,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_plugin_tokens_hash 
    ON plugin_tokens(token_hash) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_plugin_tokens_user 
    ON plugin_tokens(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_plugin_tokens_device 
    ON plugin_tokens(tenant_id, device_id);
CREATE INDEX IF NOT EXISTS idx_plugin_tokens_expires 
    ON plugin_tokens(expires_at) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_registered_devices_user 
    ON registered_devices(tenant_id, user_id);

CREATE INDEX IF NOT EXISTS idx_integration_configs_tenant 
    ON integration_configs(tenant_id);

CREATE INDEX IF NOT EXISTS idx_hitl_escalations_tenant 
    ON hitl_escalations(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_hitl_escalations_assigned 
    ON hitl_escalations(assigned_to, status) WHERE status IN ('pending', 'in_progress');

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE plugin_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE registered_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hitl_escalations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plugin_tokens_tenant_isolation" ON plugin_tokens
    FOR ALL USING (
        tenant_id = current_user_tenant_id()
        OR is_super_admin()
    );

CREATE POLICY "registered_devices_tenant_isolation" ON registered_devices
    FOR ALL USING (
        tenant_id = current_user_tenant_id()
        OR is_super_admin()
    );

CREATE POLICY "integration_configs_tenant_isolation" ON integration_configs
    FOR ALL USING (
        tenant_id = current_user_tenant_id()
        OR is_super_admin()
    );

CREATE POLICY "hitl_escalations_tenant_isolation" ON hitl_escalations
    FOR ALL USING (
        tenant_id = current_user_tenant_id()
        OR is_super_admin()
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- Cleanup Functions
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION cleanup_expired_plugin_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM plugin_tokens
        WHERE expires_at < NOW()
          AND is_active = false
        RETURNING 1
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
