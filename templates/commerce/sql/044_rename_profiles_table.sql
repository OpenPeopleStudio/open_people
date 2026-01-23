-- ============================================================================
-- Migration: Rename profiles to profiles for white-label compatibility
-- ============================================================================
-- This migration renames the tenant-specific profile tables to generic names
-- for better white-label support across different commerce tenants.
--
-- IMPORTANT: This is a breaking change. All application code must be updated
-- to use the new table names before running this migration.
-- ============================================================================

-- Step 1: Rename the main profiles table
ALTER TABLE IF EXISTS "profiles" RENAME TO profiles;

-- Step 2: Rename verified contacts table
ALTER TABLE IF EXISTS "709_verified_contacts" RENAME TO verified_contacts;

-- Step 3: Update any foreign key constraints that reference the old table names
-- (PostgreSQL automatically updates FK constraint names when tables are renamed,
-- but we should verify any explicit references in functions/triggers)

-- Step 4: Update any RLS policies that reference the old table names
-- Note: Policy names may need manual updates if they contain "709"

-- Update RLS policies for profiles table
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Get all policies on the profiles table and recreate them if needed
    -- This is a placeholder - actual policy updates depend on your specific policies
    NULL;
END $$;

-- Step 5: Update any functions that reference the old table names
-- Note: You'll need to recreate any functions that have hardcoded table references

-- Step 6: Add comments for documentation
COMMENT ON TABLE profiles IS 'User profiles for each tenant. Renamed from profiles for white-label compatibility.';
COMMENT ON TABLE verified_contacts IS 'Verified contact information. Renamed from 709_verified_contacts for white-label compatibility.';

-- ============================================================================
-- ROLLBACK SCRIPT (run if you need to revert):
-- ============================================================================
-- ALTER TABLE profiles RENAME TO "profiles";
-- ALTER TABLE verified_contacts RENAME TO "709_verified_contacts";
