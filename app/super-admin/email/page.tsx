import { createSupabaseServer } from "@/lib/supabase/server";
import Link from "next/link";
import { EMAIL_PLANS, formatEmailCount } from "@/types/email";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin - Email Add-on Management
   Platform-wide email metrics and tenant email management
   ═══════════════════════════════════════════════════════════════════════════ */

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

  const recentSubscriptions = (recentSubs || []).map((sub) => ({
    id: sub.id,
    tenant_name: Array.isArray(sub.tenant)
      ? sub.tenant[0]?.name || "Unknown"
      : sub.tenant?.name || "Unknown",
    tier: sub.tier,
    status: sub.status,
    created_at: sub.created_at,
  }));

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

export default async function SuperAdminEmailPage() {
  const metrics = await getEmailMetrics();

  const overviewCards = [
    {
      label: "Emails Sent (This Month)",
      value: formatEmailCount(metrics.totalSent),
      subtext: `${metrics.deliveryRate}% delivery rate`,
      icon: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75",
      color: "var(--electric-lime)",
    },
    {
      label: "Open Rate",
      value: `${metrics.openRate}%`,
      subtext: `${formatEmailCount(metrics.totalOpened)} opened`,
      icon: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z",
      color: "var(--electric-cyan)",
    },
    {
      label: "Email MRR",
      value: `$${metrics.revenue.mrr}`,
      subtext: `${metrics.revenue.subscribers} paid subscribers`,
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      color: "var(--success)",
    },
    {
      label: "Bounced",
      value: formatEmailCount(metrics.totalBounced),
      subtext: "This month",
      icon: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z",
      color: metrics.totalBounced > 100 ? "var(--error)" : "var(--text-muted)",
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Email Add-on
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Powered by Resend — Modern email delivery
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[var(--success)]/10 text-[var(--success)] text-xs font-medium">
            Resend Connected
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
          Email Plans
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.values(EMAIL_PLANS).map((plan) => {
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
                  <p>Emails: {formatEmailCount(plan.emailsPerMonth)}/mo</p>
                  <p>Domains: {plan.customDomains}</p>
                  <p>Templates: {plan.templates === -1 ? "Unlimited" : plan.templates}</p>
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
          <p className="text-sm text-[var(--text-muted)]">Custom Domains</p>
          <p className="text-2xl font-semibold text-[var(--text-primary)] mt-2">
            {metrics.totalDomains}
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-2">Configured</p>
        </div>
        <div className="p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <p className="text-sm text-[var(--text-muted)]">Delivery Rate</p>
          <p
            className="text-2xl font-semibold mt-2"
            style={{
              color: metrics.deliveryRate >= 95 ? "var(--success)" : "var(--warning)",
            }}
          >
            {metrics.deliveryRate}%
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-2">Platform average</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Tenants by Emails */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            Top Tenants by Emails
          </h2>
          {metrics.topTenantsByEmails.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">
              No email activity yet
            </p>
          ) : (
            <div className="space-y-3">
              {metrics.topTenantsByEmails.map((tenant, index) => (
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
                      <p className="text-xs text-[var(--text-muted)]">
                        {tenant.tier} plan
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {formatEmailCount(tenant.emails_sent)} sent
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Subscriptions */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            Recent Email Subscriptions
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

      {/* Resend Configuration Info */}
      <div className="mt-6 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Resend Configuration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-[var(--surface-2)]">
            <p className="text-xs text-[var(--text-muted)] mb-1">Default Sender Domain</p>
            <p className="text-sm text-[var(--text-primary)] font-mono">
              mail.openpeople.ai
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[var(--surface-2)]">
            <p className="text-xs text-[var(--text-muted)] mb-1">Webhook Endpoint</p>
            <p className="text-sm text-[var(--text-primary)] font-mono">
              /api/email/webhooks
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
