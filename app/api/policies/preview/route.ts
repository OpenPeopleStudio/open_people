import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { previewPolicyChanges } from "@/lib/policy/preview";
import type { ImpactPreviewRequest } from "@/types/policy";

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/policies/preview
   Preview impact of policy changes against historical decisions
   Shows what would flip from allow→deny or deny→allow
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
    const body: ImpactPreviewRequest = await request.json();

    if (!body.changes || body.changes.length === 0) {
      return NextResponse.json(
        { error: "At least one policy change is required" },
        { status: 400 }
      );
    }

    // Validate changes
    for (const change of body.changes) {
      if (change.type === "update" || change.type === "delete") {
        if (!change.policy_id) {
          return NextResponse.json(
            { error: "policy_id required for update/delete changes" },
            { status: 400 }
          );
        }
      }
      if (change.type === "create" || change.type === "update") {
        if (!change.policy) {
          return NextResponse.json(
            { error: "policy definition required for create/update changes" },
            { status: 400 }
          );
        }
      }
    }

    // 4. Run preview
    const startTime = Date.now();
    const preview = await previewPolicyChanges(profile.tenant_id, {
      changes: body.changes,
      days_to_analyze: body.days_to_analyze || 7,
      max_samples: body.max_samples || 100,
    });
    const durationMs = Date.now() - startTime;

    // 5. Store simulation run for auditing
    await supabaseAdmin.from("policy_simulation_runs").insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      simulation_type: "preview",
      input_data: {
        changes: body.changes,
        days_to_analyze: body.days_to_analyze,
      },
      result_data: {
        summary: preview.summary,
        risk_assessment: preview.risk_assessment,
      },
      status: "completed",
      duration_ms: durationMs,
    });

    return NextResponse.json(preview);
  } catch (error) {
    console.error("Policy preview error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
