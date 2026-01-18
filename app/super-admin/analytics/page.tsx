import { createSupabaseServer } from "@/lib/supabase/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin - Analytics Page
   Platform-wide analytics and metrics
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
  const metrics = await getPlatformMetrics();

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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Analytics
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Platform-wide metrics and insights
        </p>
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
                <p className="text-3xl font-semibold text-[var(--text-primary)] mt-2">
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Signups Chart */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            New Signups (Last 7 Days)
          </h2>
          <div className="flex items-end gap-2 h-40">
            {metrics.recentSignups.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center">
                  <span className="text-xs text-[var(--text-muted)] mb-1">
                    {day.count}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-[var(--electric-lime)] transition-all"
                    style={{
                      height: `${Math.max((day.count / maxSignups) * 100, 4)}px`,
                      minHeight: "4px",
                    }}
                  />
                </div>
                <span className="text-xs text-[var(--text-muted)]">
                  {formatDate(day.date).split(" ")[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Distribution Charts */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            Tenant Distribution
          </h2>
          <div className="grid grid-cols-2 gap-6">
            {/* By Plan */}
            <div>
              <p className="text-sm text-[var(--text-muted)] mb-3">By Plan</p>
              <div className="space-y-2">
                {metrics.tenantsByPlan.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">No data</p>
                ) : (
                  metrics.tenantsByPlan.map((item) => (
                    <div key={item.plan} className="flex items-center justify-between">
                      <span className="text-sm text-[var(--text-secondary)] capitalize">
                        {item.plan}
                      </span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {item.count}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* By Status */}
            <div>
              <p className="text-sm text-[var(--text-muted)] mb-3">By Status</p>
              <div className="space-y-2">
                {metrics.tenantsByStatus.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">No data</p>
                ) : (
                  metrics.tenantsByStatus.map((item) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <span className="text-sm text-[var(--text-secondary)] capitalize">
                        {item.status}
                      </span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {item.count}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Tenants */}
      <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
          Top Tenants by AI Usage
        </h2>
        {metrics.topTenantsByUsage.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-4 text-center">
            No usage data yet
          </p>
        ) : (
          <div className="space-y-3">
            {metrics.topTenantsByUsage.map((tenant, index) => (
              <div
                key={tenant.id}
                className="flex items-center justify-between p-4 rounded-lg bg-[var(--surface-2)]"
              >
                <div className="flex items-center gap-4">
                  <span className="w-6 h-6 rounded-full bg-[var(--surface-3)] flex items-center justify-center text-xs font-medium text-[var(--text-muted)]">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {tenant.name}
                  </span>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {formatNumber(tenant.ai_calls)}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">AI calls</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {formatBytes(tenant.storage)}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">Storage</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
