import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EXPERIMENT_PLANS } from "@/types/experiments";
import { ExperimentsDashboard } from "./ExperimentsDashboard";

/* ═══════════════════════════════════════════════════════════════════════════
   Tenant Experiments Dashboard
   Manage A/B tests, feature flags, and experimentation
   ═══════════════════════════════════════════════════════════════════════════ */

async function getExperimentsData(tenantId: string) {
  const supabase = await createSupabaseServer();

  // Get subscription
  const { data: subscription } = await supabase
    .from("experiment_subscriptions")
    .select("tier, status, current_period_end")
    .eq("tenant_id", tenantId)
    .single();

  // Get experiments with variants
  const { data: experiments } = await supabase
    .from("experiments")
    .select("*, experiment_variants(*), audiences(name)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  // Get flags
  const { data: flags } = await supabase
    .from("feature_flags")
    .select("*, audiences(name)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  // Get audiences
  const { data: audiences } = await supabase
    .from("audiences")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  // Get current usage
  const today = new Date().toISOString().split("T")[0];
  const { data: usageData } = await supabase
    .from("experiment_usage")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("period_start", today)
    .single();

  // Count active experiments and flags
  const activeExperiments =
    experiments?.filter((e) => e.status === "running").length || 0;
  const activeFlags = flags?.filter((f) => f.enabled).length || 0;

  return {
    subscription: subscription || {
      tier: "free",
      status: "active",
      current_period_end: null,
    },
    experiments: (experiments || []).map((exp) => ({
      ...exp,
      variants: exp.experiment_variants,
      audience: exp.audiences,
    })),
    flags: (flags || []).map((flag) => ({
      ...flag,
      audience: flag.audiences,
    })),
    audiences: audiences || [],
    usage: {
      active_experiments: activeExperiments,
      active_flags: activeFlags,
      total_exposures: usageData?.total_exposures || 0,
      total_conversions: usageData?.total_conversions || 0,
    },
  };
}

export default async function ExperimentsPage() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!profile?.tenant_id) {
    redirect("/login");
  }

  const data = await getExperimentsData(profile.tenant_id);
  const plan =
    EXPERIMENT_PLANS[data.subscription.tier as keyof typeof EXPERIMENT_PLANS] ||
    EXPERIMENT_PLANS.free;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Experiments & Feature Flags
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Run A/B tests and manage feature rollouts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              data.subscription.status === "active"
                ? "bg-[var(--success)]/10 text-[var(--success)]"
                : "bg-[var(--warning)]/10 text-[var(--warning)]"
            }`}
          >
            {plan.name} Plan
          </span>
          <a href="/admin/experiments/upgrade" className="btn-primary text-sm">
            Upgrade Plan
          </a>
        </div>
      </div>

      {/* Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Active Experiments"
          value={`${data.usage.active_experiments}`}
          limit={plan.activeExperiments === -1 ? "∞" : plan.activeExperiments.toString()}
          isLimit={
            plan.activeExperiments !== -1 &&
            data.usage.active_experiments >= plan.activeExperiments
          }
        />
        <StatCard
          label="Feature Flags"
          value={`${data.usage.active_flags}`}
          limit={plan.featureFlags === -1 ? "∞" : plan.featureFlags.toString()}
          isLimit={
            plan.featureFlags !== -1 && data.usage.active_flags >= plan.featureFlags
          }
        />
        <StatCard
          label="Exposures Today"
          value={data.usage.total_exposures.toLocaleString()}
          subtext="Events tracked"
        />
        <StatCard
          label="Conversions Today"
          value={data.usage.total_conversions.toLocaleString()}
          subtext="Goals achieved"
        />
      </div>

      {/* Main Dashboard (Client Component) */}
      <ExperimentsDashboard
        experiments={data.experiments}
        flags={data.flags}
        audiences={data.audiences}
        plan={plan}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  limit,
  isLimit,
  subtext,
}: {
  label: string;
  value: string;
  limit?: string;
  isLimit?: boolean;
  subtext?: string;
}) {
  return (
    <div className="p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
      <p className="text-sm text-[var(--text-muted)]">{label}</p>
      <p
        className={`text-2xl font-semibold mt-2 ${
          isLimit ? "text-[var(--error)]" : "text-[var(--text-primary)]"
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-[var(--text-secondary)] mt-2">
        {limit ? `of ${limit}` : subtext || ""}
      </p>
    </div>
  );
}
