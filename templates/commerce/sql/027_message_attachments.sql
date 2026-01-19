-- Encrypted message attachments

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS attachment_path TEXT,
  ADD COLUMN IF NOT EXISTS attachment_name TEXT,
  ADD COLUMN IF NOT EXISTS attachment_type TEXT,
  ADD COLUMN IF NOT EXISTS attachment_size INTEGER,
  ADD COLUMN IF NOT EXISTS attachment_key TEXT,
  ADD COLUMN IF NOT EXISTS attachment_key_iv TEXT,
  ADD COLUMN IF NOT EXISTS attachment_key_sender_public_key TEXT,
  ADD COLUMN IF NOT EXISTS attachment_key_message_index INTEGER;

CREATE INDEX IF NOT EXISTS idx_messages_attachment_path ON messages(attachment_path) WHERE attachment_path IS NOT NULL;

COMMENT ON COLUMN messages.attachment_path IS 'Storage path for encrypted attachment';
COMMENT ON COLUMN messages.attachment_key IS 'Encrypted file key payload (base64)';
