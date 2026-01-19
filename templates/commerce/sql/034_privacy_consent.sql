-- Privacy consent management system with audit trail

-- Consent types and purposes
CREATE TABLE IF NOT EXISTS consent_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('essential', 'marketing', 'analytics', 'personalization')),
  is_required BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User consent records
CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  consent_type_code TEXT NOT NULL REFERENCES consent_types(code),
  consent_given BOOLEAN NOT NULL,
  consent_version INTEGER NOT NULL,
  consented_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  user_agent TEXT,
  source TEXT DEFAULT 'web'
);

-- Consent audit trail
CREATE TABLE IF NOT EXISTS consent_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  consent_type_code TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('granted', 'withdrawn', 'expired', 'updated')),
  previous_state BOOLEAN,
  new_state BOOLEAN,
  consent_version INTEGER,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_tenant_id ON user_consents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_type ON user_consents(consent_type_code);
CREATE INDEX IF NOT EXISTS idx_user_consents_active ON user_consents(user_id, consent_type_code, consent_given);
CREATE INDEX IF NOT EXISTS idx_consent_audit_user_id ON consent_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_audit_type ON consent_audit(consent_type_code);
CREATE INDEX IF NOT EXISTS idx_consent_audit_changed_at ON consent_audit(changed_at DESC);

-- Create unique constraint to prevent duplicate active consents
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_consents_unique_active 
  ON user_consents(user_id, tenant_id, consent_type_code, consent_version);

-- Seed default consent types
INSERT INTO consent_types (code, name, description, category, is_required, version) VALUES
  ('essential_service', 'Essential Service', 'Required for basic platform functionality (account, orders, checkout)', 'essential', TRUE, 1),
  ('marketing_email', 'Marketing Communications', 'Receive promotional emails about products and offers', 'marketing', FALSE, 1),
  ('analytics_tracking', 'Analytics & Performance', 'Allow collection of usage data to improve the platform', 'analytics', FALSE, 1),
  ('personalization', 'Personalized Experience', 'Store preferences and browsing history for recommendations', 'personalization', FALSE, 1),
  ('location_sharing', 'Location Sharing', 'Share location for delivery tracking and route optimization', 'personalization', FALSE, 1),
  ('message_storage', 'Message Storage', 'Store encrypted messages indefinitely (vs auto-delete)', 'personalization', FALSE, 1)
ON CONFLICT (code) DO NOTHING;

-- Function to record consent change
CREATE OR REPLACE FUNCTION record_consent_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log to audit trail
  INSERT INTO consent_audit (
    user_id,
    tenant_id,
    consent_type_code,
    action,
    previous_state,
    new_state,
    consent_version,
    changed_at,
    details
  ) VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    COALESCE(NEW.consent_type_code, OLD.consent_type_code),
    CASE
      WHEN TG_OP = 'INSERT' AND NEW.consent_given THEN 'granted'
      WHEN TG_OP = 'INSERT' AND NOT NEW.consent_given THEN 'withdrawn'
      WHEN TG_OP = 'UPDATE' AND NEW.consent_given AND NOT OLD.consent_given THEN 'granted'
      WHEN TG_OP = 'UPDATE' AND NOT NEW.consent_given AND OLD.consent_given THEN 'withdrawn'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
      ELSE 'expired'
    END,
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.consent_given ELSE NULL END,
    NEW.consent_given,
    NEW.consent_version,
    NOW(),
    CASE
      WHEN TG_OP = 'INSERT' THEN jsonb_build_object('new_consent', true)
      WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('previous_version', OLD.consent_version)
      ELSE '{}'::jsonb
    END
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_consent_change ON user_consents;
CREATE TRIGGER trigger_consent_change
  AFTER INSERT OR UPDATE ON user_consents
  FOR EACH ROW
  EXECUTE FUNCTION record_consent_change();

-- Function to get user's current consents
CREATE OR REPLACE FUNCTION get_user_consents(p_user_id UUID, p_tenant_id UUID)
RETURNS TABLE (
  consent_code TEXT,
  consent_name TEXT,
  consent_description TEXT,
  category TEXT,
  is_required BOOLEAN,
  consent_given BOOLEAN,
  consented_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ct.code,
    ct.name,
    ct.description,
    ct.category,
    ct.is_required,
    COALESCE(uc.consent_given, FALSE) as consent_given,
    uc.consented_at
  FROM consent_types ct
  LEFT JOIN user_consents uc 
    ON ct.code = uc.consent_type_code 
    AND uc.user_id = p_user_id
    AND uc.tenant_id = p_tenant_id
  WHERE ct.active = TRUE
  ORDER BY 
    CASE ct.category
      WHEN 'essential' THEN 1
      WHEN 'analytics' THEN 2
      WHEN 'personalization' THEN 3
      WHEN 'marketing' THEN 4
      ELSE 5
    END,
    ct.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has given consent
CREATE OR REPLACE FUNCTION has_consent(
  p_user_id UUID,
  p_tenant_id UUID,
  p_consent_code TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_consent_given BOOLEAN;
BEGIN
  SELECT consent_given INTO v_consent_given
  FROM user_consents
  WHERE user_id = p_user_id
    AND tenant_id = p_tenant_id
    AND consent_type_code = p_consent_code
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY consented_at DESC
  LIMIT 1;
  
  RETURN COALESCE(v_consent_given, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE consent_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_audit ENABLE ROW LEVEL SECURITY;

-- Anyone can read consent types
DROP POLICY IF EXISTS "Anyone can read consent types" ON consent_types;
CREATE POLICY "Anyone can read consent types"
ON consent_types FOR SELECT
USING (active = TRUE);

-- Users can view their own consents
DROP POLICY IF EXISTS "Users can view own consents" ON user_consents;
CREATE POLICY "Users can view own consents"
ON user_consents FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own consents
DROP POLICY IF EXISTS "Users can insert own consents" ON user_consents;
CREATE POLICY "Users can insert own consents"
ON user_consents FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own consents
DROP POLICY IF EXISTS "Users can update own consents" ON user_consents;
CREATE POLICY "Users can update own consents"
ON user_consents FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can view their own consent audit
DROP POLICY IF EXISTS "Users can view own consent audit" ON consent_audit;
CREATE POLICY "Users can view own consent audit"
ON consent_audit FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all consents
DROP POLICY IF EXISTS "Admins can view all consents" ON user_consents;
CREATE POLICY "Admins can view all consents"
ON user_consents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

-- Admins can view all consent audits
DROP POLICY IF EXISTS "Admins can view all consent audits" ON consent_audit;
CREATE POLICY "Admins can view all consent audits"
ON consent_audit FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

COMMENT ON TABLE consent_types IS 'Defines available consent types and purposes';
COMMENT ON TABLE user_consents IS 'Stores user consent preferences with version tracking';
COMMENT ON TABLE consent_audit IS 'Audit trail of all consent changes for compliance';
COMMENT ON FUNCTION get_user_consents IS 'Returns current consent status for a user';
COMMENT ON FUNCTION has_consent IS 'Checks if user has given specific consent';
