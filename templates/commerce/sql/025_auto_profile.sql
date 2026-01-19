-- Auto-create profile when user signs up
-- This trigger ensures every new auth.users row gets a corresponding 709_profiles entry

-- First, add 'staff' to the role enum if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'staff' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'staff';
  END IF;
END $$;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."709_profiles" (id, role, full_name, created_at)
  VALUES (
    NEW.id,
    'customer',
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: Create profiles for any existing users that don't have one
INSERT INTO "709_profiles" (id, role, full_name, created_at)
SELECT 
  u.id,
  'customer',
  u.raw_user_meta_data->>'full_name',
  u.created_at
FROM auth.users u
LEFT JOIN "709_profiles" p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a 709_profiles entry when a new user signs up';
