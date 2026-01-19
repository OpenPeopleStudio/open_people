-- Staff location tracking

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS staff_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy_m DOUBLE PRECISION,
  task_id TEXT,
  source TEXT DEFAULT 'web',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '48 hours'),
  location GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
  ) STORED
);

ALTER TABLE staff_locations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_staff_locations_user_id ON staff_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_locations_recorded_at ON staff_locations(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_locations_expires_at ON staff_locations(expires_at);
CREATE INDEX IF NOT EXISTS idx_staff_locations_location ON staff_locations USING GIST (location);

DROP POLICY IF EXISTS "Staff insert own locations" ON staff_locations;
CREATE POLICY "Staff insert own locations"
ON staff_locations FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin', 'owner')
  )
);

DROP POLICY IF EXISTS "Staff read own locations" ON staff_locations;
CREATE POLICY "Staff read own locations"
ON staff_locations FOR SELECT
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('staff', 'admin', 'owner')
  )
);

DROP POLICY IF EXISTS "Admins read staff locations" ON staff_locations;
CREATE POLICY "Admins read staff locations"
ON staff_locations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);
