-- ═══════════════════════════════════════════════════════════════════════════
-- Seed Mars Tenant (Open People internal workspace)
-- This tenant is used for internal testing and Open People business operations
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Insert/update the mars tenant
INSERT INTO tenants (name, slug, status, settings)
VALUES (
  'Open People',
  'mars',
  'active',
  jsonb_build_object(
    'features', jsonb_build_object(
      'admin', true,
      'storage', true,
      'notifications', true,
      'email', true,
      'vault', true,
      'notes', true,
      'ai_chat', true,
      'knowledge', true,
      'api_keys', true,
      'workflows', true,
      'experiments', true,
      'ai_inventory', true,
      'ai_analytics', true
    ),
    'theme', jsonb_build_object(
      'brand_name', 'Open People',
      'colors', jsonb_build_object(
        'primary', '#CCFF00',
        'accent', '#00D4FF'
      )
    ),
    'type', 'internal'
  )
)
ON CONFLICT (slug) DO UPDATE
  SET 
    name = 'Open People',
    status = 'active',
    settings = jsonb_build_object(
      'features', jsonb_build_object(
        'admin', true,
        'storage', true,
        'notifications', true,
        'email', true,
        'vault', true,
        'notes', true,
        'ai_chat', true,
        'knowledge', true,
        'api_keys', true,
        'workflows', true,
        'experiments', true,
        'ai_inventory', true,
        'ai_analytics', true
      ),
      'theme', jsonb_build_object(
        'brand_name', 'Open People',
        'colors', jsonb_build_object(
          'primary', '#CCFF00',
          'accent', '#00D4FF'
        )
      ),
      'type', 'internal'
    ),
    updated_at = now();

-- 2) Ensure billing record exists for mars tenant
DO $$
DECLARE
  v_tenant_id uuid;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'mars' LIMIT 1;
  
  IF v_tenant_id IS NOT NULL THEN
    INSERT INTO tenant_billing (tenant_id, plan, status, plan_limits)
    VALUES (
      v_tenant_id,
      'enterprise',
      'active',
      jsonb_build_object(
        'ai_calls_per_month', 100000,
        'storage_gb', 500,
        'team_members', 100
      )
    )
    ON CONFLICT (tenant_id) DO UPDATE
      SET 
        plan = 'enterprise',
        status = 'active',
        plan_limits = jsonb_build_object(
          'ai_calls_per_month', 100000,
          'storage_gb', 500,
          'team_members', 100
        );
  END IF;
END $$;

-- 3) Ensure storage subscription exists for mars tenant
DO $$
DECLARE
  v_tenant_id uuid;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'mars' LIMIT 1;
  
  IF v_tenant_id IS NOT NULL THEN
    INSERT INTO storage_subscriptions (tenant_id, tier, status)
    VALUES (v_tenant_id, 'enterprise', 'active')
    ON CONFLICT (tenant_id) DO UPDATE
      SET tier = 'enterprise', status = 'active';
  END IF;
END $$;
