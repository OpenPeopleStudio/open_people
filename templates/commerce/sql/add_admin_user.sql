-- =============================================================================
-- Add Admin User for 709exclusive
-- =============================================================================
-- 
-- This script creates an admin user for the 709exclusive platform.
-- 
-- IMPORTANT: This must be run in the Supabase SQL Editor with the following steps:
--
-- For Supabase, you should use the Auth UI or the management API to create users.
-- This SQL creates the profile entry after the user is created via Supabase Auth.
--
-- =============================================================================

-- Step 1: Create the user via Supabase Auth Dashboard
-- Go to: Authentication > Users > Add User
-- Email: support@709exclusive.shop
-- Password: password (change this in production!)
-- Check "Auto confirm user" option

-- Step 2: After creating the user, get the user ID from the Users table
-- Then run the following to set them as admin:

-- Option A: If you know the user ID (replace 'USER_ID_HERE' with actual UUID):
/*
UPDATE "709_profiles"
SET role = 'owner'
WHERE id = 'USER_ID_HERE';
*/

-- Option B: Set role by email (run this after creating user via Auth Dashboard):
DO $$
DECLARE
  user_id uuid;
BEGIN
  -- Get user ID from auth.users by email
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = 'support@709exclusive.shop'
  LIMIT 1;
  
  IF user_id IS NULL THEN
    RAISE NOTICE 'User not found. Please create the user first via Supabase Auth Dashboard.';
    RAISE NOTICE 'Go to Authentication > Users > Add User';
    RAISE NOTICE 'Email: support@709exclusive.shop';
    RAISE NOTICE 'Password: password';
    RAISE NOTICE 'Check "Auto confirm user"';
  ELSE
    -- Check if profile exists
    IF EXISTS (SELECT 1 FROM "709_profiles" WHERE id = user_id) THEN
      -- Update existing profile to owner role
      UPDATE "709_profiles"
      SET role = 'staff'
      WHERE id = user_id;
      RAISE NOTICE 'Updated existing profile to owner role for user: %', user_id;
    ELSE
      -- Insert new profile with owner role
      INSERT INTO "709_profiles" (id, role, full_name)
      VALUES (user_id, 'staff', 'Site Administrator');
      RAISE NOTICE 'Created owner profile for user: %', user_id;
    END IF;
  END IF;
END $$;

-- =============================================================================
-- Verification: Check admin users
-- =============================================================================
SELECT 
  u.id,
  u.email,
  p.role,
  p.full_name,
  u.created_at
FROM auth.users u
LEFT JOIN "709_profiles" p ON p.id = u.id
WHERE p.role IN ('staff')
ORDER BY u.created_at DESC;
