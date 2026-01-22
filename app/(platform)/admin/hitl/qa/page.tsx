import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { QADashboard } from "./QADashboard";
import { calculateDisagreementMetrics, getQAQueue } from "@/lib/hitl/qa-sampling";

/* ═══════════════════════════════════════════════════════════════════════════
   HITL QA Dashboard
   Quality assurance sampling and disagreement analytics
   ═══════════════════════════════════════════════════════════════════════════ */

export default async function HITLQAPage() {
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
    redirect("/admin/hitl");
  }

  // Get data
  const [metrics, queue] = await Promise.all([
    calculateDisagreementMetrics(profile.tenant_id, 30),
    getQAQueue(profile.tenant_id, user.id, 10),
  ]);

  // Calculate summary stats
  const totalSampled = metrics.reduce((sum, m) => sum + m.total_sampled, 0);
  const totalCorrect = metrics.reduce((sum, m) => sum + m.total_correct, 0);
  const overallAccuracy = totalSampled > 0 ? Math.round((totalCorrect / totalSampled) * 100) : 0;
  const lowAccuracyReviewers = metrics.filter((m) => m.accuracy_rate < 80).length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Reviewer Calibration & QA
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Quality assurance sampling and reviewer accuracy analytics
          </p>
        </div>
        <a
          href="/admin/hitl"
          className="px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          Back to Queue
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Overall Accuracy"
          value={`${overallAccuracy}%`}
          subtext={`${totalCorrect}/${totalSampled} correct`}
          variant={overallAccuracy >= 95 ? "success" : overallAccuracy >= 80 ? "warning" : "error"}
        />
        <StatCard
          label="Total Sampled"
          value={totalSampled.toString()}
          subtext="Last 30 days"
        />
        <StatCard
          label="Active Reviewers"
          value={metrics.length.toString()}
          subtext="With QA reviews"
        />
        <StatCard
          label="Needs Attention"
          value={lowAccuracyReviewers.toString()}
          subtext="< 80% accuracy"
          {...(lowAccuracyReviewers > 0 ? { variant: "warning" } : {})}
        />
      </div>

      {/* Dashboard */}
      <QADashboard
        metrics={metrics}
        qaQueue={queue}
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
  subtext: string;
  variant?: "success" | "warning" | "error";
}) {
  const valueColor = variant
    ? variant === "success"
      ? "text-[var(--success)]"
      : variant === "warning"
      ? "text-[var(--warning)]"
      : "text-[var(--error)]"
    : "text-[var(--text-primary)]";

  return (
    <div className="p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
      <p className="text-sm text-[var(--text-muted)]">{label}</p>
      <p className={`text-2xl font-semibold mt-2 ${valueColor}`}>{value}</p>
      <p className="text-xs text-[var(--text-secondary)] mt-2">{subtext}</p>
    </div>
  );
}
