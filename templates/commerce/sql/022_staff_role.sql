-- Add 'staff' to user_role enum
-- Note: New signups are already 'customer' by default (see 001_init.sql)

DO $$
BEGIN
  -- Add 'staff' value to the enum if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'staff' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'staff' AFTER 'customer';
  END IF;
END $$;

-- Update the activity logs policy to include staff (now that the enum value exists)
DROP POLICY IF EXISTS "Admins can insert activity logs" ON activity_logs;
CREATE POLICY "Admins can insert activity logs"
ON activity_logs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner', 'staff')
  )
);

-- Staff can view activity logs (read only)
DROP POLICY IF EXISTS "Staff can view activity logs" ON activity_logs;
CREATE POLICY "Staff can view activity logs"
ON activity_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "709_profiles"
    WHERE id = auth.uid()
    AND role IN ('admin', 'owner', 'staff')
  )
);
