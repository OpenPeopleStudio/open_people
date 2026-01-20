import { createSupabaseServer } from "@/lib/supabase/server";
import { STORAGE_PLANS, formatBytes } from "@/types/storage";
import { StorageDashboard } from "@/app/(platform)/admin/storage/StorageDashboard";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin - Cloud Storage (File Browser)
   
   Uses the dedicated platform storage tenant (id: 00000000-0000-0000-0000-000000000001)
   for super-admin file storage. Analytics have been moved to Analytics > Storage.
   ═══════════════════════════════════════════════════════════════════════════ */

// The dedicated super-admin storage tenant ID
const PLATFORM_TENANT_ID = "00000000-0000-0000-0000-000000000001";

type StorageStats = {
  totalStorageBytes: number;
  totalFiles: number;
  totalBuckets: number;
  bandwidthThisMonth: number;
};

type Bucket = {
  id: string;
  name: string;
  is_public: boolean;
  created_at: string;
  file_count: number;
  total_size: number;
};

type Subscription = {
  tier: string;
  status: string;
  current_period_end: string | null;
};

async function getStorageData(tenantId: string) {
  const supabase = await createSupabaseServer();

  // Get subscription
  const { data: subscription } = await supabase
    .from("storage_subscriptions")
    .select("tier, status, current_period_end")
    .eq("tenant_id", tenantId)
    .single();

  // Get storage stats
  const { data: filesData } = await supabase
    .from("storage_files")
    .select("size")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null);

  const totalStorageBytes = (filesData || []).reduce((sum, f) => sum + (f.size || 0), 0);
  const totalFiles = filesData?.length || 0;

  // Get bucket count
  const { count: totalBuckets } = await supabase
    .from("storage_buckets")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  // Get bandwidth this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: usageData } = await supabase
    .from("storage_usage")
    .select("bandwidth_bytes")
    .eq("tenant_id", tenantId)
    .gte("period_start", startOfMonth.toISOString().split("T")[0]);

  const bandwidthThisMonth = (usageData || []).reduce(
    (sum, u) => sum + (u.bandwidth_bytes || 0),
    0
  );

  const stats: StorageStats = {
    totalStorageBytes,
    totalFiles,
    totalBuckets: totalBuckets || 0,
    bandwidthThisMonth,
  };

  // Get buckets with counts
  const { data: buckets } = await supabase
    .from("storage_buckets")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  const bucketsWithCounts: Bucket[] = await Promise.all(
    (buckets || []).map(async (bucket) => {
      const { count } = await supabase
        .from("storage_files")
        .select("*", { count: "exact", head: true })
        .eq("bucket_id", bucket.id)
        .is("deleted_at", null);

      const { data: sizeData } = await supabase
        .from("storage_files")
        .select("size")
        .eq("bucket_id", bucket.id)
        .is("deleted_at", null);

      const totalSize = (sizeData || []).reduce(
        (sum, f) => sum + (f.size || 0),
        0
      );

      return {
        id: bucket.id,
        name: bucket.name,
        is_public: bucket.is_public,
        created_at: bucket.created_at,
        file_count: count || 0,
        total_size: totalSize,
      };
    })
  );

  // Get recent files
  const { data: recentFiles } = await supabase
    .from("storage_files")
    .select("*, bucket:storage_buckets(name)")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(10);

  return {
    subscription: subscription || { tier: "enterprise", status: "active", current_period_end: null },
    stats,
    buckets: bucketsWithCounts,
    recentFiles: (recentFiles || []).map((f) => ({
      ...f,
      bucket: Array.isArray(f.bucket) ? f.bucket[0] : f.bucket,
    })),
  };
}

export default async function SuperAdminStoragePage() {
  const data = await getStorageData(PLATFORM_TENANT_ID);
  const plan = STORAGE_PLANS[data.subscription.tier as keyof typeof STORAGE_PLANS] || STORAGE_PLANS.enterprise;

  const storagePercent = Math.min(
    (data.stats.totalStorageBytes / plan.storageLimit) * 100,
    100
  );
  const bandwidthPercent = Math.min(
    (data.stats.bandwidthThisMonth / plan.bandwidthLimit) * 100,
    100
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Cloud Storage
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Platform file storage powered by Cloudflare R2
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/super-admin/analytics"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--electric-lime)] transition-colors"
          >
            View Storage Analytics
          </Link>
          <span className="px-3 py-1 rounded-full bg-[var(--success)]/10 text-[var(--success)] text-xs font-medium">
            {plan.name} Plan
          </span>
        </div>
      </div>

      {/* Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <UsageCard
          label="Storage Used"
          current={data.stats.totalStorageBytes}
          limit={plan.storageLimit}
          percent={storagePercent}
          format={formatBytes}
        />
        <UsageCard
          label="Bandwidth (This Month)"
          current={data.stats.bandwidthThisMonth}
          limit={plan.bandwidthLimit}
          percent={bandwidthPercent}
          format={formatBytes}
        />
        <StatCard
          label="Total Files"
          value={data.stats.totalFiles.toLocaleString()}
          icon="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
        <StatCard
          label="Buckets"
          value={data.stats.totalBuckets.toString()}
          icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </div>

      {/* Main Dashboard (Client Component) */}
      <StorageDashboard
        buckets={data.buckets}
        recentFiles={data.recentFiles}
        plan={plan}
      />
    </div>
  );
}

function UsageCard({
  label,
  current,
  limit,
  percent,
  format,
}: {
  label: string;
  current: number;
  limit: number;
  percent: number;
  format: (bytes: number) => string;
}) {
  return (
    <div className="p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
      <p className="text-sm text-[var(--text-muted)]">{label}</p>
      <p className="text-2xl font-semibold text-[var(--text-primary)] mt-2">
        {format(current)}
      </p>
      <p className="text-xs text-[var(--text-secondary)] mt-1">
        of {format(limit)}
      </p>
      <div className="mt-3 h-2 bg-[var(--surface-3)] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            percent > 90
              ? "bg-[var(--error)]"
              : percent > 70
              ? "bg-[var(--warning)]"
              : "bg-[var(--electric-lime)]"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--text-muted)]">{label}</p>
          <p className="text-2xl font-semibold text-[var(--text-primary)] mt-2">
            {value}
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-[var(--electric-lime)]/10 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-[var(--electric-lime)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
      </div>
    </div>
  );
}
