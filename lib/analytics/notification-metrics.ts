import { createSupabaseServer } from "@/lib/supabase/server";
import { NOTIFICATION_PLANS } from "@/types/notifications";

/* ═══════════════════════════════════════════════════════════════════════════
   Notification Metrics Helper
   Fetches platform-wide notification analytics for the super-admin dashboard
   ═══════════════════════════════════════════════════════════════════════════ */

export type NotificationMetrics = {
  totalSmsSent: number;
  totalSmsDelivered: number;
  totalSmsFailed: number;
  smsDeliveryRate: number;
  totalInAppSent: number;
  totalInAppRead: number;
  inAppReadRate: number;
  totalPushSent: number;
  subscriptionsByTier: { tier: string; count: number }[];
  topTenantsByNotifications: {
    id: string;
    name: string;
    notifications: number;
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
};

export async function getNotificationMetrics(): Promise<NotificationMetrics> {
  const supabase = await createSupabaseServer();

  // Get current month usage totals
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: usageData } = await supabase
    .from("notification_usage")
    .select("*")
    .gte("period_start", startOfMonth.toISOString().split("T")[0]);

  let totalSmsSent = 0;
  let totalSmsDelivered = 0;
  let totalSmsFailed = 0;
  let totalInAppSent = 0;
  let totalInAppRead = 0;
  let totalPushSent = 0;

  (usageData || []).forEach((u) => {
    totalSmsSent += u.sms_sent || 0;
    totalSmsDelivered += u.sms_delivered || 0;
    totalSmsFailed += u.sms_failed || 0;
    totalInAppSent += u.in_app_sent || 0;
    totalInAppRead += u.in_app_read || 0;
    totalPushSent += u.push_sent || 0;
  });

  const smsDeliveryRate =
    totalSmsSent > 0 ? Math.round((totalSmsDelivered / totalSmsSent) * 100) : 0;
  const inAppReadRate =
    totalInAppSent > 0 ? Math.round((totalInAppRead / totalInAppSent) * 100) : 0;

  // Get subscriptions by tier
  const { data: subscriptions } = await supabase
    .from("notification_subscriptions")
    .select("tier, status");

  const tierCounts: Record<string, number> = {};
  let mrr = 0;
  let subscribers = 0;

  (subscriptions || []).forEach((sub) => {
    tierCounts[sub.tier] = (tierCounts[sub.tier] || 0) + 1;
    if (sub.status === "active" || sub.status === "trialing") {
      const plan = NOTIFICATION_PLANS[sub.tier as keyof typeof NOTIFICATION_PLANS];
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

  // Get top tenants by notifications
  const tenantNotifMap: Record<string, number> = {};
  (usageData || []).forEach((u) => {
    tenantNotifMap[u.tenant_id] =
      (tenantNotifMap[u.tenant_id] || 0) +
      (u.sms_sent || 0) +
      (u.in_app_sent || 0) +
      (u.push_sent || 0);
  });

  const topTenantIds = Object.entries(tenantNotifMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  const topTenantsByNotifications: NotificationMetrics["topTenantsByNotifications"] =
    [];

  if (topTenantIds.length > 0) {
    const { data: tenants } = await supabase
      .from("tenants")
      .select("id, name")
      .in("id", topTenantIds);

    const { data: tenantSubs } = await supabase
      .from("notification_subscriptions")
      .select("tenant_id, tier")
      .in("tenant_id", topTenantIds);

    const subMap = new Map((tenantSubs || []).map((s) => [s.tenant_id, s.tier]));

    for (const tenant of tenants || []) {
      topTenantsByNotifications.push({
        id: tenant.id,
        name: tenant.name,
        notifications: tenantNotifMap[tenant.id] || 0,
        tier: subMap.get(tenant.id) || "free",
      });
    }

    topTenantsByNotifications.sort((a, b) => b.notifications - a.notifications);
  }

  // Get recent subscriptions
  const { data: recentSubs } = await supabase
    .from("notification_subscriptions")
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

  // Get total templates
  const { count: totalTemplates } = await supabase
    .from("notification_templates")
    .select("*", { count: "exact", head: true });

  return {
    totalSmsSent,
    totalSmsDelivered,
    totalSmsFailed,
    smsDeliveryRate,
    totalInAppSent,
    totalInAppRead,
    inAppReadRate,
    totalPushSent,
    subscriptionsByTier,
    topTenantsByNotifications,
    recentSubscriptions,
    revenue: { mrr, subscribers },
    totalTemplates: totalTemplates || 0,
  };
}

// Helper to format notification counts for display
export function formatNotificationCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}
