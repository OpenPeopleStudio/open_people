/**
 * POST /api/ai/jobs/drift-probes
 * 
 * Background job to run drift probes and complete auto-baselines
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import {
  getInstalledProbePacks,
  runProbePack,
  createDriftAlert,
  getPendingAutoBaselineJobs,
  completeAutoBaseline,
} from "@/lib/observability/drift";
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
    let probesRun = 0;
    let probesFailed = 0;
    let alertsCreated = 0;
    let baselinesCompleted = 0;

    // Step 1: Run installed probe packs
    const installedPacks = await getInstalledProbePacks(supabase, tenantId);

    for (const install of installedPacks) {
      const pack = install.pack;
      if (!pack) continue;

      // Check if it's time to run based on frequency
      // For simplicity, we'll run all packs on each invocation
      // In production, you'd track last run time and check frequency

      // Create a mock executor (in production, this would call the actual AI model)
      const executor = async (_input: string) => {
        void _input;
        // This is a placeholder - in production, you'd call the AI model
        // based on the install's application_id and model_id
        const startTime = Date.now();
        
        // For now, simulate a response
        // In production: call OpenAI/Anthropic with the probe input
        const mockOutput = `I cannot provide that information. Please contact support for assistance.`;
        
        return {
          output: mockOutput,
          latencyMs: Date.now() - startTime,
        };
      };

      try {
        const results = await runProbePack(
          pack,
          executor,
          install.enabled_probes || undefined
        );

        probesRun += results.results.length;

        // Check threshold
        const threshold = install.threshold_override || pack.recommended_threshold;
        
        if (results.passRate < threshold) {
          probesFailed += results.results.filter(r => !r.passed).length;

          // Create drift alert
          const alertId = await createDriftAlert(supabase, {
            tenantId,
            driftType: "behavioral",
            severity: results.passRate < 0.8 ? "high" : "medium",
            title: `Probe pack "${pack.name}" below threshold`,
            description: `Pass rate ${(results.passRate * 100).toFixed(1)}% below ${(threshold * 100).toFixed(1)}% threshold`,
            driftDetails: {
              pack_id: pack.id,
              pack_slug: pack.slug,
              pass_rate: results.passRate,
              threshold,
              failed_probes: results.results
                .filter(r => !r.passed)
                .map(r => r.probe_name),
            },
          });

          if (alertId) {
            alertsCreated++;

            // Notify tenant admins
            const { data: admins } = await supabase
              .from("tenant_memberships")
              .select("user_id")
              .eq("tenant_id", tenantId)
              .in("role", ["owner", "admin"])
              .limit(5);

            for (const admin of admins || []) {
              await dispatchNotificationEvent({
                type: "ai.worker_failed",
                tenantId: tenantId,
                userId: admin.user_id,
                title: "Drift alert: Probe pack failed",
                body: `${pack.name} pass rate dropped to ${(results.passRate * 100).toFixed(1)}%`,
                priority: "high",
                actionUrl: "/admin/ai/drift",
                metadata: {
                  alert_id: alertId,
                  pack_slug: pack.slug,
                  pass_rate: results.passRate,
                },
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error running probe pack ${pack.slug}:`, error);
      }
    }

    // Step 2: Check and complete pending auto-baseline jobs
    const pendingJobs = await getPendingAutoBaselineJobs(tenantId);

    for (const job of pendingJobs) {
      // Check if collection period has elapsed
      const collectionStart = new Date(job.collection_start);
      const now = new Date();
      const hoursElapsed = (now.getTime() - collectionStart.getTime()) / (1000 * 60 * 60);

      // Get config to check duration
      const { data: config } = await supabase
        .from("auto_baseline_configs")
        .select("collection_duration_hours")
        .eq("id", job.config_id)
        .single();

      const durationHours = config?.collection_duration_hours || 24;

      if (hoursElapsed >= durationHours) {
        try {
          const baselineId = await completeAutoBaseline(job.id);
          if (baselineId) {
            baselinesCompleted++;
          }
        } catch (error) {
          console.error(`Error completing auto-baseline job ${job.id}:`, error);
        }
      }
    }

    return NextResponse.json({
      message: "Drift probe job completed",
      probes_run: probesRun,
      probes_failed: probesFailed,
      alerts_created: alertsCreated,
      baselines_completed: baselinesCompleted,
    });
  } catch (error) {
    console.error("Error in drift probe job:", error);
    return NextResponse.json(
      { error: "Failed to run drift probe job" },
      { status: 500 }
    );
  }
}
