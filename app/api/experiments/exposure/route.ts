import { createSupabaseServer } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { EXPERIMENT_PLANS, isEventLimitExceeded } from "@/types/experiments";

/* ═══════════════════════════════════════════════════════════════════════════
   Exposure Events API
   POST /api/experiments/exposure - Track experiment/flag exposure
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const body = await request.json();

    const {
      tenant_id,
      experiment_id,
      flag_id,
      variant_id,
      user_id,
      anonymous_id,
      session_id,
      attributes,
    } = body;

    if (!tenant_id) {
      return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });
    }

    if (!experiment_id && !flag_id) {
      return NextResponse.json(
        { error: "Either experiment_id or flag_id is required" },
        { status: 400 }
      );
    }

    // Check subscription and limits
    const { data: subscription } = await supabase
      .from("experiment_subscriptions")
      .select("tier, status")
      .eq("tenant_id", tenant_id)
      .single();

    const tier = subscription?.tier || "free";
    const plan = EXPERIMENT_PLANS[tier as keyof typeof EXPERIMENT_PLANS];

    // Check event limit (current day)
    const today = new Date().toISOString().split("T")[0];
    const { data: usageData } = await supabase
      .from("experiment_usage")
      .select("total_exposures")
      .eq("tenant_id", tenant_id)
      .eq("period_start", today)
      .single();

    const currentExposures = usageData?.total_exposures || 0;

    if (isEventLimitExceeded(currentExposures, plan)) {
      return NextResponse.json(
        { error: "Daily event limit exceeded. Upgrade your plan." },
        { status: 429 }
      );
    }

    // Track exposure event
    const { error } = await supabase.from("exposure_events").insert({
      tenant_id,
      experiment_id: experiment_id || null,
      flag_id: flag_id || null,
      variant_id: variant_id || null,
      user_id: user_id || null,
      anonymous_id: anonymous_id || null,
      session_id: session_id || null,
      attributes: attributes || {},
    });

    if (error) {
      console.error("Exposure tracking error:", error);
      return NextResponse.json(
        { error: "Failed to track exposure" },
        { status: 500 }
      );
    }

    // Update usage
    await supabase.rpc("increment_experiment_usage", {
      p_tenant_id: tenant_id,
      p_period_start: today,
      p_field: "total_exposures",
      p_increment: 1,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Exposure API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
