import { createSupabaseServer } from "@/lib/supabase/server";
import Link from "next/link";
import { NOTIFICATION_PLANS, formatNotificationCount } from "@/types/notifications";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin - Notifications Management
   Platform-wide notification metrics
   ═══════════════════════════════════════════════════════════════════════════ */

async function getNotificationMetrics() {
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

  const smsDeliveryRate = totalSmsSent > 0 ? Math.round((totalSmsDelivered / totalSmsSent) * 100) : 0;
  const inAppReadRate = totalInAppSent > 0 ? Math.round((totalInAppRead / totalInAppSent) * 100) : 0;

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

  const topTenantsByNotifications: {
    id: string;
    name: string;
    notifications: number;
    tier: string;
  }[] = [];

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

  const recentSubscriptions = (recentSubs || []).map((sub) => ({
    id: sub.id,
    tenant_name: Array.isArray(sub.tenant)
      ? sub.tenant[0]?.name || "Unknown"
      : sub.tenant?.name || "Unknown",
    tier: sub.tier,
    status: sub.status,
    created_at: sub.created_at,
  }));

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

export default async function SuperAdminNotificationsPage() {
  const metrics = await getNotificationMetrics();

  const overviewCards = [
    {
      label: "SMS Sent (This Month)",
      value: formatNotificationCount(metrics.totalSmsSent),
      subtext: `${metrics.smsDeliveryRate}% delivered`,
      icon: "M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3",
      color: "var(--electric-lime)",
    },
    {
      label: "In-App Sent",
      value: formatNotificationCount(metrics.totalInAppSent),
      subtext: `${metrics.inAppReadRate}% read`,
      icon: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0",
      color: "var(--electric-cyan)",
    },
    {
      label: "Notifications MRR",
      value: `$${metrics.revenue.mrr}`,
      subtext: `${metrics.revenue.subscribers} paid subscribers`,
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      color: "var(--success)",
    },
    {
      label: "SMS Failed",
      value: formatNotificationCount(metrics.totalSmsFailed),
      subtext: "This month",
      icon: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z",
      color: metrics.totalSmsFailed > 100 ? "var(--error)" : "var(--text-muted)",
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Notifications
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            SMS via Twilio · In-App · Push (coming soon)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[var(--success)]/10 text-[var(--success)] text-xs font-medium">
            Twilio Connected
          </span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {overviewCards.map((card) => (
          <div
            key={card.label}
            className="p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[var(--text-muted)]">{card.label}</p>
                <p className="text-2xl font-semibold text-[var(--text-primary)] mt-2">
                  {card.value}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-2">
                  {card.subtext}
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${card.color}15` }}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  style={{ color: card.color }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={card.icon}
                  />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Tiers */}
      <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
          Notification Plans
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.values(NOTIFICATION_PLANS).map((plan) => {
            const subscriberCount =
              metrics.subscriptionsByTier.find((s) => s.tier === plan.tier)?.count || 0;
            return (
              <div
                key={plan.tier}
                className="p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">
                    {plan.name}
                  </span>
                  <span className="text-sm text-[var(--electric-lime)]">
                    {plan.price === 0 ? "Free" : `$${plan.price}/mo`}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-[var(--text-muted)]">
                  <p>SMS: {plan.smsPerMonth === -1 ? "∞" : formatNotificationCount(plan.smsPerMonth)}/mo</p>
                  <p>In-App: {plan.inAppPerMonth === -1 ? "∞" : formatNotificationCount(plan.inAppPerMonth)}/mo</p>
                  <p>Templates: {plan.templates === -1 ? "∞" : plan.templates}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
                  <span className="text-xs text-[var(--text-secondary)]">
                    {subscriberCount} subscriber{subscriberCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <p className="text-sm text-[var(--text-muted)]">Total Templates</p>
          <p className="text-2xl font-semibold text-[var(--text-primary)] mt-2">
            {metrics.totalTemplates}
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-2">Across all tenants</p>
        </div>
        <div className="p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <p className="text-sm text-[var(--text-muted)]">SMS Delivery Rate</p>
          <p
            className="text-2xl font-semibold mt-2"
            style={{
              color: metrics.smsDeliveryRate >= 95 ? "var(--success)" : "var(--warning)",
            }}
          >
            {metrics.smsDeliveryRate}%
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-2">Platform average</p>
        </div>
        <div className="p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <p className="text-sm text-[var(--text-muted)]">In-App Read Rate</p>
          <p className="text-2xl font-semibold text-[var(--electric-cyan)] mt-2">
            {metrics.inAppReadRate}%
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-2">Platform average</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Tenants */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            Top Tenants by Notifications
          </h2>
          {metrics.topTenantsByNotifications.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">
              No notification activity yet
            </p>
          ) : (
            <div className="space-y-3">
              {metrics.topTenantsByNotifications.map((tenant, index) => (
                <Link
                  key={tenant.id}
                  href={`/super-admin/tenants/${tenant.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[var(--surface-3)] flex items-center justify-center text-xs font-medium text-[var(--text-muted)]">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {tenant.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">{tenant.tier} plan</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {formatNotificationCount(tenant.notifications)} sent
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Subscriptions */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            Recent Subscriptions
          </h2>
          {metrics.recentSubscriptions.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">
              No subscriptions yet
            </p>
          ) : (
            <div className="space-y-3">
              {metrics.recentSubscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)]"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {sub.tenant_name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 rounded bg-[var(--surface-3)] text-[var(--text-secondary)] capitalize">
                      {sub.tier}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        sub.status === "active"
                          ? "bg-[var(--success)]/10 text-[var(--success)]"
                          : sub.status === "trialing"
                          ? "bg-[var(--warning)]/10 text-[var(--warning)]"
                          : "bg-[var(--error)]/10 text-[var(--error)]"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Twilio Configuration */}
      <div className="mt-6 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Twilio Configuration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-[var(--surface-2)]">
            <p className="text-xs text-[var(--text-muted)] mb-1">Webhook Endpoint</p>
            <p className="text-sm text-[var(--text-primary)] font-mono">
              /api/notifications/webhooks?provider=twilio
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[var(--surface-2)]">
            <p className="text-xs text-[var(--text-muted)] mb-1">Platform Number</p>
            <p className="text-sm text-[var(--text-primary)]">
              {process.env.TWILIO_FROM_NUMBER || "Not configured"}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[var(--surface-2)]">
            <p className="text-xs text-[var(--text-muted)] mb-1">API Status</p>
            <p className="text-sm text-[var(--success)]">Connected</p>
          </div>
        </div>
      </div>
    </div>
  );
}
