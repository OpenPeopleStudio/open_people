-- Data Privacy Enhancements: Export tracking and account deletion

-- Track data export requests
CREATE TABLE IF NOT EXISTS data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL DEFAULT 'complete_user_data',
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'failed')),
  file_size_bytes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_exports_user_id ON data_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_data_exports_created_at ON data_exports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_exports_tenant_id ON data_exports(tenant_id);

-- Track account deletion requests
CREATE TABLE IF NOT EXISTS account_deletions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled')),
  anonymization_details JSONB DEFAULT '{}'::jsonb,
  requested_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_account_deletions_user_id ON account_deletions(user_id);
CREATE INDEX IF NOT EXISTS idx_account_deletions_status ON account_deletions(status);
CREATE INDEX IF NOT EXISTS idx_account_deletions_scheduled ON account_deletions(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_account_deletions_tenant_id ON account_deletions(tenant_id);

-- Add anonymization flag to orders (for GDPR compliance)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS anonymized BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS anonymized_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_orders_anonymized ON orders(anonymized) WHERE anonymized = TRUE;

-- Function to anonymize order data
CREATE OR REPLACE FUNCTION anonymize_order_data(p_user_id UUID, p_tenant_id UUID)
RETURNS TABLE(orders_anonymized INTEGER) AS $$
DECLARE
  v_orders_count INTEGER;
BEGIN
  -- Anonymize shipping addresses in orders
  UPDATE orders
  SET 
    shipping_address = jsonb_build_object(
      'anonymized', true,
      'city', COALESCE(shipping_address->>'city', 'Unknown'),
      'province', COALESCE(shipping_address->>'province', 'Unknown'),
      'country', COALESCE(shipping_address->>'country', 'Unknown')
    ),
    anonymized = TRUE,
    anonymized_at = NOW()
  WHERE user_id = p_user_id
    AND tenant_id = p_tenant_id
    AND anonymized = FALSE;
  
  GET DIAGNOSTICS v_orders_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_orders_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete user personal data
CREATE OR REPLACE FUNCTION delete_user_personal_data(p_user_id UUID, p_tenant_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_messages_deleted INTEGER;
  v_wishlist_deleted INTEGER;
  v_locations_deleted INTEGER;
  v_preferences_deleted INTEGER;
  v_alerts_deleted INTEGER;
BEGIN
  -- Delete messages
  DELETE FROM messages WHERE customer_id = p_user_id AND tenant_id = p_tenant_id;
  GET DIAGNOSTICS v_messages_deleted = ROW_COUNT;
  
  -- Delete wishlist items
  DELETE FROM wishlist_items WHERE user_id = p_user_id AND tenant_id = p_tenant_id;
  GET DIAGNOSTICS v_wishlist_deleted = ROW_COUNT;
  
  -- Delete staff locations
  DELETE FROM staff_locations WHERE user_id = p_user_id AND tenant_id = p_tenant_id;
  GET DIAGNOSTICS v_locations_deleted = ROW_COUNT;
  
  -- Delete user preferences
  DELETE FROM user_preferences WHERE user_id = p_user_id AND tenant_id = p_tenant_id;
  GET DIAGNOSTICS v_preferences_deleted = ROW_COUNT;
  
  -- Delete stock and drop alerts
  DELETE FROM stock_alerts WHERE user_id = p_user_id AND tenant_id = p_tenant_id;
  DELETE FROM drop_alerts WHERE user_id = p_user_id AND tenant_id = p_tenant_id;
  GET DIAGNOSTICS v_alerts_deleted = ROW_COUNT;
  
  -- Delete recently viewed
  DELETE FROM recently_viewed WHERE user_id = p_user_id AND tenant_id = p_tenant_id;
  
  -- Clear profile PII (keep record for audit but remove identifiable info)
  UPDATE "709_profiles"
  SET 
    full_name = 'Deleted User',
    public_key = NULL,
    public_key_updated_at = NULL
  WHERE id = p_user_id AND tenant_id = p_tenant_id;
  
  v_result := jsonb_build_object(
    'messages_deleted', v_messages_deleted,
    'wishlist_deleted', v_wishlist_deleted,
    'locations_deleted', v_locations_deleted,
    'preferences_deleted', v_preferences_deleted,
    'alerts_deleted', v_alerts_deleted
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies for data exports table
ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own exports" ON data_exports;
CREATE POLICY "Users can view own exports"
ON data_exports FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all exports" ON data_exports;
CREATE POLICY "Admins can view all exports"
ON data_exports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

-- RLS policies for account deletions table
ALTER TABLE account_deletions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own deletion requests" ON account_deletions;
CREATE POLICY "Users can view own deletion requests"
ON account_deletions FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = requested_by);

DROP POLICY IF EXISTS "Admins can manage deletions" ON account_deletions;
CREATE POLICY "Admins can manage deletions"
ON account_deletions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

COMMENT ON TABLE data_exports IS 'Tracks user data export requests for GDPR compliance';
COMMENT ON TABLE account_deletions IS 'Tracks account deletion requests (right to be forgotten)';
COMMENT ON COLUMN orders.anonymized IS 'True if order data has been anonymized for privacy';
COMMENT ON FUNCTION anonymize_order_data IS 'Anonymizes order shipping addresses while preserving business records';
COMMENT ON FUNCTION delete_user_personal_data IS 'Deletes all user personal data except required business records';
