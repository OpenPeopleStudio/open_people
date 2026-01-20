/**
 * POST /api/ai/jobs/quality-slices
 * 
 * Background job to compute quality slices
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { computeQualitySlices, storeQualitySlices } from "@/lib/observability/quality";

// This endpoint should be called by a cron job or background worker
// Protect with a secret header in production
const JOB_SECRET = process.env.INTERNAL_JOB_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Verify job secret
    const secret = request.headers.get("x-job-secret");
    if (JOB_SECRET && secret !== JOB_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const tenantId = body.tenant_id;

    if (!tenantId) {
      return NextResponse.json(
        { error: "Missing tenant_id" },
        { status: 400 }
      );
    }

    // Default to last 24 hours
    const windowEnd = body.window_end ? new Date(body.window_end) : new Date();
    const windowStart = body.window_start
      ? new Date(body.window_start)
      : new Date(windowEnd.getTime() - 24 * 60 * 60 * 1000);

    const groupBy = body.group_by || ["application_id", "model_name", "prompt_version"];

    // Compute slices
    const slices = await computeQualitySlices(
      tenantId,
      windowStart,
      windowEnd,
      groupBy
    );

    if (slices.length === 0) {
      return NextResponse.json({
        message: "No slices to compute",
        slices_computed: 0,
      });
    }

    // Store slices
    await storeQualitySlices(slices);

    // Check for alert-worthy slices
    const alertableSlices = slices.filter(
      (s) => s.low_quality_rate > 0.2 || (s.avg_quality_score && s.avg_quality_score < 0.6)
    );

    if (alertableSlices.length > 0) {
      // Create alerts for high low-quality rate slices
      const supabase = await createSupabaseAdmin();

      for (const slice of alertableSlices) {
        await supabase.from("quality_alerts").insert({
          tenant_id: tenantId,
          alert_type: slice.low_quality_rate > 0.2 ? "low_quality" : "quality_drop",
          severity: slice.low_quality_rate > 0.3 ? "high" : "medium",
          title: `High low-quality rate in ${JSON.stringify(slice.slice_key)}`,
          description: `${(slice.low_quality_rate * 100).toFixed(1)}% low-quality rate detected`,
          application_id: slice.slice_key.application_id,
          model_name: slice.slice_key.model_name,
          trigger_value: slice.low_quality_rate,
          threshold_value: 0.2,
          sample_score_ids: slice.sample_run_ids,
        });

        // Mark slice as alert generated
        await supabase
          .from("quality_slices")
          .update({ alert_generated: true })
          .eq("id", slice.id);
      }
    }

    return NextResponse.json({
      message: "Quality slices computed",
      slices_computed: slices.length,
      alerts_generated: alertableSlices.length,
    });
  } catch (error) {
    console.error("Error computing quality slices:", error);
    return NextResponse.json(
      { error: "Failed to compute quality slices" },
      { status: 500 }
    );
  }
}
