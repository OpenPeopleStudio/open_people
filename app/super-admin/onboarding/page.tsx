import { createSupabaseAdmin } from "@/lib/supabase/server";
import { OnboardingList } from "./OnboardingList";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin - Onboarding Submissions
   View all tenant onboarding intake data
   ═══════════════════════════════════════════════════════════════════════════ */

export default async function OnboardingPage() {
  const supabase = await createSupabaseAdmin();

  // Fetch all onboarding submissions with tenant info
  const { data: onboardings, error } = await supabase
    .from("tenant_onboarding")
    .select(`
      *,
      tenants:tenant_id (
        id,
        name,
        slug,
        status
      )
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Failed to load onboarding data:", error);
  }

  // Get summary stats
  const stats = {
    total: onboardings?.length || 0,
    completed: onboardings?.filter((o) => o.status === "completed").length || 0,
    inProgress: onboardings?.filter((o) => o.status === "in_progress").length || 0,
    skipped: onboardings?.filter((o) => o.status === "skipped").length || 0,
    notStarted: onboardings?.filter((o) => o.status === "not_started").length || 0,
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Onboarding Submissions
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Review intake data from tenant signups
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <p className="text-sm text-[var(--text-muted)]">Total</p>
          <p className="text-2xl font-semibold text-[var(--text-primary)] mt-1">
            {stats.total}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <p className="text-sm text-[var(--text-muted)]">Completed</p>
          <p className="text-2xl font-semibold text-[var(--success)] mt-1">
            {stats.completed}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <p className="text-sm text-[var(--text-muted)]">In Progress</p>
          <p className="text-2xl font-semibold text-[var(--warning)] mt-1">
            {stats.inProgress}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <p className="text-sm text-[var(--text-muted)]">Skipped</p>
          <p className="text-2xl font-semibold text-[var(--text-secondary)] mt-1">
            {stats.skipped}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <p className="text-sm text-[var(--text-muted)]">Not Started</p>
          <p className="text-2xl font-semibold text-[var(--text-muted)] mt-1">
            {stats.notStarted}
          </p>
        </div>
      </div>

      {/* List */}
      <OnboardingList onboardings={onboardings || []} />
    </div>
  );
}
