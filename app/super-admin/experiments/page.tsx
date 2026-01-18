import { createSupabaseServer } from "@/lib/supabase/server";
import Link from "next/link";
import { EXPERIMENT_PLANS, formatEventCount } from "@/types/experiments";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin - Experiments Management
   Platform-wide experimentation metrics
   ═══════════════════════════════════════════════════════════════════════════ */

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

  const recentSubscriptions = (recentSubs || []).map((sub) => ({
    id: sub.id,
    tenant_name: Array.isArray(sub.tenant)
      ? sub.tenant[0]?.name || "Unknown"
      : sub.tenant?.name || "Unknown",
    tier: sub.tier,
    status: sub.status,
    created_at: sub.created_at,
  }));

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

export default async function SuperAdminExperimentsPage() {
  const metrics = await getExperimentMetrics();

  const overviewCards = [
    {
      label: "Exposures Today",
      value: formatEventCount(metrics.totalExposures),
      subtext: "Across all tenants",
      icon: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z",
      color: "var(--electric-lime)",
    },
    {
      label: "Active Experiments",
      value: metrics.totalActiveExperiments.toString(),
      subtext: "Running now",
      icon: "M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232 1.232 3.23 0 4.462s-3.23 1.232-4.462 0L13.5 17.921",
      color: "var(--electric-cyan)",
    },
    {
      label: "Experiments MRR",
      value: `$${metrics.revenue.mrr}`,
      subtext: `${metrics.revenue.subscribers} paid subscribers`,
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      color: "var(--success)",
    },
    {
      label: "Conversions Today",
      value: formatEventCount(metrics.totalConversions),
      subtext: "Goals achieved",
      icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      color: "var(--electric-violet)",
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Experiments & Feature Flags
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Platform-wide A/B testing and experimentation
          </p>
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
          Experimentation Plans
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.values(EXPERIMENT_PLANS).map((plan) => {
            const subscriberCount =
              metrics.subscriptionsByTier.find((s) => s.tier === plan.tier)
                ?.count || 0;
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
                  <p>
                    Experiments: {plan.activeExperiments === -1 ? "∞" : plan.activeExperiments}
                  </p>
                  <p>
                    Flags: {plan.featureFlags === -1 ? "∞" : plan.featureFlags}
                  </p>
                  <p>
                    Events: {plan.eventsPerDay === -1 ? "∞" : formatEventCount(plan.eventsPerDay)}/day
                  </p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <p className="text-sm text-[var(--text-muted)]">Total Experiments</p>
          <p className="text-2xl font-semibold text-[var(--text-primary)] mt-2">
            {metrics.totalExperimentsCount}
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-2">Across all tenants</p>
        </div>
        <div className="p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <p className="text-sm text-[var(--text-muted)]">Total Feature Flags</p>
          <p className="text-2xl font-semibold text-[var(--text-primary)] mt-2">
            {metrics.totalFlagsCount}
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-2">Across all tenants</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Tenants by Events */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            Top Tenants by Events
          </h2>
          {metrics.topTenantsByEvents.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">
              No event activity yet
            </p>
          ) : (
            <div className="space-y-3">
              {metrics.topTenantsByEvents.map((tenant, index) => (
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
                    {formatEventCount(tenant.events)} events
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
    </div>
  );
}
