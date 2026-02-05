import { createSupabaseServer } from "@/lib/supabase/server";
import Link from "next/link";
import { TenantsTable } from "./TenantsTable";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin - Tenants List
   Server component that fetches all tenants
   ═══════════════════════════════════════════════════════════════════════════ */

export type TenantWithBilling = {
  id: string;
  name: string;
  slug: string;
  status: string;
  primary_domain: string | null;
  created_at: string;
  settings: Record<string, unknown> | null;
  billing: {
    plan: string;
    status: string;
  } | null;
  domains: {
    domain: string;
    verified_at: string | null;
  }[];
  _count: {
    users: number;
  };
};

async function getTenants(): Promise<TenantWithBilling[]> {
  const supabase = await createSupabaseServer();

  const { data: tenants, error } = await supabase
    .from("tenants")
    .select(
      `
      id,
      name,
      slug,
      status,
      primary_domain,
      created_at,
      settings,
      billing:tenant_billing(plan, status),
      domains:tenant_domains(domain, verified_at)
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tenants:", error);
    return [];
  }

  // Get user counts for each tenant
  const tenantsWithCounts = await Promise.all(
    (tenants || []).map(async (tenant) => {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenant.id);

      return {
        ...tenant,
        billing: Array.isArray(tenant.billing)
          ? tenant.billing[0] || null
          : tenant.billing,
        domains: tenant.domains || [],
        _count: {
          users: count || 0,
        },
      };
    })
  );

  return tenantsWithCounts;
}

async function getTenantStats() {
  const supabase = await createSupabaseServer();

  const [
    { count: total },
    { count: active },
    { count: trialing },
    { count: suspended },
  ] = await Promise.all([
    supabase.from("tenants").select("*", { count: "exact", head: true }),
    supabase
      .from("tenants")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("tenants")
      .select("*", { count: "exact", head: true })
      .eq("status", "trialing"),
    supabase
      .from("tenants")
      .select("*", { count: "exact", head: true })
      .eq("status", "suspended"),
  ]);

  return {
    total: total || 0,
    active: active || 0,
    trialing: trialing || 0,
    suspended: suspended || 0,
  };
}

export default async function SuperAdminTenantsPage() {
  const [tenants, stats] = await Promise.all([getTenants(), getTenantStats()]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Tenants
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Manage all tenant organizations on the platform
          </p>
        </div>
        <Link href="/super-admin/tenants/new" className="btn-primary text-sm">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create tenant
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: stats.total, color: "var(--text-primary)" },
          { label: "Active", value: stats.active, color: "var(--success)" },
          { label: "Trialing", value: stats.trialing, color: "var(--warning)" },
          { label: "Suspended", value: stats.suspended, color: "var(--error)" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]"
          >
            <p className="text-sm text-[var(--text-muted)]">{stat.label}</p>
            <p
              className="text-2xl font-semibold mt-1"
              style={{ color: stat.color }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tenants Table (Client Component for interactivity) */}
      <TenantsTable tenants={tenants} />
    </div>
  );
}
