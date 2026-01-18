import { createSupabaseServer } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { SDKConfig } from "@/types/experiments";

/* ═══════════════════════════════════════════════════════════════════════════
   Experiments SDK Config API
   GET /api/experiments/config?tenant_id=xxx - Fetch experiments and flags config
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenant_id");

    if (!tenantId) {
      return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();

    // Get running experiments with variants
    const { data: experiments } = await supabase
      .from("experiments")
      .select(`
        id,
        key,
        type,
        status,
        rollout_percentage,
        audience_id,
        experiment_variants (
          id,
          key,
          weight,
          is_control
        ),
        audiences (
          rules
        )
      `)
      .eq("tenant_id", tenantId)
      .eq("status", "running");

    // Get enabled feature flags
    const { data: flags } = await supabase
      .from("feature_flags")
      .select(`
        id,
        key,
        enabled,
        rollout_percentage,
        audience_id,
        audiences (
          rules
        )
      `)
      .eq("tenant_id", tenantId)
      .eq("enabled", true);

    // Format for SDK
    const config: SDKConfig = {
      experiments: (experiments || []).map((exp) => {
        const audiences = exp.audiences as { rules: unknown } | { rules: unknown }[] | null;
        const audienceRules = Array.isArray(audiences) ? audiences[0]?.rules : audiences?.rules;
        return {
          id: exp.id,
          key: exp.key,
          type: exp.type as "ab_test" | "multivariate" | "feature_flag",
          status: exp.status as "running",
          rollout_percentage: exp.rollout_percentage,
          variants: (exp.experiment_variants || []).map((v) => ({
            id: v.id,
            key: v.key,
            weight: v.weight,
            is_control: v.is_control,
          })),
          audience_rules: audienceRules as SDKConfig["experiments"][0]["audience_rules"],
        };
      }),
      flags: (flags || []).map((flag) => {
        const audiences = flag.audiences as { rules: unknown } | { rules: unknown }[] | null;
        const audienceRules = Array.isArray(audiences) ? audiences[0]?.rules : audiences?.rules;
        return {
          id: flag.id,
          key: flag.key,
          enabled: flag.enabled,
          rollout_percentage: flag.rollout_percentage,
          audience_rules: audienceRules as SDKConfig["flags"][0]["audience_rules"],
        };
      }),
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error("SDK config error:", error);
    return NextResponse.json(
      { error: "Failed to fetch config" },
      { status: 500 }
    );
  }
}
