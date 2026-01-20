import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { lintPolicies, lintSinglePolicy } from "@/lib/policy/lint";
import type { LintRequest, PolicyWithRelations } from "@/types/policy";

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/policies/lint
   Lint policies for conflicts, shadowed rules, unreachable conditions, etc.
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

    // Require admin role
    if (profile.role !== "admin" && profile.role !== "super_admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // 3. Parse request
    const body: LintRequest = await request.json();

    // 4. Run lint
    const startTime = Date.now();
    const lintResult = await lintPolicies(profile.tenant_id, {
      policyIds: body.policy_ids,
      includeInactive: body.include_inactive,
    });
    const durationMs = Date.now() - startTime;

    // 5. Store simulation run for auditing
    await supabaseAdmin.from("policy_simulation_runs").insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      simulation_type: "lint",
      input_data: { policy_ids: body.policy_ids },
      result_data: {
        summary: lintResult.summary,
        passed: lintResult.passed,
        issue_count: lintResult.issues.length,
      },
      status: "completed",
      duration_ms: durationMs,
    });

    return NextResponse.json(lintResult);
  } catch (error) {
    console.error("Policy lint error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   PUT /api/policies/lint
   Lint a single policy draft (for editor validation)
   ═══════════════════════════════════════════════════════════════════════════ */

export async function PUT(request: NextRequest) {
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

    // Require admin role
    if (profile.role !== "admin" && profile.role !== "super_admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // 3. Parse request - expects full policy draft
    const body: { policy: PolicyWithRelations } = await request.json();

    if (!body.policy) {
      return NextResponse.json(
        { error: "policy definition required" },
        { status: 400 }
      );
    }

    // Ensure tenant_id is set
    const policyToLint: PolicyWithRelations = {
      ...body.policy,
      tenant_id: profile.tenant_id,
    };

    // 4. Lint single policy
    const issues = await lintSinglePolicy(profile.tenant_id, policyToLint);

    // 5. Build response
    const errors = issues.filter((i) => i.severity === "error").length;
    const warnings = issues.filter((i) => i.severity === "warning").length;
    const info = issues.filter((i) => i.severity === "info").length;

    return NextResponse.json({
      issues,
      summary: {
        errors,
        warnings,
        info,
        policies_analyzed: 1,
      },
      passed: errors === 0,
    });
  } catch (error) {
    console.error("Policy lint error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
