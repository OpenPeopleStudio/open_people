import { createSupabaseServer } from "@/lib/supabase/server";
import { EXPERIMENT_PLANS } from "@/types/experiments";
import { SuperAdminExperimentsDashboard } from "./SuperAdminExperimentsDashboard";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin - Experiments Management
   Manage A/B tests, feature flags, and experimentation across all tenants
   ═══════════════════════════════════════════════════════════════════════════ */

async function getAllExperimentsData() {
  const supabase = await createSupabaseServer();

  // Get all tenants for the selector
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, name, status")
    .order("name", { ascending: true });

  // Get all experiments with tenant info
  const { data: experiments } = await supabase
    .from("experiments")
    .select("*, experiment_variants(*), tenant:tenants(id, name)")
    .order("created_at", { ascending: false });

  // Get all flags with tenant info
  const { data: flags } = await supabase
    .from("feature_flags")
    .select("*, tenant:tenants(id, name)")
    .order("created_at", { ascending: false });

  // Get all audiences with tenant info
  const { data: audiences } = await supabase
    .from("audiences")
    .select("*, tenant:tenants(id, name)")
    .order("created_at", { ascending: false });

  // Get subscriptions
  const { data: subscriptions } = await supabase
    .from("experiment_subscriptions")
    .select("*, tenant:tenants(id, name)")
    .order("created_at", { ascending: false });

  // Get today's usage
  const today = new Date().toISOString().split("T")[0];
  const { data: usageData } = await supabase
    .from("experiment_usage")
    .select("*")
    .eq("period_start", today);

  // Aggregate usage stats
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

  return {
    tenants: tenants || [],
    experiments: (experiments || []).map((exp) => ({
      ...exp,
      variants: exp.experiment_variants,
      tenant_name: Array.isArray(exp.tenant) ? exp.tenant[0]?.name : exp.tenant?.name,
    })),
    flags: (flags || []).map((flag) => ({
      ...flag,
      tenant_name: Array.isArray(flag.tenant) ? flag.tenant[0]?.name : flag.tenant?.name,
    })),
    audiences: (audiences || []).map((audience) => ({
      ...audience,
      tenant_name: Array.isArray(audience.tenant) ? audience.tenant[0]?.name : audience.tenant?.name,
    })),
    subscriptions: (subscriptions || []).map((sub) => ({
      ...sub,
      tenant_name: Array.isArray(sub.tenant) ? sub.tenant[0]?.name : sub.tenant?.name,
    })),
    usage: {
      total_exposures: totalExposures,
      total_conversions: totalConversions,
      active_experiments: totalActiveExperiments,
      active_flags: totalActiveFlags,
    },
  };
}

export default async function SuperAdminExperimentsPage() {
  const data = await getAllExperimentsData();

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Experiments & Feature Flags
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Manage A/B tests and feature flags across all tenants
          </p>
        </div>
      </div>

      {/* Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Active Experiments"
          value={data.usage.active_experiments.toString()}
          subtext="Across all tenants"
          color="var(--electric-lime)"
          icon="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232 1.232 3.23 0 4.462s-3.23 1.232-4.462 0L13.5 17.921"
        />
        <StatCard
          label="Feature Flags"
          value={data.usage.active_flags.toString()}
          subtext="Currently enabled"
          color="var(--electric-cyan)"
          icon="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5"
        />
        <StatCard
          label="Exposures Today"
          value={data.usage.total_exposures.toLocaleString()}
          subtext="Events tracked"
          color="var(--electric-violet)"
          icon="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
        />
        <StatCard
          label="Conversions Today"
          value={data.usage.total_conversions.toLocaleString()}
          subtext="Goals achieved"
          color="var(--success)"
          icon="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </div>

      {/* Main Dashboard (Client Component) */}
      <SuperAdminExperimentsDashboard
        tenants={data.tenants}
        experiments={data.experiments}
        flags={data.flags}
        audiences={data.audiences}
        subscriptions={data.subscriptions}
        plans={EXPERIMENT_PLANS}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
  color,
  icon,
}: {
  label: string;
  value: string;
  subtext: string;
  color: string;
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
          <p className="text-xs text-[var(--text-secondary)] mt-2">{subtext}</p>
        </div>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            style={{ color }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
      </div>
    </div>
  );
}
