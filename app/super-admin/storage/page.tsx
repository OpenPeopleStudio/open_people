import { createSupabaseServer } from "@/lib/supabase/server";
import Link from "next/link";
import { STORAGE_PLANS, formatBytes } from "@/types/storage";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin - Storage Add-on Management
   Platform-wide storage metrics and tenant storage management
   ═══════════════════════════════════════════════════════════════════════════ */

type StorageMetrics = {
  totalStorage: number;
  totalBandwidth: number;
  totalFiles: number;
  totalBuckets: number;
  subscriptionsByTier: { tier: string; count: number }[];
  topTenantsByStorage: {
    id: string;
    name: string;
    storage: number;
    files: number;
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
};

async function getStorageMetrics(): Promise<StorageMetrics> {
  const supabase = await createSupabaseServer();

  // Get total storage and files
  const { data: filesData } = await supabase
    .from("storage_files")
    .select("size")
    .is("deleted_at", null);

  const totalStorage = (filesData || []).reduce((sum, f) => sum + (f.size || 0), 0);
  const totalFiles = filesData?.length || 0;

  // Get total buckets
  const { count: totalBuckets } = await supabase
    .from("storage_buckets")
    .select("*", { count: "exact", head: true });

  // Get bandwidth this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: usageData } = await supabase
    .from("storage_usage")
    .select("bandwidth_bytes")
    .gte("period_start", startOfMonth.toISOString().split("T")[0]);

  const totalBandwidth = (usageData || []).reduce(
    (sum, u) => sum + (u.bandwidth_bytes || 0),
    0
  );

  // Get subscriptions by tier
  const { data: subscriptions } = await supabase
    .from("storage_subscriptions")
    .select("tier, status");

  const tierCounts: Record<string, number> = {};
  let mrr = 0;
  let subscribers = 0;

  (subscriptions || []).forEach((sub) => {
    tierCounts[sub.tier] = (tierCounts[sub.tier] || 0) + 1;
    if (sub.status === "active" || sub.status === "trialing") {
      const plan = STORAGE_PLANS[sub.tier as keyof typeof STORAGE_PLANS];
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

  // Get top tenants by storage
  const { data: tenantUsage } = await supabase
    .from("storage_files")
    .select("tenant_id, size")
    .is("deleted_at", null);

  const tenantStorageMap: Record<string, { storage: number; files: number }> = {};
  (tenantUsage || []).forEach((f) => {
    if (!tenantStorageMap[f.tenant_id]) {
      tenantStorageMap[f.tenant_id] = { storage: 0, files: 0 };
    }
    tenantStorageMap[f.tenant_id].storage += f.size || 0;
    tenantStorageMap[f.tenant_id].files += 1;
  });

  const topTenantIds = Object.entries(tenantStorageMap)
    .sort((a, b) => b[1].storage - a[1].storage)
    .slice(0, 5)
    .map(([id]) => id);

  const topTenantsByStorage: StorageMetrics["topTenantsByStorage"] = [];

  if (topTenantIds.length > 0) {
    const { data: tenants } = await supabase
      .from("tenants")
      .select("id, name")
      .in("id", topTenantIds);

    const { data: tenantSubs } = await supabase
      .from("storage_subscriptions")
      .select("tenant_id, tier")
      .in("tenant_id", topTenantIds);

    const subMap = new Map(
      (tenantSubs || []).map((s) => [s.tenant_id, s.tier])
    );

    for (const tenant of tenants || []) {
      const usage = tenantStorageMap[tenant.id];
      if (usage) {
        topTenantsByStorage.push({
          id: tenant.id,
          name: tenant.name,
          storage: usage.storage,
          files: usage.files,
          tier: subMap.get(tenant.id) || "free",
        });
      }
    }

    // Sort by storage
    topTenantsByStorage.sort((a, b) => b.storage - a.storage);
  }

  // Get recent subscriptions
  const { data: recentSubs } = await supabase
    .from("storage_subscriptions")
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

  return {
    totalStorage,
    totalBandwidth,
    totalFiles,
    totalBuckets: totalBuckets || 0,
    subscriptionsByTier,
    topTenantsByStorage,
    recentSubscriptions,
    revenue: { mrr, subscribers },
  };
}

export default async function SuperAdminStoragePage() {
  const metrics = await getStorageMetrics();

  const overviewCards = [
    {
      label: "Total Storage Used",
      value: formatBytes(metrics.totalStorage),
      subtext: `${metrics.totalFiles.toLocaleString()} files`,
      icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4",
      color: "var(--electric-lime)",
    },
    {
      label: "Bandwidth (This Month)",
      value: formatBytes(metrics.totalBandwidth),
      subtext: "Across all tenants",
      icon: "M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4",
      color: "var(--electric-cyan)",
    },
    {
      label: "Storage MRR",
      value: `$${metrics.revenue.mrr}`,
      subtext: `${metrics.revenue.subscribers} paid subscribers`,
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      color: "var(--success)",
    },
    {
      label: "Total Buckets",
      value: metrics.totalBuckets.toString(),
      subtext: "Across all tenants",
      icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
      color: "var(--electric-violet)",
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Cloud Storage Add-on
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Powered by Cloudflare R2 — Zero egress fees
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[var(--success)]/10 text-[var(--success)] text-xs font-medium">
            R2 Connected
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
          Storage Plans
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.values(STORAGE_PLANS).map((plan) => {
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
                  <p>Storage: {formatBytes(plan.storageLimit)}</p>
                  <p>Bandwidth: {formatBytes(plan.bandwidthLimit)}/mo</p>
                  <p>Max file: {formatBytes(plan.maxFileSize)}</p>
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

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Tenants by Storage */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            Top Tenants by Storage
          </h2>
          {metrics.topTenantsByStorage.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">
              No storage usage yet
            </p>
          ) : (
            <div className="space-y-3">
              {metrics.topTenantsByStorage.map((tenant, index) => (
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
                        {tenant.files} files
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs px-2 py-1 rounded bg-[var(--surface-3)] text-[var(--text-muted)] capitalize">
                      {tenant.tier}
                    </span>
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {formatBytes(tenant.storage)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Subscriptions */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            Recent Storage Subscriptions
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

      {/* R2 Configuration Info */}
      <div className="mt-6 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Cloudflare R2 Configuration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-[var(--surface-2)]">
            <p className="text-xs text-[var(--text-muted)] mb-1">Bucket</p>
            <p className="text-sm text-[var(--text-primary)] font-mono">
              {process.env.R2_BUCKET_NAME || "openpeople-storage"}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[var(--surface-2)]">
            <p className="text-xs text-[var(--text-muted)] mb-1">Region</p>
            <p className="text-sm text-[var(--text-primary)]">Auto (Global)</p>
          </div>
          <div className="p-4 rounded-lg bg-[var(--surface-2)]">
            <p className="text-xs text-[var(--text-muted)] mb-1">Pricing</p>
            <p className="text-sm text-[var(--text-primary)]">
              $0.015/GB storage · $0 egress
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
