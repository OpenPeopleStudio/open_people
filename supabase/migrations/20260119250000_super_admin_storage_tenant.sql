-- ═══════════════════════════════════════════════════════════════════════════
-- Super Admin Storage Tenant Migration
-- 
-- Creates a dedicated tenant for super-admin file storage so the Cloud Storage
-- page in super-admin can function as a real file browser.
-- ═══════════════════════════════════════════════════════════════════════════

-- Create the super-admin storage tenant
INSERT INTO tenants (
  id,
  name,
  slug,
  status,
  settings,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Open People Platform',
  'platform-storage',
  'active',
  jsonb_build_object(
    'theme', jsonb_build_object(
      'primaryColor', '#84cc16',
      'mode', 'dark'
    ),
    'branding', jsonb_build_object(
      'name', 'Open People Platform',
      'tagline', 'Platform-wide storage for super-admins'
    ),
    'features', jsonb_build_object(
      'storage', true,
      'vault', true,
      'notes', true,
      'email', true,
      'notifications', true,
      'ai_chat', true,
      'knowledge', true,
      'api_keys', true,
      'workflows', true
    )
  ),
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  status = EXCLUDED.status,
  settings = EXCLUDED.settings,
  updated_at = NOW();

-- Create tenant billing record
INSERT INTO tenant_billing (
  tenant_id,
  plan,
  status,
  current_period_end,
  plan_limits
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'enterprise',
  'active',
  NOW() + INTERVAL '100 years',
  jsonb_build_object(
    'ai_calls_per_month', 1000000,
    'storage_gb', 10000,
    'team_members', 1000
  )
) ON CONFLICT (tenant_id) DO UPDATE SET
  plan = EXCLUDED.plan,
  status = EXCLUDED.status,
  plan_limits = EXCLUDED.plan_limits,
  updated_at = NOW();

-- Create storage subscription for the platform tenant (unlimited tier)
INSERT INTO storage_subscriptions (
  tenant_id,
  tier,
  status,
  current_period_start,
  current_period_end,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'enterprise',
  'active',
  NOW(),
  NOW() + INTERVAL '100 years',
  NOW(),
  NOW()
) ON CONFLICT (tenant_id) DO UPDATE SET
  tier = EXCLUDED.tier,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Create a default bucket for platform storage
INSERT INTO storage_buckets (
  id,
  tenant_id,
  name,
  is_public,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'platform-files',
  false,
  NOW()
) ON CONFLICT (id) DO NOTHING;
