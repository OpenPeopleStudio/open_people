-- ═══════════════════════════════════════════════════════════════════════════
-- RLS backfill for recent tables
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF to_regclass('public.ai_companies') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.ai_companies ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "ai_companies_tenant_isolation" ON public.ai_companies';
    EXECUTE 'CREATE POLICY "ai_companies_tenant_isolation" ON public.ai_companies FOR ALL USING (tenant_id = current_user_tenant_id() OR is_super_admin()) WITH CHECK (tenant_id = current_user_tenant_id() OR is_super_admin())';
  END IF;

  IF to_regclass('public.ai_company_groups') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.ai_company_groups ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "ai_company_groups_tenant_isolation" ON public.ai_company_groups';
    EXECUTE 'CREATE POLICY "ai_company_groups_tenant_isolation" ON public.ai_company_groups FOR ALL USING (tenant_id = current_user_tenant_id() OR is_super_admin()) WITH CHECK (tenant_id = current_user_tenant_id() OR is_super_admin())';
  END IF;

  IF to_regclass('public.ai_company_group_members') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.ai_company_group_members ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "ai_company_group_members_tenant_isolation" ON public.ai_company_group_members';
    EXECUTE 'CREATE POLICY "ai_company_group_members_tenant_isolation" ON public.ai_company_group_members FOR ALL USING (is_super_admin() OR (EXISTS (SELECT 1 FROM ai_company_groups g WHERE g.id = group_id AND g.tenant_id = current_user_tenant_id()) AND EXISTS (SELECT 1 FROM ai_companies c WHERE c.id = company_id AND c.tenant_id = current_user_tenant_id()))) WITH CHECK (is_super_admin() OR (EXISTS (SELECT 1 FROM ai_company_groups g WHERE g.id = group_id AND g.tenant_id = current_user_tenant_id()) AND EXISTS (SELECT 1 FROM ai_companies c WHERE c.id = company_id AND c.tenant_id = current_user_tenant_id())))';
  END IF;

  IF to_regclass('public.email_campaigns') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "email_campaigns_tenant_isolation" ON public.email_campaigns';
    EXECUTE 'CREATE POLICY "email_campaigns_tenant_isolation" ON public.email_campaigns FOR ALL USING (tenant_id = current_user_tenant_id() OR is_super_admin()) WITH CHECK (tenant_id = current_user_tenant_id() OR is_super_admin())';
  END IF;

  IF to_regclass('public.email_campaign_recipients') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.email_campaign_recipients ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "email_campaign_recipients_tenant_isolation" ON public.email_campaign_recipients';
    EXECUTE 'CREATE POLICY "email_campaign_recipients_tenant_isolation" ON public.email_campaign_recipients FOR ALL USING (is_super_admin() OR EXISTS (SELECT 1 FROM email_campaigns c WHERE c.id = campaign_id AND c.tenant_id = current_user_tenant_id())) WITH CHECK (is_super_admin() OR (EXISTS (SELECT 1 FROM email_campaigns c WHERE c.id = campaign_id AND c.tenant_id = current_user_tenant_id()) AND (company_id IS NULL OR EXISTS (SELECT 1 FROM ai_companies ac WHERE ac.id = company_id AND ac.tenant_id = current_user_tenant_id()))))';
  END IF;

  IF to_regclass('public.drift_baselines') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.drift_baselines ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "drift_baselines_tenant_isolation" ON public.drift_baselines';
    EXECUTE 'CREATE POLICY "drift_baselines_tenant_isolation" ON public.drift_baselines FOR ALL USING (tenant_id = current_user_tenant_id() OR is_super_admin()) WITH CHECK (tenant_id = current_user_tenant_id() OR is_super_admin())';
  END IF;

  IF to_regclass('public.personal_events') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.personal_events ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "personal_events_super_admin_only" ON public.personal_events';
    EXECUTE 'CREATE POLICY "personal_events_super_admin_only" ON public.personal_events FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin())';
  END IF;

  IF to_regclass('public.personal_blobs') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.personal_blobs ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "personal_blobs_super_admin_only" ON public.personal_blobs';
    EXECUTE 'CREATE POLICY "personal_blobs_super_admin_only" ON public.personal_blobs FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin())';
  END IF;
END $$;
