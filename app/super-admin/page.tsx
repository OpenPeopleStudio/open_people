import { createSupabaseServer } from "@/lib/supabase/server";
import Link from "next/link";
import { DemoSeedButton } from "./DemoSeedButton";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin Dashboard
   Platform overview with real-time stats from Supabase
   ═══════════════════════════════════════════════════════════════════════════ */

type DashboardStats = {
  totalTenants: number;
  activeTenants: number;
  trialingTenants: number;
  totalUsers: number;
  monthlyRevenue: number;
  aiApiCalls: number;
};

type RecentTenant = {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
  billing?: {
    plan: string;
  } | null;
};

const DEMO_STATS: DashboardStats = {
  totalTenants: 42,
  activeTenants: 31,
  trialingTenants: 9,
  totalUsers: 286,
  monthlyRevenue: 12637,
  aiApiCalls: 184_200,
};

const DEMO_TENANTS: RecentTenant[] = [
  {
    id: "demo-tenant-1",
    name: "Acme Capital",
    slug: "acme",
    status: "active",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    billing: { plan: "pro" },
  },
  {
    id: "demo-tenant-2",
    name: "Northwind Labs",
    slug: "northwind",
    status: "trialing",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    billing: { plan: "starter" },
  },
  {
    id: "demo-tenant-3",
    name: "Helios Ops",
    slug: "helios",
    status: "active",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    billing: { plan: "enterprise" },
  },
  {
    id: "demo-tenant-4",
    name: "Juniper & Co",
    slug: "juniper",
    status: "active",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    billing: { plan: "starter" },
  },
  {
    id: "demo-tenant-5",
    name: "Keystone Ventures",
    slug: "keystone",
    status: "trialing",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    billing: { plan: "pro" },
  },
];

const DEMO_ACTIVITY: { action: string; tenant: string; time: string; type: string }[] = [
  {
    action: "New tenant created",
    tenant: "Acme Capital",
    time: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    type: "tenant",
  },
  {
    action: "Domain acme.openpeople.ai verified",
    tenant: "Acme Capital",
    time: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    type: "domain",
  },
  {
    action: "New tenant created",
    tenant: "Northwind Labs",
    time: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
    type: "tenant",
  },
  {
    action: "Domain northwind.openpeople.ai verified",
    tenant: "Northwind Labs",
    time: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
    type: "domain",
  },
  {
    action: "New tenant created",
    tenant: "Helios Ops",
    time: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    type: "tenant",
  },
];

async function getDashboardStats(opts?: { demoMode?: boolean }): Promise<DashboardStats> {
  if (opts?.demoMode) return DEMO_STATS;
  const supabase = await createSupabaseServer();

  // Get tenant counts
  const { count: totalTenants, error: totalTenantsError } = await supabase
    .from("tenants")
    .select("*", { count: "exact", head: true });
  if (totalTenantsError) {
    console.error("Get tenants count error:", totalTenantsError);
    return DEMO_STATS;
  }

  const { count: activeTenants, error: activeTenantsError } = await supabase
    .from("tenants")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");
  if (activeTenantsError) {
    console.error("Get active tenants count error:", activeTenantsError);
    return DEMO_STATS;
  }

  const { count: trialingTenants, error: trialingTenantsError } = await supabase
    .from("tenants")
    .select("*", { count: "exact", head: true })
    .eq("status", "trialing");
  if (trialingTenantsError) {
    console.error("Get trialing tenants count error:", trialingTenantsError);
    return DEMO_STATS;
  }

  // Get total users
  const { count: totalUsers, error: totalUsersError } = await supabase
    .from("709_profiles")
    .select("*", { count: "exact", head: true });
  if (totalUsersError) {
    console.error("Get users count error:", totalUsersError);
    return DEMO_STATS;
  }

  // Get monthly revenue from billing
  const { data: billingData, error: billingError } = await supabase
    .from("tenant_billing")
    .select("plan")
    .in("plan", ["starter", "pro", "enterprise"]);
  if (billingError) {
    console.error("Get billing error:", billingError);
    return DEMO_STATS;
  }

  // Calculate revenue based on plans
  const monthlyRevenue = (billingData || []).reduce((total, billing) => {
    if (billing.plan === "starter") return total + 99;
    if (billing.plan === "pro") return total + 199;
    if (billing.plan === "enterprise") return total + 499; // Assume $499 for enterprise
    return total;
  }, 0);

  // Get AI API calls from usage table (current month)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: usageData, error: usageError } = await supabase
    .from("tenant_usage")
    .select("ai_api_calls")
    .gte("period_start", startOfMonth.toISOString().split("T")[0]);
  if (usageError) {
    console.error("Get usage error:", usageError);
    return DEMO_STATS;
  }

  const aiApiCalls = (usageData || []).reduce(
    (total, usage) => total + (usage.ai_api_calls || 0),
    0
  );

  return {
    totalTenants: totalTenants || 0,
    activeTenants: activeTenants || 0,
    trialingTenants: trialingTenants || 0,
    totalUsers: totalUsers || 0,
    monthlyRevenue,
    aiApiCalls,
  };
}

