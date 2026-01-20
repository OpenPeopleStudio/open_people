import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { evaluateAndStoreRisk } from "@/lib/risk/aggregator";
import type { RiskEvaluateRequest, RiskEvaluateResponse } from "@/types/policy";

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/risk/evaluate
   Evaluate risk signals and return aggregated risk assessment
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
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    // 3. Parse request
    const body: RiskEvaluateRequest = await request.json();

    if (!body.signals || !Array.isArray(body.signals)) {
      return NextResponse.json(
        { error: "signals array is required" },
        { status: 400 }
      );
    }

    // Validate signals
    for (const signal of body.signals) {
      if (typeof signal.type !== "string") {
        return NextResponse.json(
          { error: "Each signal must have a type" },
          { status: 400 }
        );
      }
      if (typeof signal.score !== "number" || signal.score < 0 || signal.score > 100) {
        return NextResponse.json(
          { error: "Each signal must have a score between 0 and 100" },
          { status: 400 }
        );
      }
    }

    // 4. Evaluate risk
    const evaluation = await evaluateAndStoreRisk(profile.tenant_id, {
      request_id: body.request_id,
      signals: body.signals,
      profile_id: body.profile_id,
      context: body.context,
    });

    // 5. Build response
    const response: RiskEvaluateResponse = {
      evaluation,
      profile_used: evaluation.profile_id || "default",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Risk evaluate error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/risk/evaluate
   Get recent risk evaluations for analysis
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
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

    // 3. Parse query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const riskLevel = searchParams.get("risk_level");
    const shouldEscalate = searchParams.get("should_escalate");

    // 4. Build query
    let query = supabaseAdmin
      .from("risk_evaluations")
      .select("*")
      .eq("tenant_id", profile.tenant_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (riskLevel) {
      query = query.eq("risk_level", riskLevel);
    }
    if (shouldEscalate === "true") {
      query = query.eq("should_escalate", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch evaluations" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      evaluations: data || [],
      pagination: {
        limit,
        offset,
        total: data?.length || 0, // Would need count query for true total
      },
    });
  } catch (error) {
    console.error("Risk evaluate GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
