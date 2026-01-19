-- =============================================================================
-- Encrypted Staff Location Tracking
-- =============================================================================
-- Add E2E encryption support for staff location data
-- Plaintext lat/lng kept for GIS operations (distance, geofencing)
-- Encrypted coordinates for privacy and security

-- Add encrypted location column
ALTER TABLE staff_locations
  ADD COLUMN IF NOT EXISTS encrypted_location JSONB,
  ADD COLUMN IF NOT EXISTS encryption_key_id TEXT;

-- Add indexes for encrypted location queries
CREATE INDEX IF NOT EXISTS idx_staff_locations_encryption_key 
  ON staff_locations(encryption_key_id) 
  WHERE encryption_key_id IS NOT NULL;

-- Comments
COMMENT ON COLUMN staff_locations.encrypted_location IS 
  'E2E encrypted location data: {ciphertext, iv, senderPublicKey, messageIndex}';
COMMENT ON COLUMN staff_locations.encryption_key_id IS 
  'ID of the public key used to encrypt this location';

-- Note: Plaintext latitude/longitude columns are preserved for:
-- 1. Backward compatibility with existing data
-- 2. GIS operations (ST_Distance, geofencing, spatial queries)
-- 3. Fallback when decryption is unavailable
-- 4. Route optimization algorithms that need bulk distance calculations
