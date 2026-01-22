-- ═══════════════════════════════════════════════════════════════════════════
-- RLS backfill for recent tables
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS
ALTER TABLE ai_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_company_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_company_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE drift_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_blobs ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies to keep migration idempotent
DROP POLICY IF EXISTS "ai_companies_tenant_isolation" ON ai_companies;
DROP POLICY IF EXISTS "ai_company_groups_tenant_isolation" ON ai_company_groups;
DROP POLICY IF EXISTS "ai_company_group_members_tenant_isolation" ON ai_company_group_members;
DROP POLICY IF EXISTS "email_campaigns_tenant_isolation" ON email_campaigns;
DROP POLICY IF EXISTS "email_campaign_recipients_tenant_isolation" ON email_campaign_recipients;
DROP POLICY IF EXISTS "drift_baselines_tenant_isolation" ON drift_baselines;
DROP POLICY IF EXISTS "personal_events_super_admin_only" ON personal_events;
DROP POLICY IF EXISTS "personal_blobs_super_admin_only" ON personal_blobs;

-- AI companies: tenant scoped, super admin can access global rows
CREATE POLICY "ai_companies_tenant_isolation" ON ai_companies
  FOR ALL
  USING (tenant_id = current_user_tenant_id() OR is_super_admin())
  WITH CHECK (tenant_id = current_user_tenant_id() OR is_super_admin());

-- AI company groups
CREATE POLICY "ai_company_groups_tenant_isolation" ON ai_company_groups
  FOR ALL
  USING (tenant_id = current_user_tenant_id() OR is_super_admin())
  WITH CHECK (tenant_id = current_user_tenant_id() OR is_super_admin());

-- Group members must link only tenant-owned companies/groups
CREATE POLICY "ai_company_group_members_tenant_isolation" ON ai_company_group_members
  FOR ALL
  USING (
    is_super_admin()
    OR (
      EXISTS (
        SELECT 1
        FROM ai_company_groups g
        WHERE g.id = group_id
          AND g.tenant_id = current_user_tenant_id()
      )
      AND EXISTS (
        SELECT 1
        FROM ai_companies c
        WHERE c.id = company_id
          AND c.tenant_id = current_user_tenant_id()
      )
    )
  )
  WITH CHECK (
    is_super_admin()
    OR (
      EXISTS (
        SELECT 1
        FROM ai_company_groups g
        WHERE g.id = group_id
          AND g.tenant_id = current_user_tenant_id()
      )
      AND EXISTS (
        SELECT 1
        FROM ai_companies c
        WHERE c.id = company_id
          AND c.tenant_id = current_user_tenant_id()
      )
    )
  );

-- Email campaigns: tenant scoped, super admin can access platform drafts
CREATE POLICY "email_campaigns_tenant_isolation" ON email_campaigns
  FOR ALL
  USING (tenant_id = current_user_tenant_id() OR is_super_admin())
  WITH CHECK (tenant_id = current_user_tenant_id() OR is_super_admin());

-- Campaign recipients inherit campaign tenant, optionally enforce company tenant
CREATE POLICY "email_campaign_recipients_tenant_isolation" ON email_campaign_recipients
  FOR ALL
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM email_campaigns c
      WHERE c.id = campaign_id
        AND c.tenant_id = current_user_tenant_id()
    )
  )
  WITH CHECK (
    is_super_admin()
    OR (
      EXISTS (
        SELECT 1
        FROM email_campaigns c
        WHERE c.id = campaign_id
          AND c.tenant_id = current_user_tenant_id()
      )
      AND (
        company_id IS NULL
        OR EXISTS (
          SELECT 1
          FROM ai_companies ac
          WHERE ac.id = company_id
            AND ac.tenant_id = current_user_tenant_id()
        )
      )
    )
  );

-- Drift baselines
CREATE POLICY "drift_baselines_tenant_isolation" ON drift_baselines
  FOR ALL
  USING (tenant_id = current_user_tenant_id() OR is_super_admin())
  WITH CHECK (tenant_id = current_user_tenant_id() OR is_super_admin());

-- Personal data capture is super-admin only (service role bypasses RLS)
CREATE POLICY "personal_events_super_admin_only" ON personal_events
  FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "personal_blobs_super_admin_only" ON personal_blobs
  FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());