async function getRecentTenants(opts?: { demoMode?: boolean }): Promise<RecentTenant[]> {
  if (opts?.demoMode) return DEMO_TENANTS;
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("tenants")
    .select(
      `
      id,
      name,
      slug,
      status,
      created_at,
      billing:tenant_billing(plan)
    `
    )
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Get recent tenants error:", error);
    return DEMO_TENANTS;
  }

  return (data || []).map((tenant) => ({
    ...tenant,
    billing: Array.isArray(tenant.billing) ? tenant.billing[0] : tenant.billing,
  }));
}

async function getRecentActivity(opts?: { demoMode?: boolean }) {
  if (opts?.demoMode) return DEMO_ACTIVITY;
  const supabase = await createSupabaseServer();

  // Get recent tenants for activity feed
  const { data: recentTenants, error: recentTenantsError } = await supabase
    .from("tenants")
    .select("name, created_at, status")
    .order("created_at", { ascending: false })
    .limit(10);
  if (recentTenantsError) {
    console.error("Get recent activity tenants error:", recentTenantsError);
    return DEMO_ACTIVITY;
  }

  // Get recent domain verifications
  const { data: recentDomains, error: recentDomainsError } = await supabase
    .from("tenant_domains")
    .select("domain, verified_at, tenant:tenants(name)")
    .not("verified_at", "is", null)
    .order("verified_at", { ascending: false })
    .limit(5);
  if (recentDomainsError) {
    console.error("Get recent domains error:", recentDomainsError);
    return DEMO_ACTIVITY;
  }

  // Combine and sort activities
  const activities: { action: string; tenant: string; time: string; type: string }[] = [];

  (recentTenants || []).forEach((tenant) => {
    activities.push({
      action: "New tenant created",
      tenant: tenant.name,
      time: tenant.created_at,
      type: "tenant",
    });
  });

  (recentDomains || []).forEach((domain) => {
    const tenant = domain.tenant as { name: string } | { name: string }[] | null;
    const tenantName = Array.isArray(tenant)
      ? tenant[0]?.name
      : tenant?.name;
    if (tenantName && domain.verified_at) {
      activities.push({
        action: `Domain ${domain.domain} verified`,
        tenant: tenantName,
        time: domain.verified_at,
        type: "domain",
      });
    }
  });

  // Sort by time and take top 5
  return activities
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 5);
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function SuperAdminDashboard({ searchParams }: PageProps) {
  const demoParam = searchParams?.demo;
  const demoMode =
    demoParam === "1" ||
    demoParam === "true" ||
    (Array.isArray(demoParam) && (demoParam.includes("1") || demoParam.includes("true")));

  const [stats, recentTenants, recentActivity] = await Promise.all([
    getDashboardStats({ demoMode }),
    getRecentTenants({ demoMode }),
    getRecentActivity({ demoMode }),
  ]);

  const statCards = [
    {
      label: "Total Tenants",
      value: stats.totalTenants.toString(),
      subtext: `${stats.activeTenants} active, ${stats.trialingTenants} trialing`,
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
      color: "var(--electric-lime)",
    },
    {
      label: "Total Users",
      value: formatNumber(stats.totalUsers),
      subtext: "Across all tenants",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
      color: "var(--electric-cyan)",
    },
    {
      label: "Monthly Revenue",
      value: `$${formatNumber(stats.monthlyRevenue)}`,
      subtext: "Current billing period",
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      color: "var(--success)",
    },
    {
      label: "AI API Calls",
      value: formatNumber(stats.aiApiCalls),
      subtext: "This billing period",
      icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
      color: "var(--electric-violet)",
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Dashboard
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Platform overview and quick stats
            </p>
          </div>
          <DemoSeedButton demoMode={demoMode} />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[var(--text-muted)]">{stat.label}</p>
                <p className="text-3xl font-semibold text-[var(--text-primary)] mt-2">
                  {stat.value}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-2">
                  {stat.subtext}
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  style={{ color: stat.color }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={stat.icon}
                  />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tenants */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Recent Tenants
            </h2>
            <Link
              href="/super-admin/tenants"
              className="text-xs text-[var(--electric-lime)] hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentTenants.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] py-4 text-center">
                No tenants yet
              </p>
            ) : (
              recentTenants.map((tenant) => (
                <Link
                  key={tenant.id}
                  href={`/super-admin/tenants/${tenant.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[var(--surface-3)] flex items-center justify-center">
                      <span className="text-sm font-semibold text-[var(--text-secondary)]">
                        {tenant.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {tenant.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {tenant.slug}.openpeople.ai
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        tenant.status === "active"
                          ? "bg-[var(--success)]/10 text-[var(--success)]"
                          : tenant.status === "trialing"
                          ? "bg-[var(--warning)]/10 text-[var(--warning)]"
                          : "bg-[var(--error)]/10 text-[var(--error)]"
                      }`}
                    >
                      {tenant.status}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] capitalize">
                      {tenant.billing?.plan || "free"}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] py-4 text-center">
                No recent activity
              </p>
            ) : (
              recentActivity.map((activity, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 pb-4 border-b border-[var(--border-subtle)] last:border-0 last:pb-0"
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === "tenant"
                        ? "bg-[var(--electric-lime)]"
                        : "bg-[var(--electric-cyan)]"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-[var(--text-primary)]">
                      {activity.action}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {activity.tenant} · {formatTimeAgo(activity.time)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Quick actions */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Create Tenant",
                href: "/super-admin/tenants/new",
                icon: "M12 4v16m8-8H4",
              },
              {
                label: "View Analytics",
                href: "/super-admin/analytics",
                icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
              },
              {
                label: "Billing Overview",
                href: "/super-admin/billing",
                icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
              },
              {
                label: "Platform Settings",
                href: "/super-admin/settings",
                icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
              },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--electric-lime)] transition-colors"
              >
                <svg
                  className="w-5 h-5 text-[var(--electric-lime)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={action.icon}
                  />
                </svg>
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        {/* System status */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            System Status
          </h2>
          <div className="space-y-3">
            {[
              { service: "Database (Supabase)", status: "Operational", healthy: true },
              { service: "AI Services", status: "Operational", healthy: true },
              { service: "Payment Processing", status: "Operational", healthy: true },
              { service: "Email Delivery", status: "Operational", healthy: true },
            ].map((service) => (
              <div
                key={service.service}
                className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)]"
              >
                <span className="text-sm text-[var(--text-secondary)]">
                  {service.service}
                </span>
                <span
                  className={`flex items-center gap-2 text-xs font-medium ${
                    service.healthy ? "text-[var(--success)]" : "text-[var(--error)]"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      service.healthy ? "bg-[var(--success)]" : "bg-[var(--error)]"
                    }`}
                  />
                  {service.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
