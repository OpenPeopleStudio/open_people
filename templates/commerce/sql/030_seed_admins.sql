-- =============================================================================
-- Seed owner access for core 709 tenant
-- =============================================================================
--
-- This script assigns owner access for the 709exclusive tenant.
-- It expects the users to already exist in auth.users.
--
-- Users:
-- - admin@709exclusive.shop -> owner for 709exclusive tenant
-- - tom@openpeople.ai       -> owner (super admin) for 709exclusive tenant
--
-- Run in Supabase SQL Editor after creating users via Auth UI/API.
-- =============================================================================

DO $$
DECLARE
  target_tenant_id uuid;
  user_id uuid;
  target_email text;
  has_tenants boolean;
  has_tenant_id_col boolean;
BEGIN
  has_tenants := to_regclass('public.tenants') IS NOT NULL;
  has_tenant_id_col := EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = '709_profiles'
      AND column_name = 'tenant_id'
  );

  IF has_tenants THEN
    SELECT id INTO target_tenant_id
    FROM public.tenants
    WHERE slug = '709exclusive'
    LIMIT 1;

    IF target_tenant_id IS NULL THEN
      RAISE NOTICE 'Tenant not found for slug 709exclusive.';
    END IF;
  ELSE
    RAISE NOTICE 'Tenants table not found; seeding without tenant scoping.';
  END IF;

  FOREACH target_email IN ARRAY ARRAY['admin@709exclusive.shop', 'tom@openpeople.ai']
  LOOP
    SELECT id INTO user_id
    FROM auth.users
    WHERE email = target_email
    LIMIT 1;

    IF user_id IS NULL THEN
      RAISE NOTICE 'User not found for email: %', target_email;
    ELSE
      IF EXISTS (SELECT 1 FROM public."709_profiles" WHERE id = user_id) THEN
        IF has_tenant_id_col AND target_tenant_id IS NOT NULL THEN
          UPDATE public."709_profiles"
          SET role = 'owner',
              tenant_id = target_tenant_id
          WHERE id = user_id;
        ELSE
          UPDATE public."709_profiles"
          SET role = 'owner'
          WHERE id = user_id;
        END IF;
        RAISE NOTICE 'Updated profile to owner for % (%).', target_email, user_id;
      ELSE
        IF has_tenant_id_col AND target_tenant_id IS NOT NULL THEN
          INSERT INTO public."709_profiles" (id, role, full_name, tenant_id)
          VALUES (user_id, 'owner', NULL, target_tenant_id);
        ELSE
          INSERT INTO public."709_profiles" (id, role, full_name)
          VALUES (user_id, 'owner', NULL);
        END IF;
        RAISE NOTICE 'Created owner profile for % (%).', target_email, user_id;
      END IF;
    END IF;
  END LOOP;
END $$;

-- =============================================================================
-- Seed staff access for support account
-- =============================================================================
--
-- This script assigns staff access for the support@709exclusive user.
-- It expects the user to already exist in auth.users.
-- =============================================================================

DO $$
DECLARE
  target_tenant_id uuid;
  user_id uuid;
  has_tenants boolean;
  has_tenant_id_col boolean;
BEGIN
  has_tenants := to_regclass('public.tenants') IS NOT NULL;
  has_tenant_id_col := EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = '709_profiles'
      AND column_name = 'tenant_id'
  );

  IF has_tenants THEN
    SELECT id INTO target_tenant_id
    FROM public.tenants
    WHERE slug = '709exclusive'
    LIMIT 1;

    IF target_tenant_id IS NULL THEN
      RAISE NOTICE 'Tenant not found for slug 709exclusive.';
    END IF;
  ELSE
    RAISE NOTICE 'Tenants table not found; seeding without tenant scoping.';
  END IF;

  SELECT id INTO user_id
  FROM auth.users
  WHERE email = 'support@709exclusive.shop'
  LIMIT 1;

  IF user_id IS NULL THEN
    RAISE NOTICE 'User not found for email: support@709exclusive.shop';
  ELSE
    IF EXISTS (SELECT 1 FROM public."709_profiles" WHERE id = user_id) THEN
      IF has_tenant_id_col AND target_tenant_id IS NOT NULL THEN
        UPDATE public."709_profiles"
        SET role = 'staff',
            tenant_id = target_tenant_id
        WHERE id = user_id;
      ELSE
        UPDATE public."709_profiles"
        SET role = 'staff'
        WHERE id = user_id;
      END IF;
      RAISE NOTICE 'Updated profile to staff for support@709exclusive.shop (%).', user_id;
    ELSE
      IF has_tenant_id_col AND target_tenant_id IS NOT NULL THEN
        INSERT INTO public."709_profiles" (id, role, full_name, tenant_id)
        VALUES (user_id, 'staff', NULL, target_tenant_id);
      ELSE
        INSERT INTO public."709_profiles" (id, role, full_name)
        VALUES (user_id, 'staff', NULL);
      END IF;
      RAISE NOTICE 'Created staff profile for support@709exclusive.shop (%).', user_id;
    END IF;
  END IF;
END $$;

-- =============================================================================
-- Verification: Check owner users for 709exclusive
-- =============================================================================
DO $$
DECLARE
  has_tenant_id_col boolean;
BEGIN
  has_tenant_id_col := EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = '709_profiles'
      AND column_name = 'tenant_id'
  );

  IF has_tenant_id_col THEN
    EXECUTE $sql$
      SELECT
        u.id,
        u.email,
        p.role,
        p.tenant_id
      FROM auth.users u
      JOIN public."709_profiles" p ON p.id = u.id
      WHERE u.email IN ('admin@709exclusive.shop', 'tom@openpeople.ai')
      ORDER BY u.email
    $sql$;
  ELSE
    EXECUTE $sql$
      SELECT
        u.id,
        u.email,
        p.role
      FROM auth.users u
      JOIN public."709_profiles" p ON p.id = u.id
      WHERE u.email IN ('admin@709exclusive.shop', 'tom@openpeople.ai')
      ORDER BY u.email
    $sql$;
  END IF;
END $$;

-- =============================================================================
-- Verification: Check support staff user for 709exclusive
-- =============================================================================
DO $$
DECLARE
  has_tenant_id_col boolean;
BEGIN
  has_tenant_id_col := EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = '709_profiles'
      AND column_name = 'tenant_id'
  );

  IF has_tenant_id_col THEN
    EXECUTE $sql$
      SELECT
        u.id,
        u.email,
        p.role,
        p.tenant_id
      FROM auth.users u
      JOIN public."709_profiles" p ON p.id = u.id
      WHERE u.email = 'support@709exclusive.shop'
      ORDER BY u.email
    $sql$;
  ELSE
    EXECUTE $sql$
      SELECT
        u.id,
        u.email,
        p.role
      FROM auth.users u
      JOIN public."709_profiles" p ON p.id = u.id
      WHERE u.email = 'support@709exclusive.shop'
      ORDER BY u.email
    $sql$;
  END IF;
END $$;
