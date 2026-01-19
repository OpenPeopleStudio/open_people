import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getCostSummary, checkBudget, setBudget } from "@/lib/workflows/observability";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/ai/costs
   Get cost summary and budget status
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") || "month") as "day" | "week" | "month";
    
    const [costSummary, budgetStatus] = await Promise.all([
      getCostSummary(supabase, user.id, period),
      checkBudget(supabase, user.id),
    ]);
    
    return NextResponse.json({
      costs: costSummary,
      budget: budgetStatus,
    });
    
  } catch (error) {
    console.error("Cost fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/ai/costs/budget
   Set or update budget
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    
    if (!body.period_type || !body.budget_cents) {
      return NextResponse.json({ error: "period_type and budget_cents are required" }, { status: 400 });
    }
    
    const budget = await setBudget(supabase, user.id, {
      periodType: body.period_type,
      budgetCents: body.budget_cents,
      alertThresholdPercent: body.alert_threshold_percent,
      onExceed: body.on_exceed,
    });
    
    if (!budget) {
      return NextResponse.json({ error: "Failed to set budget" }, { status: 500 });
    }
    
    return NextResponse.json({ budget });
    
  } catch (error) {
    console.error("Budget set error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
