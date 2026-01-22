import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TestBenchDashboard } from "./TestBenchDashboard";

/* ═══════════════════════════════════════════════════════════════════════════
   Policy Test Bench
   Evaluate request contexts against policies to understand decisions
   ═══════════════════════════════════════════════════════════════════════════ */

async function getTestBenchData(tenantId: string) {
  const supabase = await createSupabaseServer();

  // Get recent decisions for quick-load presets
  const { data: recentDecisions } = await supabase
    .from("policy_decisions")
    .select("id, request_id, decision, deciding_policy_id, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(10);

  // Get active policies for reference
  const { data: policies } = await supabase
    .from("policies")
    .select("id, name, policy_type, effect, priority, is_active")
    .eq("tenant_id", tenantId)
    .order("priority", { ascending: false });

  // Get recent simulation runs
  const { data: simulations } = await supabase
    .from("policy_simulation_runs")
    .select("id, simulation_type, result_data, created_at")
    .eq("tenant_id", tenantId)
    .eq("simulation_type", "test")
    .order("created_at", { ascending: false })
    .limit(5);

  return {
    recentDecisions: recentDecisions || [],
    policies: policies || [],
    recentSimulations: simulations || [],
  };
}

export default async function PolicyTestBenchPage() {
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

  const data = await getTestBenchData(profile.tenant_id);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Policy Test Bench
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Evaluate request contexts to understand policy decisions
          </p>
        </div>
        <a
          href="/admin/policies"
          className="px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          Back to Policies
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Active Policies"
          value={data.policies.filter((p) => p.is_active).length.toString()}
          subtext="Policies in effect"
        />
        <StatCard
          label="Recent Decisions"
          value={data.recentDecisions.length.toString()}
          subtext="In last 24 hours"
        />
        <StatCard
          label="Test Runs"
          value={data.recentSimulations.length.toString()}
          subtext="Recent simulations"
        />
      </div>

      {/* Main Dashboard */}
      <TestBenchDashboard
        policies={data.policies}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <div className="p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
      <p className="text-sm text-[var(--text-muted)]">{label}</p>
      <p className="text-2xl font-semibold text-[var(--text-primary)] mt-2">
        {value}
      </p>
      <p className="text-xs text-[var(--text-secondary)] mt-2">{subtext}</p>
    </div>
  );
}
