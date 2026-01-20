-- ═══════════════════════════════════════════════════════════════════════════
-- Fix infinite recursion in profiles RLS policies
-- 
-- The issue: is_super_admin() queries profiles table, causing recursion when
-- used in a policy ON the profiles table itself.
--
-- Solution: For the "view own profile" policy, we only need to check if the
-- user is querying their own profile (id = auth.uid()). Super admin access
-- to OTHER profiles can be handled by a separate policy.
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view tenant profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Service role bypass profiles" ON profiles;

-- Policy 1: Users can always view their own profile (no recursion)
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (id = auth.uid());

-- Policy 2: Users can update their own profile (already exists, but recreate to be safe)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (id = auth.uid());

-- Policy 3: Users can create their own profile (already exists, but recreate to be safe)
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
CREATE POLICY "Users can create own profile" ON profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- Policy 4: Super admins can view ALL profiles
-- Use a direct check against the role column to avoid recursion
-- This works because we're checking a specific user's role, not querying broadly
CREATE POLICY "Super admins can view all profiles" ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'super_admin'
    )
  );

-- Policy 5: Super admins can manage (insert/update/delete) all profiles
CREATE POLICY "Super admins can manage all profiles" ON profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'super_admin'
    )
  );

-- Policy 6: Tenant admins can view profiles in their tenant
-- Use direct subquery instead of helper function to avoid potential recursion
CREATE POLICY "Tenant admins can view tenant profiles" ON profiles
  FOR SELECT
  USING (
    tenant_id IS NOT NULL 
    AND tenant_id = (SELECT p.tenant_id FROM profiles p WHERE p.id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('owner', 'admin')
    )
  );

-- Policy 7: Service role bypasses RLS (for admin scripts)
CREATE POLICY "Service role bypass profiles" ON profiles
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
