-- ═══════════════════════════════════════════════════════════════════════════
-- Add service role bypass to vault tables
-- 
-- This allows server-side API operations to work properly.
-- ═══════════════════════════════════════════════════════════════════════════

-- vault_spaces
DROP POLICY IF EXISTS "vault_spaces_service" ON vault_spaces;
CREATE POLICY "vault_spaces_service" ON vault_spaces
  FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');

-- vault_encryption_keys  
DROP POLICY IF EXISTS "vault_encryption_keys_service" ON vault_encryption_keys;
CREATE POLICY "vault_encryption_keys_service" ON vault_encryption_keys
  FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');

-- vault_folders
DROP POLICY IF EXISTS "vault_folders_service" ON vault_folders;
CREATE POLICY "vault_folders_service" ON vault_folders
  FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');

-- vault_files
DROP POLICY IF EXISTS "vault_files_service" ON vault_files;
CREATE POLICY "vault_files_service" ON vault_files
  FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');

-- vault_automation_rules
DROP POLICY IF EXISTS "vault_automation_rules_service" ON vault_automation_rules;
CREATE POLICY "vault_automation_rules_service" ON vault_automation_rules
  FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');

-- vault_inbox
DROP POLICY IF EXISTS "vault_inbox_service" ON vault_inbox;
CREATE POLICY "vault_inbox_service" ON vault_inbox
  FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');

-- vault_suggestions
DROP POLICY IF EXISTS "vault_suggestions_service" ON vault_suggestions;
CREATE POLICY "vault_suggestions_service" ON vault_suggestions
  FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');

-- vault_audit_log
DROP POLICY IF EXISTS "vault_audit_log_service" ON vault_audit_log;
CREATE POLICY "vault_audit_log_service" ON vault_audit_log
  FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');

-- vault_sessions
DROP POLICY IF EXISTS "vault_sessions_service" ON vault_sessions;
CREATE POLICY "vault_sessions_service" ON vault_sessions
  FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');

-- vault_recovery_codes
DROP POLICY IF EXISTS "vault_recovery_codes_service" ON vault_recovery_codes;
CREATE POLICY "vault_recovery_codes_service" ON vault_recovery_codes
  FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');

-- vault_backups
DROP POLICY IF EXISTS "vault_backups_service" ON vault_backups;
CREATE POLICY "vault_backups_service" ON vault_backups
  FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');
