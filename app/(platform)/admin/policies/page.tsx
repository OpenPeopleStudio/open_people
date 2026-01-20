import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PoliciesDashboard } from "./PoliciesDashboard";

/* ═══════════════════════════════════════════════════════════════════════════
   Policy Management Dashboard
   List, create, and manage policies
   ═══════════════════════════════════════════════════════════════════════════ */

async function getPoliciesData(tenantId: string) {
  const supabase = await createSupabaseServer();

  // Get policies with counts
  const { data: policies } = await supabase
    .from("policies")
    .select(`
      *,
      subjects:policy_subjects(count),
      resources:policy_resources(count),
      conditions:policy_conditions(count)
    `)
    .eq("tenant_id", tenantId)
    .order("priority", { ascending: false });

  // Get recent decisions for stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { data: decisionsToday } = await supabase
    .from("policy_decisions")
    .select("id, decision")
    .eq("tenant_id", tenantId)
    .gte("created_at", today.toISOString());

  // Get latest lint result
  const { data: latestLint } = await supabase
    .from("policy_lint_results")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const stats = {
    total_policies: policies?.length || 0,
    active_policies: policies?.filter((p) => p.is_active).length || 0,
    decisions_today: decisionsToday?.length || 0,
    allows_today: decisionsToday?.filter((d) => d.decision === "allow").length || 0,
    denies_today: decisionsToday?.filter((d) => d.decision === "deny").length || 0,
    lint_errors: latestLint?.errors_count || 0,
    lint_warnings: latestLint?.warnings_count || 0,
  };

  return {
    policies: (policies || []).map((p) => ({
      ...p,
      subject_count: p.subjects?.[0]?.count || 0,
      resource_count: p.resources?.[0]?.count || 0,
      condition_count: p.conditions?.[0]?.count || 0,
    })),
    stats,
  };
}

export default async function PoliciesPage() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.tenant_id) {
    redirect("/login");
  }

  // Require admin access
  if (profile.role !== "admin" && profile.role !== "super_admin") {
    redirect("/admin");
  }

  const data = await getPoliciesData(profile.tenant_id);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Policy Engine
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Define and enforce organization-wide AI usage policies
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/admin/policies/test-bench"
            className="px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Test Bench
          </a>
          <a href="/admin/policies/new" className="btn-primary text-sm">
            Create Policy
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        <StatCard
          label="Total Policies"
          value={data.stats.total_policies.toString()}
        />
        <StatCard
          label="Active"
          value={data.stats.active_policies.toString()}
          variant="success"
        />
        <StatCard
          label="Decisions Today"
          value={data.stats.decisions_today.toString()}
        />
        <StatCard
          label="Allows"
          value={data.stats.allows_today.toString()}
          variant="success"
        />
        <StatCard
          label="Denies"
          value={data.stats.denies_today.toString()}
          variant="error"
        />
        <StatCard
          label="Lint Issues"
          value={`${data.stats.lint_errors}/${data.stats.lint_warnings}`}
          subtext="errors/warnings"
          variant={data.stats.lint_errors > 0 ? "error" : data.stats.lint_warnings > 0 ? "warning" : undefined}
        />
      </div>

      {/* Main Dashboard */}
      <PoliciesDashboard
        policies={data.policies}
        tenantId={profile.tenant_id}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
  variant,
}: {
  label: string;
  value: string;
  subtext?: string;
  variant?: "success" | "error" | "warning";
}) {
  const valueColor = variant
    ? variant === "success"
      ? "text-[var(--success)]"
      : variant === "error"
      ? "text-[var(--error)]"
      : "text-[var(--warning)]"
    : "text-[var(--text-primary)]";

  return (
    <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className={`text-xl font-semibold mt-1 ${valueColor}`}>{value}</p>
      {subtext && (
        <p className="text-xs text-[var(--text-muted)] mt-1">{subtext}</p>
      )}
    </div>
  );
}
