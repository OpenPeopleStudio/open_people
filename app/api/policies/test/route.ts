import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { evaluatePolicies } from "@/lib/policy/evaluator";
import type { TestBenchRequest, TestBenchResponse } from "@/types/policy";

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/policies/test
   Policy Test Bench - Evaluate a request context against policies
   Returns full decision trace for debugging and understanding
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get user's tenant
    const supabaseAdmin = await createSupabaseAdmin();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // Require admin role for policy testing
    if (profile.role !== "admin" && profile.role !== "super_admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // 3. Parse request
    const body: TestBenchRequest = await request.json();

    if (!body.context) {
      return NextResponse.json(
        { error: "context is required" },
        { status: 400 }
      );
    }

    // 4. Add request_id if not provided
    const context = {
      ...body.context,
      request_id: body.context.request_id || crypto.randomUUID(),
      timestamp: body.context.timestamp || new Date().toISOString(),
    };

    // 5. Evaluate policies
    const evalOptions: { policyIds?: string[]; includeInactive?: boolean; includeTrace?: boolean } = {
      includeTrace: true,
    };
    if (body.policy_ids && body.policy_ids.length > 0) {
      evalOptions.policyIds = body.policy_ids;
    }
    if (body.include_inactive !== undefined) {
      evalOptions.includeInactive = body.include_inactive;
    }

    const trace = await evaluatePolicies(profile.tenant_id, context, evalOptions);

    // 6. Store simulation run for auditing
    await supabaseAdmin.from("policy_simulation_runs").insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      simulation_type: "test",
      input_data: { context, policy_ids: body.policy_ids },
      result_data: {
        decision: trace.decision,
        deciding_policy_id: trace.deciding_policy_id,
        policies_matched: trace.policies_evaluated.filter((p) => p.matched).length,
      },
      status: "completed",
      duration_ms: trace.evaluation_time_ms,
    });

    // 7. Build response
    const summary = {
      decision: trace.decision,
      primary_reason: trace.reasons[0] || "No reason",
      policies_matched: trace.policies_evaluated.filter((p) => p.matched).length,
      policies_evaluated: trace.policies_evaluated.length,
      ...(context.risk_score !== undefined ? { risk_score: context.risk_score } : {}),
      ...(context.risk_level ? { risk_level: context.risk_level } : {}),
    };

    const response: TestBenchResponse = {
      trace,
      summary,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Policy test error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
