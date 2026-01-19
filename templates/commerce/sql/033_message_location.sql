-- Message location sharing support

-- Add message type and location payload columns
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'location')),
  ADD COLUMN IF NOT EXISTS location JSONB;

-- Index for location messages
CREATE INDEX IF NOT EXISTS idx_messages_location ON messages(customer_id, message_type) WHERE message_type = 'location';

COMMENT ON COLUMN messages.message_type IS 'Type of message: text (default) or location';
COMMENT ON COLUMN messages.location IS 'Encrypted location data: {lat, lng, accuracy, recordedAt} (only for message_type=location)';
