-- ════════════════════════════════════════════════════════════════════════════
-- API Key Management Schema
-- Secure storage for API keys used across projects
-- ════════════════════════════════════════════════════════════════════════════

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL for super_admin scope
  
  -- Key identification
  name VARCHAR(255) NOT NULL,
  provider VARCHAR(100) NOT NULL, -- 'openai', 'cloudflare', 'twilio', 'resend', 'stripe', 'custom'
  description TEXT,
  
  -- Encrypted key storage
  encrypted_key TEXT NOT NULL,           -- AES-256-GCM encrypted
  encryption_iv VARCHAR(32) NOT NULL,    -- IV for decryption
  key_hint VARCHAR(10),                  -- Last 4 chars for identification (e.g., "...sk-abc123")
  
  -- Environment & Scope
  environment VARCHAR(50) NOT NULL DEFAULT 'development', -- 'development', 'staging', 'production'
  scope VARCHAR(50) NOT NULL DEFAULT 'super_admin',       -- 'super_admin', 'tenant', 'project'
  project_name VARCHAR(255),             -- Optional project association
  
  -- Metadata
  metadata JSONB DEFAULT '{}',           -- Provider-specific: rate limits, permissions, model access
  tags TEXT[] DEFAULT '{}',              -- For organization/filtering
  
  -- Usage tracking
  last_used_at TIMESTAMPTZ,
  use_count INTEGER DEFAULT 0,
  
  -- Expiration
  expires_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_api_keys_owner ON api_keys(owner_id);
CREATE INDEX idx_api_keys_tenant ON api_keys(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_api_keys_provider ON api_keys(provider);
CREATE INDEX idx_api_keys_environment ON api_keys(environment);
CREATE INDEX idx_api_keys_scope ON api_keys(scope);
CREATE INDEX idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;

-- API Key usage log
CREATE TABLE IF NOT EXISTS api_key_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  
  -- Usage details
  action VARCHAR(100) NOT NULL,          -- 'read', 'api_call', 'export', 'test'
  source VARCHAR(255),                   -- Where it was used from
  ip_address INET,
  user_agent TEXT,
  
  -- Result
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_key_usage_key ON api_key_usage(key_id);
CREATE INDEX idx_api_key_usage_created ON api_key_usage(created_at DESC);

-- ════════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_usage ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role = 'super_admin'
    AND tenant_id IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- API Keys policies
-- Super admins can see all their keys and tenant-scoped keys they created
CREATE POLICY "api_keys_select" ON api_keys
  FOR SELECT
  USING (
    owner_id = auth.uid()
    OR (is_super_admin() AND scope = 'super_admin')
  );

CREATE POLICY "api_keys_insert" ON api_keys
  FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
    AND (
      -- Super admins can create any scope
      is_super_admin()
      -- Tenant users can only create tenant-scoped keys for their tenant
      OR (scope = 'tenant' AND tenant_id = (SELECT tenant_id FROM "709_profiles" WHERE id = auth.uid()))
    )
  );

CREATE POLICY "api_keys_update" ON api_keys
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "api_keys_delete" ON api_keys
  FOR DELETE
  USING (owner_id = auth.uid());

-- Usage log policies (only owner can see)
CREATE POLICY "api_key_usage_select" ON api_key_usage
  FOR SELECT
  USING (
    key_id IN (SELECT id FROM api_keys WHERE owner_id = auth.uid())
  );

CREATE POLICY "api_key_usage_insert" ON api_key_usage
  FOR INSERT
  WITH CHECK (
    key_id IN (SELECT id FROM api_keys WHERE owner_id = auth.uid())
    OR is_super_admin()
  );

-- ════════════════════════════════════════════════════════════════════════════
-- Functions
-- ════════════════════════════════════════════════════════════════════════════

-- Update use count and last_used_at
CREATE OR REPLACE FUNCTION update_api_key_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE api_keys
  SET 
    use_count = use_count + 1,
    last_used_at = NOW()
  WHERE id = NEW.key_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_api_key_usage
  AFTER INSERT ON api_key_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_api_key_usage();

-- Get key statistics
CREATE OR REPLACE FUNCTION get_api_key_stats(p_owner_id UUID)
RETURNS TABLE (
  total_keys BIGINT,
  active_keys BIGINT,
  expiring_soon BIGINT,
  by_provider JSONB,
  by_environment JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_keys,
    COUNT(*) FILTER (WHERE is_active)::BIGINT AS active_keys,
    COUNT(*) FILTER (WHERE expires_at IS NOT NULL AND expires_at < NOW() + INTERVAL '30 days')::BIGINT AS expiring_soon,
    COALESCE(jsonb_object_agg(provider, cnt) FILTER (WHERE provider IS NOT NULL), '{}') AS by_provider,
    COALESCE(jsonb_object_agg(environment, env_cnt) FILTER (WHERE environment IS NOT NULL), '{}') AS by_environment
  FROM (
    SELECT provider, COUNT(*) as cnt, environment, COUNT(*) as env_cnt
    FROM api_keys
    WHERE owner_id = p_owner_id
    GROUP BY provider, environment
  ) stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ════════════════════════════════════════════════════════════════════════════
-- Seed common providers
-- ════════════════════════════════════════════════════════════════════════════

-- Provider metadata reference (not a table, just for documentation)
COMMENT ON TABLE api_keys IS 'Common providers:
- openai: OpenAI API keys (GPT, DALL-E, Whisper)
- anthropic: Anthropic Claude API keys
- cloudflare: Cloudflare API tokens (R2, Workers, DNS)
- twilio: Twilio API credentials
- resend: Resend email API keys
- stripe: Stripe API keys
- github: GitHub personal access tokens
- aws: AWS access keys
- vercel: Vercel API tokens
- supabase: Supabase service role keys
- custom: Any other API key';
