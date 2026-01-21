import { createSupabaseServer } from "@/lib/supabase/server";
import Link from "next/link";
import { EMAIL_PLANS, formatEmailCount } from "@/types/email";
import { STORAGE_PLANS, formatBytes as formatStorageBytes } from "@/types/storage";
import { NOTIFICATION_PLANS } from "@/types/notifications";
import { EXPERIMENT_PLANS, formatEventCount } from "@/types/experiments";
import { AnalyticsTabs } from "./AnalyticsTabs";
import { getStorageMetrics } from "@/lib/analytics/storage-metrics";
import {
  getNotificationMetrics,
  formatNotificationCount,
} from "@/lib/analytics/notification-metrics";
import { PlatformAnalytics } from "@/components/super-admin/PlatformAnalytics";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin - Analytics Page
   Platform-wide analytics and metrics with multiple views
   ═══════════════════════════════════════════════════════════════════════════ */

type PlatformMetrics = {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalAiCalls: number;
  totalStorage: number;
  totalMessages: number;
  tenantsByPlan: { plan: string; count: number }[];
  tenantsByStatus: { status: string; count: number }[];
  recentSignups: { date: string; count: number }[];
  topTenantsByUsage: {
    id: string;
    name: string;
    ai_calls: number;
    storage: number;
  }[];
};

type EmailMetrics = {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalBounced: number;
  deliveryRate: number;
  openRate: number;
  subscriptionsByTier: { tier: string; count: number }[];
  topTenantsByEmails: {
    id: string;
    name: string;
    emails_sent: number;
    tier: string;
  }[];
  recentSubscriptions: {
    id: string;
    tenant_name: string;
    tier: string;
    status: string;
    created_at: string;
  }[];
  revenue: {
    mrr: number;
    subscribers: number;
  };
  totalTemplates: number;
  totalDomains: number;
};

async function getPlatformMetrics(): Promise<PlatformMetrics> {
  const supabase = await createSupabaseServer();

  // Get tenant counts
  const { count: totalTenants } = await supabase
    .from("tenants")
    .select("*", { count: "exact", head: true });

  const { count: activeTenants } = await supabase
    .from("tenants")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  // Get user count
  const { count: totalUsers } = await supabase
    .from("709_profiles")
    .select("*", { count: "exact", head: true });

  // Get usage totals
  const { data: usageData } = await supabase
    .from("tenant_usage")
    .select("ai_api_calls, storage_bytes, messages_sent");

  const totalAiCalls = (usageData || []).reduce(
    (sum, u) => sum + (u.ai_api_calls || 0),
    0
  );
  const totalStorage = (usageData || []).reduce(
    (sum, u) => sum + (u.storage_bytes || 0),
    0
  );
  const totalMessages = (usageData || []).reduce(
    (sum, u) => sum + (u.messages_sent || 0),
    0
  );

  // Get tenants by plan
  const { data: billingData } = await supabase
    .from("tenant_billing")
    .select("plan");

  const planCounts: Record<string, number> = {};
  (billingData || []).forEach((b) => {
    planCounts[b.plan] = (planCounts[b.plan] || 0) + 1;
  });
  const tenantsByPlan = Object.entries(planCounts).map(([plan, count]) => ({
    plan,
    count,
  }));

  // Get tenants by status
  const { data: tenantStatusData } = await supabase
    .from("tenants")
    .select("status");

  const statusCounts: Record<string, number> = {};
  (tenantStatusData || []).forEach((t) => {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
  });
  const tenantsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
  }));

  // Get recent signups (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentTenants } = await supabase
    .from("tenants")
    .select("created_at")
    .gte("created_at", sevenDaysAgo.toISOString());

  const signupsByDate: Record<string, number> = {};
  (recentTenants || []).forEach((t) => {
    const date = new Date(t.created_at).toISOString().split("T")[0];
    signupsByDate[date] = (signupsByDate[date] || 0) + 1;
  });

  // Fill in missing dates
  const recentSignups: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    recentSignups.push({
      date: dateStr,
      count: signupsByDate[dateStr] || 0,
    });
  }

  // Get top tenants by AI usage
  const { data: topUsage } = await supabase
    .from("tenant_usage")
    .select("tenant_id, ai_api_calls, storage_bytes")
    .order("ai_api_calls", { ascending: false })
    .limit(5);

  const topTenantsByUsage: PlatformMetrics["topTenantsByUsage"] = [];
  if (topUsage) {
    for (const usage of topUsage) {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id, name")
        .eq("id", usage.tenant_id)
        .single();

      if (tenant) {
        topTenantsByUsage.push({
          id: tenant.id,
          name: tenant.name,
          ai_calls: usage.ai_api_calls || 0,
          storage: usage.storage_bytes || 0,
        });
      }
    }
  }

  return {
    totalTenants: totalTenants || 0,
    activeTenants: activeTenants || 0,
    totalUsers: totalUsers || 0,
    totalAiCalls,
    totalStorage,
    totalMessages,
    tenantsByPlan,
    tenantsByStatus,
    recentSignups,
    topTenantsByUsage,
  };
}

