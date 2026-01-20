import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/hitl/items/:itemId/decision
   Submit a reviewer decision for an item
   ═══════════════════════════════════════════════════════════════════════════ */

type DecisionRequest = {
  decision: "approve" | "reject" | "modify" | "escalate_further" | "create_rule" | "open_incident";
  modified_output?: string;
  decision_reason?: string;
  decision_tags?: string[];
  ai_was_correct?: boolean;
  review_started_at?: string;
  
  // Actions to take
  actions?: Array<{
    type: "create_guardrail" | "create_eval_case" | "open_incident";
    data?: Record<string, unknown>;
  }>;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const supabase = await createSupabaseServer();
    const { itemId } = await params;

    // 1. Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get tenant
    const supabaseAdmin = await createSupabaseAdmin();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // 3. Parse request
    const body: DecisionRequest = await request.json();

    if (!body.decision) {
      return NextResponse.json(
        { error: "decision is required" },
        { status: 400 }
      );
    }

    // 4. Verify item exists and is assigned to this user
    const { data: item, error: itemError } = await supabaseAdmin
      .from("hitl_items")
      .select("*")
      .eq("id", itemId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (itemError || !item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.assigned_to !== user.id) {
      return NextResponse.json(
        { error: "Item must be assigned to you to submit a decision" },
        { status: 403 }
      );
    }

    if (item.status === "completed") {
      return NextResponse.json(
        { error: "Item has already been completed" },
        { status: 400 }
      );
    }

    // 5. Calculate review duration
    const reviewStarted = body.review_started_at
      ? new Date(body.review_started_at)
      : item.assigned_at
      ? new Date(item.assigned_at)
      : new Date();
    const reviewDuration = Math.round(
      (Date.now() - reviewStarted.getTime()) / 1000
    );

    // 6. Process actions if any
    const actionsTaken: Array<{ type: string; id?: string }> = [];

    if (body.actions && body.actions.length > 0) {
      for (const action of body.actions) {
        switch (action.type) {
          case "create_guardrail":
            // Would integrate with guardrails system
            actionsTaken.push({ type: "create_guardrail" });
            break;
          case "create_eval_case":
            // Would integrate with eval system
            actionsTaken.push({ type: "create_eval_case" });
            break;
          case "open_incident":
            // Would integrate with incident system
            actionsTaken.push({ type: "open_incident" });
            break;
        }
      }
    }

    // 7. Create decision record
    const { data: decision, error: decisionError } = await supabaseAdmin
      .from("hitl_decisions")
      .insert({
        item_id: itemId,
        reviewer_id: user.id,
        decision: body.decision,
        modified_output: body.modified_output,
        decision_reason: body.decision_reason,
        decision_tags: body.decision_tags || [],
        ai_was_correct: body.ai_was_correct,
        actions_taken: actionsTaken,
        review_started_at: reviewStarted.toISOString(),
        review_duration_seconds: reviewDuration,
      })
      .select()
      .single();

    if (decisionError) {
      console.error("Decision create error:", decisionError);
      return NextResponse.json(
        { error: "Failed to record decision" },
        { status: 500 }
      );
    }

    // 8. Update item status
    const newStatus =
      body.decision === "escalate_further" ? "pending" : "completed";

    await supabaseAdmin
      .from("hitl_items")
      .update({
        status: newStatus,
        assigned_to: body.decision === "escalate_further" ? null : item.assigned_to,
      })
      .eq("id", itemId);

    // 9. Update reviewer metrics (async, don't wait)
    updateReviewerMetrics(
      supabaseAdmin,
      profile.tenant_id,
      user.id,
      body.decision,
      reviewDuration
    ).catch(console.error);

    return NextResponse.json({
      decision,
      item_status: newStatus,
      actions_taken: actionsTaken,
    });
  } catch (error) {
    console.error("HITL decision error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Update Reviewer Metrics
// ─────────────────────────────────────────────────────────────────────────────

async function updateReviewerMetrics(
  supabase: Awaited<ReturnType<typeof createSupabaseAdmin>>,
  tenantId: string,
  reviewerId: string,
  decision: string,
  durationSeconds: number
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get or create today's metrics record
  const { data: existing } = await supabase
    .from("hitl_reviewer_metrics")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("reviewer_id", reviewerId)
    .eq("bucket_timestamp", today.toISOString())
    .eq("bucket_interval", "day")
    .single();

  if (existing) {
    // Update existing
    const currentDistribution = (existing.decision_distribution || {}) as Record<
      string,
      number
    >;
    currentDistribution[decision] = (currentDistribution[decision] || 0) + 1;

    const newCount = existing.items_reviewed + 1;
    const newAvg = Math.round(
      ((existing.avg_review_seconds || 0) * existing.items_reviewed +
        durationSeconds) /
        newCount
    );

    await supabase
      .from("hitl_reviewer_metrics")
      .update({
        items_reviewed: newCount,
        avg_review_seconds: newAvg,
        decision_distribution: currentDistribution,
      })
      .eq("id", existing.id);
  } else {
    // Create new
    await supabase.from("hitl_reviewer_metrics").insert({
      tenant_id: tenantId,
      reviewer_id: reviewerId,
      bucket_timestamp: today.toISOString(),
      bucket_interval: "day",
      items_reviewed: 1,
      avg_review_seconds: durationSeconds,
      decision_distribution: { [decision]: 1 },
    });
  }
}
