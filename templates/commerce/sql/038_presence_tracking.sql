-- Add presence tracking fields to 709_profiles
-- This enables real-time online/last seen indicators in the unified inbox

ALTER TABLE "709_profiles" 
  ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false;

-- Function to update user presence
-- Called by presence heartbeat API every 60 seconds
CREATE OR REPLACE FUNCTION update_user_presence(user_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE "709_profiles"
  SET last_active_at = NOW(), is_online = true
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark users offline if they haven't been active in 5 minutes
CREATE OR REPLACE FUNCTION mark_inactive_users_offline()
RETURNS void AS $$
BEGIN
  UPDATE "709_profiles"
  SET is_online = false
  WHERE is_online = true
    AND last_active_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Index for presence queries (used by inbox to show online users)
-- Only create if tenant_id column exists (multi-tenant setup)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = '709_profiles' AND column_name = 'tenant_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_presence 
      ON "709_profiles" (tenant_id, is_online, last_active_at DESC);
  ELSE
    CREATE INDEX IF NOT EXISTS idx_profiles_presence 
      ON "709_profiles" (is_online, last_active_at DESC);
  END IF;
END $$;

-- Index for faster last_active_at queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_active 
  ON "709_profiles" (last_active_at DESC) 
  WHERE last_active_at IS NOT NULL;

COMMENT ON COLUMN "709_profiles".last_active_at IS 'Last time the user sent a presence heartbeat (updated every 60s)';
COMMENT ON COLUMN "709_profiles".is_online IS 'True if user has been active within last 5 minutes';
COMMENT ON FUNCTION update_user_presence IS 'Update user presence timestamp and mark as online';
COMMENT ON FUNCTION mark_inactive_users_offline IS 'Mark users offline if no heartbeat in 5 minutes';
