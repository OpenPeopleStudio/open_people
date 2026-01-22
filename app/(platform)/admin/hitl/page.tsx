import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { HITLDashboard } from "./HITLDashboard";

/* ═══════════════════════════════════════════════════════════════════════════
   HITL Review Dashboard
   Human-in-the-loop review queue and management
   ═══════════════════════════════════════════════════════════════════════════ */

async function getHITLData(tenantId: string, userId: string) {
  const supabase = await createSupabaseServer();

  // Get queues
  const { data: queues } = await supabase
    .from("hitl_queues")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  // Get pending items count per queue
  const { data: itemCounts } = await supabase
    .from("hitl_items")
    .select("queue_id, status")
    .eq("tenant_id", tenantId)
    .in("status", ["pending", "assigned", "in_review"]);

  // Get my assigned items
  const { data: myItems } = await supabase
    .from("hitl_items")
    .select(`
      *,
      queue:hitl_queues(id, name)
    `)
    .eq("tenant_id", tenantId)
    .eq("assigned_to", userId)
    .in("status", ["assigned", "in_review"])
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(10);

  // Get recent decisions by user
  const { data: recentDecisions } = await supabase
    .from("hitl_decisions")
    .select(`
      *,
      item:hitl_items(id, source_type, review_content)
    `)
    .eq("reviewer_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  // Calculate stats
  const queueStats =
    queues?.map((q) => {
      const items = itemCounts?.filter((i) => i.queue_id === q.id) || [];
      return {
        ...q,
        pending: items.filter((i) => i.status === "pending").length,
        in_progress: items.filter((i) => ["assigned", "in_review"].includes(i.status))
          .length,
      };
    }) || [];

  return {
    queues: queueStats,
    myItems: myItems || [],
    recentDecisions: recentDecisions || [],
    stats: {
      total_pending: itemCounts?.filter((i) => i.status === "pending").length || 0,
      my_assigned: myItems?.length || 0,
      reviewed_today: recentDecisions?.filter(
        (d) =>
          new Date(d.created_at).toDateString() === new Date().toDateString()
      ).length || 0,
    },
  };
}

export default async function HITLPage() {
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

  const data = await getHITLData(profile.tenant_id, user.id);
  const isAdmin = profile.role === "admin" || profile.role === "super_admin";

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Review Queue
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Review and approve AI decisions requiring human judgment
          </p>
        </div>
        {isAdmin && (
          <a
            href="/admin/hitl/settings"
            className="px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Settings
          </a>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Pending Review"
          value={data.stats.total_pending.toString()}
          subtext="Items awaiting review"
          {...(data.stats.total_pending > 10 ? { variant: "warning" } : {})}
        />
        <StatCard
          label="My Assigned"
          value={data.stats.my_assigned.toString()}
          subtext="Items assigned to you"
        />
        <StatCard
          label="Reviewed Today"
          value={data.stats.reviewed_today.toString()}
          subtext="Decisions made"
          variant="success"
        />
      </div>

      {/* Dashboard */}
      <HITLDashboard
        queues={data.queues}
        myItems={data.myItems}
        recentDecisions={data.recentDecisions}
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
