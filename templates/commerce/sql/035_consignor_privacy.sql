-- Consignor privacy enhancements

-- Add encrypted payment info fields to consignors
ALTER TABLE consignors 
  ADD COLUMN IF NOT EXISTS payment_method_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS payment_notes_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS stripe_connect_id TEXT,
  ADD COLUMN IF NOT EXISTS privacy_preferences JSONB DEFAULT '{}'::jsonb;

-- Track consignor portal access
CREATE TABLE IF NOT EXISTS consignor_portal_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consignor_id UUID NOT NULL REFERENCES consignors(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  access_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_consignor_portal_access_token ON consignor_portal_access(access_token);
CREATE INDEX IF NOT EXISTS idx_consignor_portal_access_consignor ON consignor_portal_access(consignor_id);
CREATE INDEX IF NOT EXISTS idx_consignor_portal_access_expires ON consignor_portal_access(expires_at);

-- Function to generate consignor portal access token
CREATE OR REPLACE FUNCTION generate_consignor_access_token(
  p_consignor_id UUID,
  p_email TEXT,
  p_validity_hours INTEGER DEFAULT 24
)
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Generate random token
  v_token := encode(gen_random_bytes(32), 'base64');
  v_expires_at := NOW() + (p_validity_hours || ' hours')::INTERVAL;
  
  -- Store token
  INSERT INTO consignor_portal_access (
    consignor_id,
    email,
    access_token,
    expires_at
  ) VALUES (
    p_consignor_id,
    p_email,
    v_token,
    v_expires_at
  );
  
  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate consignor access token
CREATE OR REPLACE FUNCTION validate_consignor_token(p_token TEXT)
RETURNS TABLE (
  consignor_id UUID,
  email TEXT,
  is_valid BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cpa.consignor_id,
    cpa.email,
    (cpa.expires_at > NOW()) as is_valid
  FROM consignor_portal_access cpa
  WHERE cpa.access_token = p_token;
  
  -- Update last accessed time
  UPDATE consignor_portal_access
  SET last_accessed_at = NOW()
  WHERE access_token = p_token
    AND expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for consignor dashboard (privacy-aware)
CREATE OR REPLACE VIEW consignor_dashboard AS
SELECT
  c.id as consignor_id,
  c.name,
  c.email,
  c.commission_rate,
  c.balance_cents,
  c.total_sales_cents,
  c.total_paid_cents,
  COUNT(DISTINCT ci.id) FILTER (WHERE ci.status = 'active') as active_items,
  COUNT(DISTINCT ci.id) FILTER (WHERE ci.status = 'sold') as sold_items,
  COUNT(DISTINCT ci.id) FILTER (WHERE ci.status = 'paid') as paid_items,
  MAX(ci.sold_at) as last_sale_date
FROM consignors c
LEFT JOIN consignment_items ci ON c.id = ci.consignor_id
GROUP BY c.id;

-- RLS policies for consignor portal access
ALTER TABLE consignor_portal_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Consignors can view own access" ON consignor_portal_access;
CREATE POLICY "Consignors can view own access"
ON consignor_portal_access FOR SELECT
USING (email = current_setting('app.consignor_email', true));

DROP POLICY IF EXISTS "Admins can manage consignor access" ON consignor_portal_access;
CREATE POLICY "Admins can manage consignor access"
ON consignor_portal_access FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

-- Enhanced consignment items view for consignors (redacts sensitive info)
CREATE OR REPLACE VIEW consignor_items_view AS
SELECT
  ci.id,
  ci.consignor_id,
  ci.status,
  ci.list_price_cents,
  ci.sold_price_cents,
  ci.commission_cents,
  ci.payout_cents,
  ci.created_at,
  ci.sold_at,
  pv.sku,
  pv.size,
  pv.condition,
  p.brand,
  p.name as product_name
FROM consignment_items ci
LEFT JOIN product_variants pv ON ci.variant_id = pv.id
LEFT JOIN products p ON pv.product_id = p.id;

COMMENT ON TABLE consignor_portal_access IS 'Manages secure access tokens for consignor portal';
COMMENT ON FUNCTION generate_consignor_access_token IS 'Generates time-limited access token for consignor portal';
COMMENT ON FUNCTION validate_consignor_token IS 'Validates consignor access token and returns consignor info';
COMMENT ON VIEW consignor_dashboard IS 'Privacy-aware dashboard view for consignors';
COMMENT ON VIEW consignor_items_view IS 'Filtered view of consignment items without sensitive data';
