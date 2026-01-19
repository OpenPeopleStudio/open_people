-- End-to-End Encrypted Messaging Support with Perfect Forward Secrecy

-- Add public key storage to profiles
ALTER TABLE "709_profiles" 
  ADD COLUMN IF NOT EXISTS public_key TEXT,
  ADD COLUMN IF NOT EXISTS public_key_updated_at TIMESTAMP WITH TIME ZONE;

-- Update messages table for encrypted content with forward secrecy support
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS encrypted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS iv TEXT,
  ADD COLUMN IF NOT EXISTS sender_public_key TEXT,
  ADD COLUMN IF NOT EXISTS message_index INTEGER DEFAULT 0;

-- Index for finding users by public key presence
CREATE INDEX IF NOT EXISTS idx_profiles_public_key ON "709_profiles"(id) WHERE public_key IS NOT NULL;

-- Index for efficient message decryption (finding messages by sender for session lookup)
CREATE INDEX IF NOT EXISTS idx_messages_encrypted ON messages(customer_id, sender_type) WHERE encrypted = true;

-- Allow users to update their own public key
DROP POLICY IF EXISTS "Users can update own public key" ON "709_profiles";
CREATE POLICY "Users can update own public key" ON "709_profiles"
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow reading public keys (needed for encryption)
DROP POLICY IF EXISTS "Anyone can read public keys" ON "709_profiles";
CREATE POLICY "Anyone can read public keys" ON "709_profiles"
  FOR SELECT USING (true);

-- Comments explaining the encryption scheme
COMMENT ON COLUMN messages.encrypted IS 'True if content is E2EE encrypted using AES-256-GCM';
COMMENT ON COLUMN messages.iv IS 'AES-GCM 96-bit initialization vector (base64 encoded)';
COMMENT ON COLUMN messages.sender_public_key IS 'Sender ECDH P-256 public key at encryption time (SPKI format, base64)';
COMMENT ON COLUMN messages.message_index IS 'Message index for HKDF key derivation (perfect forward secrecy)';
COMMENT ON COLUMN "709_profiles".public_key IS 'User ECDH P-256 identity public key for E2EE (SPKI format, base64)';
