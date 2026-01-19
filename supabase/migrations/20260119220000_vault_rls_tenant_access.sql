-- ═══════════════════════════════════════════════════════════════════════════
-- Allow tenant users (owner/admin) to create and manage personal vaults
-- This migration relaxes the super_admin restriction on vault creation
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop and recreate the vault_spaces insert policy to allow any authenticated user
-- with owner_id = auth.uid() to create their vault
DROP POLICY IF EXISTS "Users can create own vault" ON vault_spaces;

CREATE POLICY "Users can create own vault" ON vault_spaces
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Similarly for encryption keys (already owner-scoped, but let's ensure)
DROP POLICY IF EXISTS "Users can manage own encryption keys" ON vault_encryption_keys;

CREATE POLICY "Users can manage own encryption keys" ON vault_encryption_keys
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM vault_spaces 
      WHERE vault_spaces.id = vault_encryption_keys.vault_id 
      AND vault_spaces.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vault_spaces 
      WHERE vault_spaces.id = vault_encryption_keys.vault_id 
      AND vault_spaces.owner_id = auth.uid()
    )
  );

-- Ensure vault_sessions policies allow tenant users
DROP POLICY IF EXISTS "Users can manage own sessions" ON vault_sessions;

CREATE POLICY "Users can manage own sessions" ON vault_sessions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM vault_spaces 
      WHERE vault_spaces.id = vault_sessions.vault_id 
      AND vault_spaces.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vault_spaces 
      WHERE vault_spaces.id = vault_sessions.vault_id 
      AND vault_spaces.owner_id = auth.uid()
    )
  );

-- Ensure vault_folders policies allow tenant users
DROP POLICY IF EXISTS "Users can manage own folders" ON vault_folders;

CREATE POLICY "Users can manage own folders" ON vault_folders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM vault_spaces 
      WHERE vault_spaces.id = vault_folders.vault_id 
      AND vault_spaces.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vault_spaces 
      WHERE vault_spaces.id = vault_folders.vault_id 
      AND vault_spaces.owner_id = auth.uid()
    )
  );

-- Ensure vault_files policies allow tenant users
DROP POLICY IF EXISTS "Users can manage own files" ON vault_files;

CREATE POLICY "Users can manage own files" ON vault_files
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM vault_spaces 
      WHERE vault_spaces.id = vault_files.vault_id 
      AND vault_spaces.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vault_spaces 
      WHERE vault_spaces.id = vault_files.vault_id 
      AND vault_spaces.owner_id = auth.uid()
    )
  );

-- Ensure vault_recovery_codes policies allow tenant users
DROP POLICY IF EXISTS "Users can view own recovery codes" ON vault_recovery_codes;

CREATE POLICY "Users can view own recovery codes" ON vault_recovery_codes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM vault_spaces 
      WHERE vault_spaces.id = vault_recovery_codes.vault_id 
      AND vault_spaces.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vault_spaces 
      WHERE vault_spaces.id = vault_recovery_codes.vault_id 
      AND vault_spaces.owner_id = auth.uid()
    )
  );

-- Ensure vault_audit_log policies allow tenant users to view their logs
DROP POLICY IF EXISTS "Users can view own audit logs" ON vault_audit_log;

CREATE POLICY "Users can view own audit logs" ON vault_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vault_spaces 
      WHERE vault_spaces.id = vault_audit_log.vault_id 
      AND vault_spaces.owner_id = auth.uid()
    )
  );

-- Ensure vault_audit_log insert policy allows inserts for audit trail
DROP POLICY IF EXISTS "Users can insert audit logs" ON vault_audit_log;

CREATE POLICY "Users can insert audit logs" ON vault_audit_log
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vault_spaces 
      WHERE vault_spaces.id = vault_audit_log.vault_id 
      AND vault_spaces.owner_id = auth.uid()
    )
  );
