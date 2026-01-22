import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ReviewWorkbench } from "./ReviewWorkbench";

/* ═══════════════════════════════════════════════════════════════════════════
   HITL Item Review Page
   Side-by-side review interface for human reviewers
   ═══════════════════════════════════════════════════════════════════════════ */

async function getItemData(itemId: string, tenantId: string) {
  const supabase = await createSupabaseAdmin();

  // Get item with full details
  const { data: item, error } = await supabase
    .from("hitl_items")
    .select(`
      *,
      queue:hitl_queues(*),
      policy:hitl_policies(id, name, triggers),
      risk_evaluation:risk_evaluations(*),
      decisions:hitl_decisions(
        *,
        reviewer:profiles!hitl_decisions_reviewer_id_fkey(id, name, avatar_url)
      )
    `)
    .eq("id", itemId)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !item) {
    return null;
  }

  // Get decision options for the queue
  const { data: decisionOptions } = await supabase
    .from("hitl_decision_options")
    .select("*")
    .eq("queue_id", item.queue_id)
    .eq("is_active", true)
    .order("sort_order");

  // Get default decision options if none configured
  const options = decisionOptions?.length
    ? decisionOptions
    : [
        { decision_value: "approve", display_label: "Approve", keyboard_shortcut: "a", color: "green" },
        { decision_value: "reject", display_label: "Reject", keyboard_shortcut: "r", color: "red" },
        { decision_value: "modify", display_label: "Modify", keyboard_shortcut: "m", color: "yellow", requires_modification: true },
        { decision_value: "escalate_further", display_label: "Escalate", keyboard_shortcut: "e", color: "purple" },
      ];

  return {
    item,
    decisionOptions: options,
  };
}

export default async function HITLItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id, role, name")
    .eq("id", user.id)
    .single();

  if (!profile?.tenant_id) {
    redirect("/login");
  }

  const data = await getItemData(itemId, profile.tenant_id);

  if (!data) {
    notFound();
  }

  // Check if user is assigned or admin
  const isAssigned = data.item.assigned_to === user.id;
  const isAdmin = profile.role === "admin" || profile.role === "super_admin";

  if (!isAssigned && !isAdmin) {
    redirect("/admin/hitl");
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)] bg-[var(--surface-1)]">
        <div className="flex items-center gap-4">
          <a
            href="/admin/hitl"
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            Back to Queue
          </a>
          <span className="text-[var(--text-muted)]">/</span>
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">
            Review Item
          </h1>
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              data.item.priority === "urgent"
                ? "bg-[var(--error)]/20 text-[var(--error)]"
                : data.item.priority === "high"
                ? "bg-[var(--warning)]/20 text-[var(--warning)]"
                : "bg-[var(--surface-2)] text-[var(--text-muted)]"
            }`}
          >
            {data.item.priority}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            {data.item.source_type} · {data.item.trigger_type}
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
          <span>Queue: {data.item.queue?.name}</span>
          {data.item.due_at && (
            <span
              className={
                new Date(data.item.due_at) < new Date()
                  ? "text-[var(--error)]"
                  : ""
              }
            >
              Due: {new Date(data.item.due_at).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Main Content - Side by Side */}
      <ReviewWorkbench
        item={data.item}
        decisionOptions={data.decisionOptions}
        isAssigned={isAssigned}
      />
    </div>
  );
}
