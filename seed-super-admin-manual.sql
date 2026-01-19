-- Manual Super Admin Setup for tom@openpeople.ai
-- Run this in Supabase SQL Editor

-- Step 1: First, create the user manually in Supabase Dashboard:
-- Go to Authentication > Users > Add User
-- Email: tom@openpeople.ai
-- Password: [choose a secure password]
-- Auto-confirm: ON
-- Full Name: Tom

-- Step 2: Run this SQL to set up super admin profile
DO $$
DECLARE
  user_id uuid;
  profile_exists boolean;
BEGIN
  -- Get the user ID
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = 'tom@openpeople.ai'
  LIMIT 1;

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User tom@openpeople.ai not found. Please create the user first in Supabase Dashboard.';
  END IF;

  -- Check if profile exists
  SELECT EXISTS(
    SELECT 1 FROM "709_profiles"
    WHERE id = user_id
  ) INTO profile_exists;

  IF profile_exists THEN
    -- Update existing profile
    UPDATE "709_profiles"
    SET
      role = 'owner',
      full_name = COALESCE(full_name, 'Tom'),
      updated_at = NOW()
    WHERE id = user_id;

    RAISE NOTICE 'Updated tom@openpeople.ai to super admin role';
  ELSE
    -- Create new profile
    INSERT INTO "709_profiles" (id, role, full_name)
    VALUES (user_id, 'owner', 'Tom');

    RAISE NOTICE 'Created super admin profile for tom@openpeople.ai';
  END IF;

  -- Verification
  RAISE NOTICE 'Super admin setup complete for tom@openpeople.ai';
  RAISE NOTICE 'User ID: %', user_id;
  RAISE NOTICE 'Access super admin at: app.openpeople.ai (or app.localhost in development)';

END $$;