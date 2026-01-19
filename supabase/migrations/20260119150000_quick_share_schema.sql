-- ════════════════════════════════════════════════════════════════════════════
-- Quick Share Schema
-- Long-lived upload tokens for frictionless file sharing to vault
-- ════════════════════════════════════════════════════════════════════════════

-- Upload Tokens (long-lived, device-specific)
CREATE TABLE IF NOT EXISTS vault_upload_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES vault_spaces(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Token identification
  name VARCHAR(255) NOT NULL,           -- "MacBook Pro", "iPhone", "CLI"
  token_hash VARCHAR(64) NOT NULL,      -- SHA-256 hash of the token (token never stored)
  token_prefix VARCHAR(12) NOT NULL,    -- First 8 chars for identification (e.g., "qs_abc123...")
  
  -- Permissions
  permissions JSONB DEFAULT '{"upload": true, "auto_approve": false}',
  default_folder_id UUID REFERENCES vault_folders(id) ON DELETE SET NULL,
  allowed_types TEXT[] DEFAULT '{}',    -- Empty = all types allowed
  max_file_size_mb INTEGER DEFAULT 100,
  
  -- Rate limiting
  rate_limit_per_hour INTEGER DEFAULT 60,
  rate_limit_per_day INTEGER DEFAULT 500,
  
  -- Usage tracking
  upload_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  last_ip_address INET,
  last_user_agent TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,               -- NULL = never expires
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upload token usage log
CREATE TABLE IF NOT EXISTS vault_upload_token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES vault_upload_tokens(id) ON DELETE CASCADE,
  
  -- Upload details
  file_id UUID REFERENCES vault_files(id) ON DELETE SET NULL,
  filename VARCHAR(500),
  file_size_bytes BIGINT,
  content_type VARCHAR(255),
  
  -- Result
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  
  -- AI categorization
  ai_suggested_folder VARCHAR(255),
  ai_category VARCHAR(100),
  ai_tags TEXT[],
  
  -- Client info
  ip_address INET,
  user_agent TEXT,
  client_type VARCHAR(50),              -- 'cli', 'extension', 'mobile', 'web'
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quick share inbox (files pending review)
CREATE TABLE IF NOT EXISTS vault_quick_share_inbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES vault_spaces(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES vault_files(id) ON DELETE CASCADE,
  token_id UUID REFERENCES vault_upload_tokens(id) ON DELETE SET NULL,
  
  -- AI suggestions
  suggested_folder_id UUID REFERENCES vault_folders(id) ON DELETE SET NULL,
  suggested_folder_path TEXT,
  ai_category VARCHAR(100),
  ai_summary TEXT,
  ai_tags TEXT[],
  confidence_score DECIMAL(3,2),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_at TIMESTAMPTZ,
  
  -- Source info
  source_device VARCHAR(255),
  source_ip INET,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════════════════
-- Indexes
-- ════════════════════════════════════════════════════════════════════════════

CREATE INDEX idx_upload_tokens_vault ON vault_upload_tokens(vault_id);
CREATE INDEX idx_upload_tokens_owner ON vault_upload_tokens(owner_id);
CREATE INDEX idx_upload_tokens_hash ON vault_upload_tokens(token_hash);
CREATE INDEX idx_upload_tokens_active ON vault_upload_tokens(is_active) WHERE is_active = true;

CREATE INDEX idx_upload_token_usage_token ON vault_upload_token_usage(token_id);
CREATE INDEX idx_upload_token_usage_created ON vault_upload_token_usage(created_at DESC);

CREATE INDEX idx_quick_share_inbox_vault ON vault_quick_share_inbox(vault_id);
CREATE INDEX idx_quick_share_inbox_status ON vault_quick_share_inbox(status) WHERE status = 'pending';

-- ════════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE vault_upload_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_upload_token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_quick_share_inbox ENABLE ROW LEVEL SECURITY;

-- Tokens: owner only
CREATE POLICY "upload_tokens_owner" ON vault_upload_tokens
  FOR ALL USING (owner_id = auth.uid());

-- Usage: owner of token
CREATE POLICY "upload_token_usage_owner" ON vault_upload_token_usage
  FOR SELECT USING (
    token_id IN (SELECT id FROM vault_upload_tokens WHERE owner_id = auth.uid())
  );

-- Quick share inbox: vault owner
CREATE POLICY "quick_share_inbox_owner" ON vault_quick_share_inbox
  FOR ALL USING (
    vault_id IN (SELECT id FROM vault_spaces WHERE owner_id = auth.uid())
  );

-- ════════════════════════════════════════════════════════════════════════════
-- Functions
-- ════════════════════════════════════════════════════════════════════════════

-- Check rate limit for token
CREATE OR REPLACE FUNCTION check_token_rate_limit(p_token_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_token RECORD;
  v_hourly_count INTEGER;
  v_daily_count INTEGER;
BEGIN
  SELECT * INTO v_token FROM vault_upload_tokens WHERE id = p_token_id;
  
  IF NOT FOUND OR NOT v_token.is_active THEN
    RETURN FALSE;
  END IF;
  
  -- Check expiration
  IF v_token.expires_at IS NOT NULL AND v_token.expires_at < NOW() THEN
    RETURN FALSE;
  END IF;
  
  -- Check hourly rate limit
  SELECT COUNT(*) INTO v_hourly_count
  FROM vault_upload_token_usage
  WHERE token_id = p_token_id
    AND created_at > NOW() - INTERVAL '1 hour'
    AND success = true;
  
  IF v_hourly_count >= v_token.rate_limit_per_hour THEN
    RETURN FALSE;
  END IF;
  
  -- Check daily rate limit
  SELECT COUNT(*) INTO v_daily_count
  FROM vault_upload_token_usage
  WHERE token_id = p_token_id
    AND created_at > NOW() - INTERVAL '1 day'
    AND success = true;
  
  IF v_daily_count >= v_token.rate_limit_per_day THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update token usage stats
CREATE OR REPLACE FUNCTION update_token_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.success THEN
    UPDATE vault_upload_tokens
    SET 
      upload_count = upload_count + 1,
      last_used_at = NOW(),
      last_ip_address = NEW.ip_address,
      last_user_agent = NEW.user_agent,
      updated_at = NOW()
    WHERE id = NEW.token_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_token_usage
  AFTER INSERT ON vault_upload_token_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_token_usage_stats();
