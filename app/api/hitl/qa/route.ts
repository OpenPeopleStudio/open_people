import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import {
  getQAQueue,
  calculateDisagreementMetrics,
  submitQAReview,
} from "@/lib/hitl/qa-sampling";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/hitl/qa
   Get QA queue and disagreement metrics
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
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

    // 2. Get tenant and verify admin role
    const supabaseAdmin = await createSupabaseAdmin();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    if (profile.role !== "admin" && profile.role !== "super_admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // 3. Parse query params
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") || "queue";
    const limit = parseInt(searchParams.get("limit") || "20");
    const days = parseInt(searchParams.get("days") || "30");

    // 4. Get data based on view
    if (view === "metrics") {
      const metrics = await calculateDisagreementMetrics(profile.tenant_id, days);
      return NextResponse.json({ metrics });
    } else {
      const queue = await getQAQueue(profile.tenant_id, user.id, limit);
      return NextResponse.json({ queue });
    }
  } catch (error) {
    console.error("QA GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/hitl/qa
   Submit a QA review
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

    // 2. Get tenant and verify admin role
    const supabaseAdmin = await createSupabaseAdmin();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    if (profile.role !== "admin" && profile.role !== "super_admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // 3. Parse request
    const body = await request.json();

    if (!body.decision_id) {
      return NextResponse.json(
        { error: "decision_id is required" },
        { status: 400 }
      );
    }
    if (body.was_correct === undefined) {
      return NextResponse.json(
        { error: "was_correct is required" },
        { status: 400 }
      );
    }

    // 4. Submit QA review
    const result = await submitQAReview(
      body.decision_id,
      user.id,
      body.was_correct,
      body.feedback,
      body.correct_decision,
      body.disagreement_reason
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("QA POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
