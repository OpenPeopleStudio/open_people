-- Site-wide maintenance mode flag (kill switch)

CREATE TABLE IF NOT EXISTS site_flags (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_flags_updated_at ON site_flags(updated_at DESC);

ALTER TABLE site_flags ENABLE ROW LEVEL SECURITY;

-- Only admins/owners can read/update flags via user session
DROP POLICY IF EXISTS "Admins can read site flags" ON site_flags;
CREATE POLICY "Admins can read site flags"
ON site_flags FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

-- Allow public read of the maintenance flag only (used by middleware)
DROP POLICY IF EXISTS "Public can read maintenance flag" ON site_flags;
CREATE POLICY "Public can read maintenance flag"
ON site_flags FOR SELECT
USING (key = 'maintenance_mode');

DROP POLICY IF EXISTS "Admins can manage site flags" ON site_flags;
CREATE POLICY "Admins can manage site flags"
ON site_flags FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner')
  )
);

-- Seed default maintenance flag (off)
INSERT INTO site_flags (key, value)
VALUES ('maintenance_mode', jsonb_build_object('enabled', false, 'message', null))
ON CONFLICT (key) DO NOTHING;
