-- Seed tom@openpeople.ai as super admin for Open People platform
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  user_id uuid;
  user_exists boolean;
BEGIN
  -- Check if user already exists
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = 'tom@openpeople.ai'
  LIMIT 1;

  -- If user doesn't exist, create them
  IF user_id IS NULL THEN
    -- Note: In production, you'd create the user through Supabase Auth Admin API
    -- This is just for documentation - the user should be created via the signup flow or admin API
    RAISE NOTICE 'User tom@openpeople.ai does not exist. Please create this user first through:';
    RAISE NOTICE '1. Supabase Dashboard > Authentication > Users > Add User';
    RAISE NOTICE '2. Or use the signup API';
    RAISE NOTICE '3. Or use Supabase Auth Admin API';
    RETURN;
  END IF;

  -- Check if profile already exists
  SELECT EXISTS(
    SELECT 1 FROM "709_profiles"
    WHERE id = user_id
  ) INTO user_exists;

  IF user_exists THEN
    -- Update existing profile to ensure super admin status
    UPDATE "709_profiles"
    SET
      role = 'owner',
      full_name = COALESCE(full_name, 'Tom'),
      updated_at = NOW()
    WHERE id = user_id;

    RAISE NOTICE 'Updated existing profile for tom@openpeople.ai (ID: %) to super admin', user_id;
  ELSE
    -- Create new profile
    INSERT INTO "709_profiles" (id, role, full_name)
    VALUES (user_id, 'owner', 'Tom');

    RAISE NOTICE 'Created new super admin profile for tom@openpeople.ai (ID: %)', user_id;
  END IF;

  -- Verify the setup
  SELECT
    u.email,
    p.role,
    p.full_name,
    p.created_at
  FROM auth.users u
  JOIN "709_profiles" p ON p.id = u.id
  WHERE u.email = 'tom@openpeople.ai';

END $$;