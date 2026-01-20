/**
 * POST /api/ai/jobs/cost-anomalies
 * 
 * Background job to detect cost anomalies and correlate with changes
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import {
  detectAndCorrelateAnomalies,
  computeCostOutcomeMetrics,
  storeCostOutcomeMetrics,
} from "@/lib/observability/cost";
import { dispatchNotificationEvent } from "@/lib/notifications/events";

// This endpoint should be called by a cron job or background worker
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

    const supabase = await createSupabaseAdmin();

    // Step 1: Compute cost-outcome metrics for recent periods
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const metrics = await computeCostOutcomeMetrics(
      tenantId,
      hourAgo,
      now,
      "hour"
    );

    if (metrics) {
      await storeCostOutcomeMetrics([metrics]);
    }

    // Step 2: Detect anomalies and correlate with changes
    const correlations = await detectAndCorrelateAnomalies(tenantId);

    // Step 3: Send notifications for high-confidence correlations
    const highConfidenceCorrelations = correlations.filter(
      (c) => c.confidence && c.confidence >= 0.7
    );

    for (const correlation of highConfidenceCorrelations) {
      // Find tenant admin to notify
      const { data: admins } = await supabase
        .from("tenant_memberships")
        .select("user_id")
        .eq("tenant_id", tenantId)
        .in("role", ["owner", "admin"])
        .limit(5);

      for (const admin of admins || []) {
        await dispatchNotificationEvent({
          type: "ai.quota_exceeded",
          tenantId: tenantId,
          userId: admin.user_id,
          title: "Cost anomaly detected",
          body: correlation.root_cause_hypothesis || "Unusual cost pattern detected",
          priority: "high",
          actionUrl: "/admin/ai/costs",
          metadata: {
            anomaly_type: correlation.anomaly_type,
            confidence: correlation.confidence,
            correlated_changes: correlation.correlated_change_ids.length,
          },
        });
      }
    }

    return NextResponse.json({
      message: "Cost anomaly detection completed",
      metrics_computed: metrics ? 1 : 0,
      anomalies_detected: correlations.length,
      high_confidence_alerts: highConfidenceCorrelations.length,
    });
  } catch (error) {
    console.error("Error in cost anomaly job:", error);
    return NextResponse.json(
      { error: "Failed to run cost anomaly detection" },
      { status: 500 }
    );
  }
}
