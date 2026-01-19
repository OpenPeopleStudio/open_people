-- Drop notifications table for email signups
-- Users can subscribe to be notified when new drops happen

CREATE TABLE IF NOT EXISTS drop_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint per tenant
  CONSTRAINT unique_email_per_tenant UNIQUE (email, tenant_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_drop_notifications_tenant 
  ON drop_notifications(tenant_id) WHERE unsubscribed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_drop_notifications_email 
  ON drop_notifications(email);

-- RLS policies
ALTER TABLE drop_notifications ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (subscribe)
CREATE POLICY "Anyone can subscribe to drops"
  ON drop_notifications FOR INSERT
  WITH CHECK (true);

-- Only admins can view subscribers
CREATE POLICY "Admins can view drop subscribers"
  ON drop_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
      AND (p.tenant_id = drop_notifications.tenant_id OR p.role = 'super_admin')
    )
  );

-- Users can update their own subscription (unsubscribe)
CREATE POLICY "Users can unsubscribe"
  ON drop_notifications FOR UPDATE
  USING (email = current_setting('request.jwt.claims', true)::json->>'email')
  WITH CHECK (email = current_setting('request.jwt.claims', true)::json->>'email');

COMMENT ON TABLE drop_notifications IS 'Email subscribers for drop notifications';
