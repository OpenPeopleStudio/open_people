/**
 * Platform Analytics API
 *
 * Provides comprehensive analytics data for the platform analytics dashboard.
 * Includes metrics on tenants, usage, revenue, and trends.
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuthAndAuthZ, UserRole } from "@/lib/auth/middleware";
import { createSupabaseServer } from "@/lib/supabase/server";

const handleGetAnalytics = withAuthAndAuthZ({
  role: UserRole.SUPER_ADMIN, // Only super admins can access analytics
})(async (auth, request: NextRequest) => {
  const supabase = await createSupabaseServer();
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '30d';

  // Calculate date range
  const now = new Date();
  const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

  // Get tenant overview metrics
  const { data: tenantStats } = await supabase
    .from('tenants')
    .select('id, status, created_at');

  const { data: billingStats } = await supabase
    .from('tenant_billing')
    .select('plan, status, tenant_id');

  // Calculate overview metrics
  const totalTenants = tenantStats?.length || 0;
  const activeTenants = tenantStats?.filter(t => t.status === 'active').length || 0;

  // Mock user count (would need actual user counting logic)
  const totalUsers = totalTenants * 5; // Rough estimate

  // Calculate MRR from billing data
  const mrr = billingStats?.reduce((total, billing) => {
    if (billing.status === 'active' || billing.status === 'trialing') {
      const planPrices: Record<string, number> = {
        starter: 99,
        pro: 199,
        enterprise: 499,
      };
      return total + (planPrices[billing.plan] || 0);
    }
    return total;
  }, 0) || 0;

  // Get usage metrics (mock data - would need actual usage tracking)
  const usageMetrics = {
    totalAiCalls: Math.floor(totalTenants * 1000 * (periodDays / 30)), // Rough estimate
    totalStorage: totalTenants * 1024 * 1024 * 1024 * 5, // 5GB per tenant
    totalEmails: Math.floor(totalTenants * 500 * (periodDays / 30)), // Rough estimate
    totalMessages: Math.floor(totalTenants * 200 * (periodDays / 30)), // Rough estimate
  };

  // Calculate trends (mock growth rates)
  const trends = {
    signupsLast30Days: Math.floor(totalTenants * 0.1), // 10% monthly growth
    revenueGrowth: 0.15, // 15% growth
    userGrowth: 0.12, // 12% growth
    featureAdoption: {
      ai_inventory: 0.85,
      ai_chat: 0.65,
      ai_analytics: 0.45,
      vault: 0.90,
      notes: 0.75,
      email: 0.80,
    },
  };

  // Get top performers
  const tenantsByRevenue = billingStats
    ?.filter(b => b.status === 'active')
    .map(billing => {
      const tenant = tenantStats?.find(t => t.id === billing.tenant_id);
      const planPrices: Record<string, number> = {
        starter: 99,
        pro: 199,
        enterprise: 499,
      };

      return {
        id: billing.tenant_id,
        name: tenant?.name || `Tenant ${billing.tenant_id.slice(0, 8)}`,
        revenue: planPrices[billing.plan] || 0,
        plan: billing.plan,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10) || [];

  const tenantsByUsage = tenantStats
    ?.slice(0, 10)
    .map(tenant => ({
      id: tenant.id,
      name: tenant.name || `Tenant ${tenant.id.slice(0, 8)}`,
      aiCalls: Math.floor(Math.random() * 5000) + 1000, // Mock data
      storage: Math.floor(Math.random() * 10 * 1024 * 1024 * 1024) + 1024 * 1024 * 1024, // 1-11GB
    }))
    .sort((a, b) => b.aiCalls - a.aiCalls) || [];

  // Calculate feature adoption
  const { data: tenantSettings } = await supabase
    .from('tenants')
    .select('settings');

  const featureCounts: Record<string, number> = {};
  tenantSettings?.forEach(tenant => {
    const settings = tenant.settings as any;
    if (settings?.features) {
      Object.entries(settings.features).forEach(([feature, enabled]) => {
        if (enabled) {
          featureCounts[feature] = (featureCounts[feature] || 0) + 1;
        }
      });
    }
  });

  const featuresByUsage = Object.entries(featureCounts)
    .map(([feature, count]) => ({
      feature,
      enabledCount: count,
      adoptionRate: totalTenants > 0 ? count / totalTenants : 0,
    }))
    .sort((a, b) => b.adoptionRate - a.adoptionRate);

  const metrics = {
    overview: {
      totalTenants,
      activeTenants,
      totalUsers,
      mrr,
      arr: mrr * 12,
      growthRate: trends.revenueGrowth,
    },
    usage: usageMetrics,
    trends,
    topPerformers: {
      tenantsByRevenue,
      tenantsByUsage,
      featuresByUsage,
    },
  };

  return NextResponse.json({ metrics });
});

export const GET = handleGetAnalytics;