async function getEmailMetrics(): Promise<EmailMetrics> {
  const supabase = await createSupabaseServer();

  // Get current month usage totals
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: usageData } = await supabase
    .from("email_usage")
    .select("*")
    .gte("period_start", startOfMonth.toISOString().split("T")[0]);

  let totalSent = 0;
  let totalDelivered = 0;
  let totalOpened = 0;
  let totalBounced = 0;

  (usageData || []).forEach((u) => {
    totalSent += u.emails_sent || 0;
    totalDelivered += u.emails_delivered || 0;
    totalOpened += u.emails_opened || 0;
    totalBounced += u.emails_bounced || 0;
  });

  const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;
  const openRate = totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 100) : 0;

  // Get subscriptions by tier
  const { data: subscriptions } = await supabase
    .from("email_subscriptions")
    .select("tier, status");

  const tierCounts: Record<string, number> = {};
  let mrr = 0;
  let subscribers = 0;

  (subscriptions || []).forEach((sub) => {
    tierCounts[sub.tier] = (tierCounts[sub.tier] || 0) + 1;
    if (sub.status === "active" || sub.status === "trialing") {
      const plan = EMAIL_PLANS[sub.tier as keyof typeof EMAIL_PLANS];
      if (plan) {
        mrr += plan.price;
        if (plan.price > 0) subscribers++;
      }
    }
  });

  const subscriptionsByTier = Object.entries(tierCounts).map(([tier, count]) => ({
    tier,
    count,
  }));

  // Get top tenants by emails sent
  const tenantUsageMap: Record<string, number> = {};
  (usageData || []).forEach((u) => {
    tenantUsageMap[u.tenant_id] = (tenantUsageMap[u.tenant_id] || 0) + (u.emails_sent || 0);
  });

  const topTenantIds = Object.entries(tenantUsageMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  const topTenantsByEmails: EmailMetrics["topTenantsByEmails"] = [];

  if (topTenantIds.length > 0) {
    const { data: tenants } = await supabase
      .from("tenants")
      .select("id, name")
      .in("id", topTenantIds);

    const { data: tenantSubs } = await supabase
      .from("email_subscriptions")
      .select("tenant_id, tier")
      .in("tenant_id", topTenantIds);

    const subMap = new Map((tenantSubs || []).map((s) => [s.tenant_id, s.tier]));

    for (const tenant of tenants || []) {
      topTenantsByEmails.push({
        id: tenant.id,
        name: tenant.name,
        emails_sent: tenantUsageMap[tenant.id] || 0,
        tier: subMap.get(tenant.id) || "free",
      });
    }

    topTenantsByEmails.sort((a, b) => b.emails_sent - a.emails_sent);
  }

  // Get recent subscriptions
  const { data: recentSubs } = await supabase
    .from("email_subscriptions")
    .select("id, tier, status, created_at, tenant:tenants(name)")
    .order("created_at", { ascending: false })
    .limit(5);

  const recentSubscriptions = (recentSubs || []).map((sub) => {
    const tenant = sub.tenant as { name: string } | { name: string }[] | null;
    return {
      id: sub.id,
      tenant_name: Array.isArray(tenant)
        ? tenant[0]?.name || "Unknown"
        : tenant?.name || "Unknown",
      tier: sub.tier,
      status: sub.status,
      created_at: sub.created_at,
    };
  });

  // Get total templates and domains
  const { count: totalTemplates } = await supabase
    .from("email_templates")
    .select("*", { count: "exact", head: true });

  const { count: totalDomains } = await supabase
    .from("email_domains")
    .select("*", { count: "exact", head: true });

  return {
    totalSent,
    totalDelivered,
    totalOpened,
    totalBounced,
    deliveryRate,
    openRate,
    subscriptionsByTier,
    topTenantsByEmails,
    recentSubscriptions,
    revenue: { mrr, subscribers },
    totalTemplates: totalTemplates || 0,
    totalDomains: totalDomains || 0,
  };
}

