-- Allow NULL tenant_id for platform-level email messages and accounts
-- This enables super admins to send/receive emails without a specific tenant

-- First, drop the foreign key constraint on email_messages
ALTER TABLE email_messages 
  DROP CONSTRAINT IF EXISTS email_messages_tenant_id_fkey;

-- Alter the column to allow NULL
ALTER TABLE email_messages 
  ALTER COLUMN tenant_id DROP NOT NULL;

-- Re-add the foreign key constraint (allowing NULL)
ALTER TABLE email_messages
  ADD CONSTRAINT email_messages_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Similarly for email_accounts (if not already done)
ALTER TABLE email_accounts 
  DROP CONSTRAINT IF EXISTS email_accounts_tenant_id_fkey;

ALTER TABLE email_accounts 
  ALTER COLUMN tenant_id DROP NOT NULL;

ALTER TABLE email_accounts
  ADD CONSTRAINT email_accounts_tenant_id_fkey 
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Update the unique constraint on email_accounts to handle NULL tenant_id
ALTER TABLE email_accounts
  DROP CONSTRAINT IF EXISTS email_accounts_tenant_id_email_address_key;

-- Create a unique index that handles NULL tenant_id properly
-- De-duplicate any existing NULL-tenant rows before indexing
WITH duplicate_null_tenant_accounts AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY email_address
      ORDER BY id ASC
    ) AS row_number
  FROM email_accounts
  WHERE tenant_id IS NULL
)
DELETE FROM email_accounts
WHERE id IN (
  SELECT id
  FROM duplicate_null_tenant_accounts
  WHERE row_number > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS email_accounts_tenant_email_unique 
  ON email_accounts (COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), email_address);

-- Add RLS policies for platform-level messages (super admin access)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super admins can manage platform email messages" ON email_messages;
DROP POLICY IF EXISTS "Super admins can manage platform email accounts" ON email_accounts;

-- Super admins can access platform-level (null tenant) messages
CREATE POLICY "Super admins can manage platform email messages"
  ON email_messages FOR ALL
  USING (
    tenant_id IS NULL AND EXISTS (
      SELECT 1 FROM "709_profiles" 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Super admins can access platform-level (null tenant) accounts  
CREATE POLICY "Super admins can manage platform email accounts"
  ON email_accounts FOR ALL
  USING (
    tenant_id IS NULL AND EXISTS (
      SELECT 1 FROM "709_profiles" 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Create index for faster lookups on null tenant messages
CREATE INDEX IF NOT EXISTS idx_email_messages_null_tenant 
  ON email_messages (account_id, created_at DESC) 
  WHERE tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_email_accounts_null_tenant 
  ON email_accounts (id) 
  WHERE tenant_id IS NULL;
