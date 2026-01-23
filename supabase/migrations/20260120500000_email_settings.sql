-- Email Settings Table
-- Stores per-tenant email configuration for defaults, notifications, sync, and security

CREATE TABLE IF NOT EXISTS email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Default settings (JSONB)
  defaults JSONB DEFAULT '{
    "default_account_id": null,
    "default_signature_id": null,
    "reply_to_same_account": true,
    "include_signature_in_replies": true,
    "auto_save_drafts": true,
    "draft_save_interval_seconds": 30
  }'::jsonb,
  
  -- Notification settings (JSONB)
  notifications JSONB DEFAULT '{
    "email_notifications": true,
    "push_notifications": false,
    "notify_on_new_email": true,
    "notify_on_reply": true,
    "notify_on_mention": true,
    "digest_frequency": "none"
  }'::jsonb,
  
  -- Sync settings (JSONB)
  sync JSONB DEFAULT '{
    "auto_sync_enabled": true,
    "sync_interval_minutes": 5,
    "sync_on_open": true,
    "max_emails_per_sync": 100,
    "sync_sent_folder": true,
    "sync_deleted_folder": false
  }'::jsonb,
  
  -- Security settings (JSONB)
  security JSONB DEFAULT '{
    "block_external_images": false,
    "block_tracking_pixels": true,
    "warn_external_links": true,
    "require_tls": true
  }'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One settings row per tenant
  UNIQUE(tenant_id)
);

-- Index for fast tenant lookup
CREATE INDEX IF NOT EXISTS idx_email_settings_tenant ON email_settings(tenant_id);

-- RLS policies
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

-- Users can read their tenant's settings
CREATE POLICY "Users can read own tenant email settings"
  ON email_settings FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM "profiles" WHERE id = auth.uid()
    )
  );

-- Users can insert settings for their tenant
CREATE POLICY "Users can insert own tenant email settings"
  ON email_settings FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM "profiles" WHERE id = auth.uid()
    )
  );

-- Users can update their tenant's settings
CREATE POLICY "Users can update own tenant email settings"
  ON email_settings FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM "profiles" WHERE id = auth.uid()
    )
  );

-- Super admins can do everything
CREATE POLICY "Super admins can manage all email settings"
  ON email_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "profiles" 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_email_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_settings_updated_at
  BEFORE UPDATE ON email_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_email_settings_updated_at();
