-- ═══════════════════════════════════════════════════════════════════════════
-- Tenant Onboarding Intake Schema
-- 
-- Stores detailed onboarding responses captured during signup flow.
-- Super admins can view all tenants; regular users only their own tenant.
-- ═══════════════════════════════════════════════════════════════════════════

-- Onboarding status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'onboarding_status') THEN
    CREATE TYPE onboarding_status AS ENUM ('not_started', 'in_progress', 'completed', 'skipped');
  END IF;
END $$;

-- Main onboarding table
CREATE TABLE IF NOT EXISTS tenant_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Status tracking
  status onboarding_status DEFAULT 'not_started',
  current_step INTEGER DEFAULT 1,
  completed_at TIMESTAMPTZ,
  
  -- Step 1: Business Basics
  industry VARCHAR(255),
  industry_other VARCHAR(255),
  business_stage VARCHAR(100),           -- 'idea', 'early', 'growing', 'established', 'scaling'
  company_size VARCHAR(50),              -- '1', '2-10', '11-50', '51-200', '201-500', '500+'
  
  -- Step 2: What You Offer
  offerings_description TEXT,            -- Free-form description of products/services
  offerings_type VARCHAR(100),           -- 'physical_products', 'digital_products', 'services', 'saas', 'marketplace', 'mixed'
  primary_value_prop TEXT,               -- What makes you different
  
  -- Step 3: Target Audience
  target_audience TEXT,                  -- Who are your customers
  customer_segments JSONB DEFAULT '[]',  -- Array of segment objects [{name, description}]
  geographic_focus VARCHAR(100),         -- 'local', 'regional', 'national', 'international', 'global'
  
  -- Step 4: Goals & Objectives
  primary_goals JSONB DEFAULT '[]',      -- Array of goal strings
  success_metrics JSONB DEFAULT '[]',    -- Array of {metric, target, timeframe}
  timeline VARCHAR(100),                 -- When they want to achieve goals
  
  -- Step 5: Current Challenges
  pain_points JSONB DEFAULT '[]',        -- Array of pain point strings
  biggest_challenge TEXT,                -- Most pressing issue
  
  -- Step 6: Existing Tools & Data
  current_tools JSONB DEFAULT '[]',      -- Array of tool names/categories they use
  data_sources JSONB DEFAULT '[]',       -- Where their data lives
  integration_needs TEXT,                -- What they want to connect
  
  -- Step 7: AI & Automation Interests
  ai_use_cases JSONB DEFAULT '[]',       -- What they want AI to help with
  automation_priorities JSONB DEFAULT '[]', -- What they want automated
  ai_comfort_level VARCHAR(50),          -- 'beginner', 'intermediate', 'advanced'
  
  -- Step 8: Budget & Resources
  budget_range VARCHAR(100),             -- Monthly budget expectation
  team_involvement TEXT,                 -- Who will use the platform
  decision_timeline VARCHAR(100),        -- When they plan to decide/commit
  
  -- Step 9: Additional Context
  how_did_you_hear VARCHAR(255),
  additional_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One onboarding record per tenant
  UNIQUE(tenant_id)
);

-- Indexes
CREATE INDEX idx_tenant_onboarding_tenant ON tenant_onboarding(tenant_id);
CREATE INDEX idx_tenant_onboarding_status ON tenant_onboarding(status);
CREATE INDEX idx_tenant_onboarding_created ON tenant_onboarding(created_at DESC);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_tenant_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tenant_onboarding_updated_at ON tenant_onboarding;
CREATE TRIGGER tenant_onboarding_updated_at
  BEFORE UPDATE ON tenant_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_onboarding_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE tenant_onboarding ENABLE ROW LEVEL SECURITY;

-- Users can view their own tenant's onboarding
DROP POLICY IF EXISTS "tenant_onboarding_select_own" ON tenant_onboarding;
CREATE POLICY "tenant_onboarding_select_own" ON tenant_onboarding
  FOR SELECT USING (
    tenant_id = public.current_user_tenant_id()
    OR public.is_super_admin()
  );

-- Users can insert for their own tenant (or super admin for any)
DROP POLICY IF EXISTS "tenant_onboarding_insert" ON tenant_onboarding;
CREATE POLICY "tenant_onboarding_insert" ON tenant_onboarding
  FOR INSERT WITH CHECK (
    tenant_id = public.current_user_tenant_id()
    OR public.is_super_admin()
  );

-- Users can update their own tenant's onboarding
DROP POLICY IF EXISTS "tenant_onboarding_update_own" ON tenant_onboarding;
CREATE POLICY "tenant_onboarding_update_own" ON tenant_onboarding
  FOR UPDATE USING (
    tenant_id = public.current_user_tenant_id()
    OR public.is_super_admin()
  );

-- Super admins can delete (for cleanup)
DROP POLICY IF EXISTS "tenant_onboarding_delete_admin" ON tenant_onboarding;
CREATE POLICY "tenant_onboarding_delete_admin" ON tenant_onboarding
  FOR DELETE USING (public.is_super_admin());

-- Service role bypass for API operations
DROP POLICY IF EXISTS "tenant_onboarding_service_role" ON tenant_onboarding;
CREATE POLICY "tenant_onboarding_service_role" ON tenant_onboarding
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
