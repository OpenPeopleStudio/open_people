import { createSupabaseServer } from "@/lib/supabase/server";
import { STORAGE_PLANS } from "@/types/storage";

/* ═══════════════════════════════════════════════════════════════════════════
   Storage Metrics Helper
   Fetches platform-wide storage analytics for the super-admin dashboard
   ═══════════════════════════════════════════════════════════════════════════ */

export type StorageMetrics = {
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

export async function getStorageMetrics(): Promise<StorageMetrics> {
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
