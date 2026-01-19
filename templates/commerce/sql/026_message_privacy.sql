-- Message privacy enhancements: retention and tombstones

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS deleted_by UUID,
  ADD COLUMN IF NOT EXISTS deleted_for_both BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE "709_profiles"
  ADD COLUMN IF NOT EXISTS message_retention_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS message_retention_days INTEGER;

CREATE INDEX IF NOT EXISTS idx_messages_deleted_at ON messages(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_expires_at ON messages(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON COLUMN messages.deleted_at IS 'Timestamp when message content was purged';
COMMENT ON COLUMN messages.deleted_by IS 'User who triggered deletion';
COMMENT ON COLUMN messages.deleted_for_both IS 'True if deleted for both participants';
COMMENT ON COLUMN messages.expires_at IS 'Timestamp when message should be purged based on retention';
COMMENT ON COLUMN "709_profiles".message_retention_enabled IS 'Enable message retention for this user';
COMMENT ON COLUMN "709_profiles".message_retention_days IS 'Retention window in days';