async function getExperimentMetrics() {
  const supabase = await createSupabaseServer();

  // Get today's usage totals
  const today = new Date().toISOString().split("T")[0];
  const { data: usageData } = await supabase
    .from("experiment_usage")
    .select("*")
    .eq("period_start", today);

  let totalExposures = 0;
  let totalConversions = 0;
  let totalActiveExperiments = 0;
  let totalActiveFlags = 0;

  (usageData || []).forEach((u) => {
    totalExposures += u.total_exposures || 0;
    totalConversions += u.total_conversions || 0;
    totalActiveExperiments += u.active_experiments || 0;
    totalActiveFlags += u.active_flags || 0;
  });

  // Get subscriptions by tier
  const { data: subscriptions } = await supabase
    .from("experiment_subscriptions")
    .select("tier, status");

  const tierCounts: Record<string, number> = {};
  let mrr = 0;
  let subscribers = 0;

  (subscriptions || []).forEach((sub) => {
    tierCounts[sub.tier] = (tierCounts[sub.tier] || 0) + 1;
    if (sub.status === "active" || sub.status === "trialing") {
      const plan = EXPERIMENT_PLANS[sub.tier as keyof typeof EXPERIMENT_PLANS];
      if (plan) {
        mrr += plan.price;
        if (plan.price > 0) subscribers++;
      }
    }
  });

  const subscriptionsByTier = Object.entries(tierCounts).map(([tier, count]) => ({
    tier,
    count,
  }));

  // Get top tenants by events
  const tenantEventMap: Record<string, number> = {};
  (usageData || []).forEach((u) => {
    tenantEventMap[u.tenant_id] =
      (tenantEventMap[u.tenant_id] || 0) + (u.total_exposures || 0);
  });

  const topTenantIds = Object.entries(tenantEventMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  const topTenantsByEvents: {
    id: string;
    name: string;
    events: number;
    tier: string;
  }[] = [];

  if (topTenantIds.length > 0) {
    const { data: tenants } = await supabase
      .from("tenants")
      .select("id, name")
      .in("id", topTenantIds);

    const { data: tenantSubs } = await supabase
      .from("experiment_subscriptions")
      .select("tenant_id, tier")
      .in("tenant_id", topTenantIds);

    const subMap = new Map((tenantSubs || []).map((s) => [s.tenant_id, s.tier]));

    for (const tenant of tenants || []) {
      topTenantsByEvents.push({
        id: tenant.id,
        name: tenant.name,
        events: tenantEventMap[tenant.id] || 0,
        tier: subMap.get(tenant.id) || "free",
      });
    }

    topTenantsByEvents.sort((a, b) => b.events - a.events);
  }

  // Get recent subscriptions
  const { data: recentSubs } = await supabase
    .from("experiment_subscriptions")
    .select("id, tier, status, created_at, tenant:tenants(name)")
    .order("created_at", { ascending: false })
    .limit(5);

  const recentSubscriptions = (recentSubs || []).map((sub) => {
    const tenant = sub.tenant as { name: string } | { name: string }[] | null;
    return {
      id: sub.id,
      tenant_name: Array.isArray(tenant)
        ? tenant[0]?.name || "Unknown"
        : tenant?.name || "Unknown",
      tier: sub.tier,
      status: sub.status,
      created_at: sub.created_at,
    };
  });

  // Total counts
  const { count: totalExperimentsCount } = await supabase
    .from("experiments")
    .select("*", { count: "exact", head: true });

  const { count: totalFlagsCount } = await supabase
    .from("feature_flags")
    .select("*", { count: "exact", head: true });

  return {
    totalExposures,
    totalConversions,
    totalActiveExperiments,
    totalActiveFlags,
    totalExperimentsCount: totalExperimentsCount || 0,
    totalFlagsCount: totalFlagsCount || 0,
    subscriptionsByTier,
    topTenantsByEvents,
    recentSubscriptions,
    revenue: { mrr, subscribers },
  };
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default async function AnalyticsPage() {
  const [metrics, emailMetrics, storageMetrics, notificationMetrics, experimentMetrics] = await Promise.all([
    getPlatformMetrics(),
    getEmailMetrics(),
    getStorageMetrics(),
    getNotificationMetrics(),
    getExperimentMetrics(),
  ]);

  const overviewCards = [
    {
      label: "Total Tenants",
      value: metrics.totalTenants.toString(),
      subtext: `${metrics.activeTenants} active`,
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
      color: "var(--electric-lime)",
    },
    {
      label: "Total Users",
      value: formatNumber(metrics.totalUsers),
      subtext: "Across all tenants",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
      color: "var(--electric-cyan)",
    },
    {
      label: "AI API Calls",
      value: formatNumber(metrics.totalAiCalls),
      subtext: "All time",
      icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
      color: "var(--electric-violet)",
    },
    {
      label: "Total Storage",
      value: formatBytes(metrics.totalStorage),
      subtext: "Used by all tenants",
      icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4",
      color: "var(--success)",
    },
  ];

  const maxSignups = Math.max(...metrics.recentSignups.map((s) => s.count), 1);

  // Prepare data for client component
  const platformData = {
    overviewCards: [
      {
        label: "Total Tenants",
        value: metrics.totalTenants.toString(),
        subtext: `${metrics.activeTenants} active`,
        icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
        color: "var(--electric-lime)",
      },
      {
        label: "Total Users",
        value: formatNumber(metrics.totalUsers),
        subtext: "Across all tenants",
        icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
        color: "var(--electric-cyan)",
      },
      {
        label: "AI API Calls",
        value: formatNumber(metrics.totalAiCalls),
        subtext: "All time",
        icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
        color: "var(--electric-violet)",
      },
      {
        label: "Total Storage",
        value: formatBytes(metrics.totalStorage),
        subtext: "Used by all tenants",
        icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4",
        color: "var(--success)",
      },
    ],
    recentSignups: metrics.recentSignups,
    maxSignups,
    tenantsByPlan: metrics.tenantsByPlan,
    tenantsByStatus: metrics.tenantsByStatus,
    topTenantsByUsage: metrics.topTenantsByUsage.map(t => ({
      ...t,
      ai_calls_formatted: formatNumber(t.ai_calls),
      storage_formatted: formatBytes(t.storage),
    })),
  };

  const emailData = {
    overviewCards: [
      {
        label: "Emails Sent (This Month)",
        value: formatEmailCount(emailMetrics.totalSent),
        subtext: `${emailMetrics.deliveryRate}% delivery rate`,
        icon: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75",
        color: "var(--electric-lime)",
      },
      {
        label: "Open Rate",
        value: `${emailMetrics.openRate}%`,
        subtext: `${formatEmailCount(emailMetrics.totalOpened)} opened`,
        icon: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z",
        color: "var(--electric-cyan)",
      },
      {
        label: "Email MRR",
        value: `$${emailMetrics.revenue.mrr}`,
        subtext: `${emailMetrics.revenue.subscribers} paid subscribers`,
        icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
        color: "var(--success)",
      },
      {
        label: "Bounced",
        value: formatEmailCount(emailMetrics.totalBounced),
        subtext: "This month",
        icon: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z",
        color: emailMetrics.totalBounced > 100 ? "var(--error)" : "var(--text-muted)",
      },
    ],
    subscriptionsByTier: emailMetrics.subscriptionsByTier,
    topTenantsByEmails: emailMetrics.topTenantsByEmails,
    recentSubscriptions: emailMetrics.recentSubscriptions,
    deliveryRate: emailMetrics.deliveryRate,
    totalTemplates: emailMetrics.totalTemplates,
    totalDomains: emailMetrics.totalDomains,
  };

  // Prepare storage data for the Storage analytics tab
  const storageData = {
    overviewCards: [
      {
        label: "Total Storage Used",
        value: formatStorageBytes(storageMetrics.totalStorage),
        subtext: `${storageMetrics.totalFiles.toLocaleString()} files`,
        icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4",
        color: "var(--electric-lime)",
      },
      {
        label: "Bandwidth (This Month)",
        value: formatStorageBytes(storageMetrics.totalBandwidth),
        subtext: "Across all tenants",
        icon: "M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4",
        color: "var(--electric-cyan)",
      },
      {
        label: "Storage MRR",
        value: `$${storageMetrics.revenue.mrr}`,
        subtext: `${storageMetrics.revenue.subscribers} paid subscribers`,
        icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
        color: "var(--success)",
      },
      {
        label: "Total Buckets",
        value: storageMetrics.totalBuckets.toString(),
        subtext: "Across all tenants",
        icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
        color: "var(--electric-violet)",
      },
    ],
    subscriptionsByTier: storageMetrics.subscriptionsByTier,
    topTenantsByStorage: storageMetrics.topTenantsByStorage.map((t) => ({
      ...t,
      storage_formatted: formatStorageBytes(t.storage),
    })),
    recentSubscriptions: storageMetrics.recentSubscriptions,
    plans: Object.values(STORAGE_PLANS).map((plan) => ({
      ...plan,
      storageLimitFormatted: formatStorageBytes(plan.storageLimit),
      bandwidthLimitFormatted: formatStorageBytes(plan.bandwidthLimit),
      maxFileSizeFormatted: formatStorageBytes(plan.maxFileSize),
      subscriberCount:
        storageMetrics.subscriptionsByTier.find((s) => s.tier === plan.tier)?.count || 0,
    })),
  };

  // Prepare notification data for the Notifications analytics tab
  const notificationData = {
    overviewCards: [
      {
        label: "SMS Sent (This Month)",
        value: formatNotificationCount(notificationMetrics.totalSmsSent),
        subtext: `${notificationMetrics.smsDeliveryRate}% delivered`,
        icon: "M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3",
        color: "var(--electric-lime)",
      },
      {
        label: "In-App Sent",
        value: formatNotificationCount(notificationMetrics.totalInAppSent),
        subtext: `${notificationMetrics.inAppReadRate}% read`,
        icon: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0",
        color: "var(--electric-cyan)",
      },
      {
        label: "Notifications MRR",
        value: `$${notificationMetrics.revenue.mrr}`,
        subtext: `${notificationMetrics.revenue.subscribers} paid subscribers`,
        icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
        color: "var(--success)",
      },
      {
        label: "SMS Failed",
        value: formatNotificationCount(notificationMetrics.totalSmsFailed),
        subtext: "This month",
        icon: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z",
        color: notificationMetrics.totalSmsFailed > 100 ? "var(--error)" : "var(--text-muted)",
      },
    ],
    subscriptionsByTier: notificationMetrics.subscriptionsByTier,
    topTenantsByNotifications: notificationMetrics.topTenantsByNotifications.map((t) => ({
      ...t,
      notifications_formatted: formatNotificationCount(t.notifications),
    })),
    recentSubscriptions: notificationMetrics.recentSubscriptions,
    smsDeliveryRate: notificationMetrics.smsDeliveryRate,
    inAppReadRate: notificationMetrics.inAppReadRate,
    totalTemplates: notificationMetrics.totalTemplates,
    totalPushSent: notificationMetrics.totalPushSent,
    plans: Object.values(NOTIFICATION_PLANS).map((plan) => ({
      ...plan,
      smsFormatted: plan.smsPerMonth === -1 ? "Unlimited" : formatNotificationCount(plan.smsPerMonth),
      inAppFormatted: plan.inAppPerMonth === -1 ? "Unlimited" : formatNotificationCount(plan.inAppPerMonth),
      pushFormatted: plan.pushPerMonth === -1 ? "Unlimited" : formatNotificationCount(plan.pushPerMonth),
      subscriberCount:
        notificationMetrics.subscriptionsByTier.find((s) => s.tier === plan.tier)?.count || 0,
    })),
  };

  // Prepare experiments data for the Experiments analytics tab
  const experimentsData = {
    overviewCards: [
      {
        label: "Exposures Today",
        value: formatEventCount(experimentMetrics.totalExposures),
        subtext: "Across all tenants",
        icon: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z",
        color: "var(--electric-lime)",
      },
      {
        label: "Active Experiments",
        value: experimentMetrics.totalActiveExperiments.toString(),
        subtext: "Running now",
        icon: "M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232 1.232 3.23 0 4.462s-3.23 1.232-4.462 0L13.5 17.921",
        color: "var(--electric-cyan)",
      },
      {
        label: "Experiments MRR",
        value: `$${experimentMetrics.revenue.mrr}`,
        subtext: `${experimentMetrics.revenue.subscribers} paid subscribers`,
        icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
        color: "var(--success)",
      },
      {
        label: "Conversions Today",
        value: formatEventCount(experimentMetrics.totalConversions),
        subtext: "Goals achieved",
        icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
        color: "var(--electric-violet)",
      },
    ],
    subscriptionsByTier: experimentMetrics.subscriptionsByTier,
    topTenantsByEvents: experimentMetrics.topTenantsByEvents.map((t) => ({
      ...t,
      events_formatted: formatEventCount(t.events),
    })),
    recentSubscriptions: experimentMetrics.recentSubscriptions,
    totalExperimentsCount: experimentMetrics.totalExperimentsCount,
    totalFlagsCount: experimentMetrics.totalFlagsCount,
    plans: Object.values(EXPERIMENT_PLANS).map((plan) => ({
      tier: plan.tier,
      name: plan.name,
      price: plan.price,
      activeExperiments: plan.activeExperiments,
      featureFlags: plan.featureFlags,
      eventsPerDay: plan.eventsPerDay,
      subscriberCount:
        experimentMetrics.subscriptionsByTier.find((s) => s.tier === plan.tier)?.count || 0,
    })),
  };

  return (
    <div className="space-y-8">
      {/* New Platform Analytics Dashboard */}
      <PlatformAnalytics />

      {/* Existing Analytics Tabs */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
          Detailed Analytics
        </h2>
        <AnalyticsTabs
          platformData={platformData}
          emailData={emailData}
          storageData={storageData}
          notificationData={notificationData}
          experimentsData={experimentsData}
        />
      </div>
    </div>
  );
}
