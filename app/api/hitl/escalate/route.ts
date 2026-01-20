import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { escalateToHITL, forceEscalate, type EscalationRequest } from "@/lib/hitl/escalation";

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/hitl/escalate
   Escalate an item to human review
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

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
    const body = await request.json();

    // Validate required fields
    if (!body.source_type) {
      return NextResponse.json(
        { error: "source_type is required" },
        { status: 400 }
      );
    }
    if (!body.input || !body.output) {
      return NextResponse.json(
        { error: "input and output are required" },
        { status: 400 }
      );
    }

    const escalationRequest: EscalationRequest = {
      source_type: body.source_type,
      source_id: body.source_id,
      audit_log_id: body.audit_log_id,
      application_id: body.application_id,
      input: body.input,
      output: body.output,
      context: body.context,
      ai_decision: body.ai_decision,
      confidence: body.confidence,
      risk_evaluation: body.risk_evaluation,
      policy_triggers: body.policy_triggers,
      kb_sources: body.kb_sources,
      user_metadata: body.user_metadata,
      force_queue_id: body.queue_id,
      force_priority: body.priority,
    };

    // 4. Check if this is a force escalation
    let result;
    if (body.force && body.queue_id && body.reason) {
      result = await forceEscalate(
        profile.tenant_id,
        body.queue_id,
        escalationRequest,
        body.reason
      );
    } else {
      result = await escalateToHITL(profile.tenant_id, escalationRequest);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Escalation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
