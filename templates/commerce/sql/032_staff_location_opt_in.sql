-- =============================================================================
-- Staff location sharing opt-in
-- =============================================================================

ALTER TABLE "profiles"
  ADD COLUMN IF NOT EXISTS staff_location_opt_in BOOLEAN DEFAULT false;

COMMENT ON COLUMN "profiles".staff_location_opt_in IS 'Staff opt-in for location sharing';
