import os from "os";

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { dispatchNotificationEvent } from "@/lib/notifications/events";

import type { WeekPlanRequest, WeekPlanResponse } from "@/lib/ai/prompts/chiefOfStaff";
import type { SalesPrepRequest, SalesPrepResponse } from "@/lib/ai/prompts/salesDesk";

/* ═══════════════════════════════════════════════════════════════════════════
   AI Worker Jobs Runner (MVP)

   Runs inside the Next.js node process (dev / node runtime).
   - Claims queued jobs
   - Executes worker logic
   - Persists results + sends in-app notification on completion/failure

   NOTE: For production robustness, you’ll likely move this to a separate worker
   process + queue. The API contract below remains the same.
   ═══════════════════════════════════════════════════════════════════════════ */

declare global {
  var __aiWorkerRunnerStarted: boolean | undefined;
  var __aiWorkerRunnerInterval: NodeJS.Timeout | undefined;
}

const RUNNER_ID = `${os.hostname()}:${process.pid}`;

export function ensureAIWorkerRunnerStarted() {
  // In production (especially serverless), you typically run jobs via a separate
  // worker/cron calling a runner endpoint. Keep the in-process loop opt-in.
  const allowInProcess =
    process.env.AI_WORKER_RUNNER_MODE === "in_process" ||
    process.env.NODE_ENV === "development";

  if (!allowInProcess) return;

  if (globalThis.__aiWorkerRunnerStarted) return;
  globalThis.__aiWorkerRunnerStarted = true;

  // Poll often enough to feel realtime, but not too chatty.
  globalThis.__aiWorkerRunnerInterval = setInterval(() => {
    // Fire-and-forget tick; never let one bad tick stop the runner.
    void tick().catch((err) => console.error("[ai-worker-runner] tick error:", err));
  }, 1500);
}

export async function runOneJob(): Promise<boolean> {
  const supabaseAdmin = await createSupabaseAdmin();

  // Atomically claim a job (or reclaim stale lock)
  const { data: claimed, error: claimErr } = await supabaseAdmin.rpc(
    "claim_next_ai_worker_job",
    {
      p_runner_id: RUNNER_ID,
      p_lock_timeout_seconds: 600,
    }
  );

  const claimedJob = Array.isArray(claimed) ? claimed[0] : claimed;
  if (claimErr || !claimedJob) return false;

  try {
    const result = await executeJob(claimedJob);

    await supabaseAdmin
      .from("ai_worker_jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        result,
        error_message: null,
      })
      .eq("id", claimedJob.id);

    await dispatchNotificationEvent({
      type: "ai.worker_completed",
      tenantId: claimedJob.tenant_id,
      userId: claimedJob.owner_id,
      title: `${humanizeWorkerId(claimedJob.worker_id)} finished`,
      body: `Your ${humanizeWorkerId(claimedJob.worker_id)} run is ready.`,
      priority: "medium",
      actionUrl: actionUrlForJob(claimedJob.worker_id, claimedJob.id),
      metadata: {
        worker_id: claimedJob.worker_id,
        job_id: claimedJob.id,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Job failed";

    await supabaseAdmin
      .from("ai_worker_jobs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_message: message,
      })
      .eq("id", claimedJob.id);

    await dispatchNotificationEvent({
      type: "ai.worker_failed",
      tenantId: claimedJob.tenant_id,
      userId: claimedJob.owner_id,
      title: `${humanizeWorkerId(claimedJob.worker_id)} failed`,
      body: message,
      priority: "high",
      actionUrl: actionUrlForJob(claimedJob.worker_id, claimedJob.id),
      metadata: {
        worker_id: claimedJob.worker_id,
        job_id: claimedJob.id,
      },
    });
  }

  return true;
}

async function tick() {
  await runOneJob();
}

async function executeJob(jobRow: any): Promise<Record<string, unknown>> {
  switch (jobRow.worker_id) {
    case "chief-of-staff": {
      if (jobRow.job_type !== "week_plan") {
        throw new Error(`Unsupported job_type for chief-of-staff: ${jobRow.job_type}`);
      }
      return await runChiefOfStaffWeekPlan(jobRow.owner_id, jobRow.input as { request: WeekPlanRequest });
    }
    case "ops": {
      if (jobRow.job_type !== "ops_propose") {
        throw new Error(`Unsupported job_type for ops: ${jobRow.job_type}`);
      }
      // Minimal: reuse existing API shape; the UI will expect the same fields it got from /api/ops/propose
      return await runOpsPropose(jobRow.owner_id, jobRow.input as { decision_id: string; cheap_mode?: boolean });
    }
    case "sales-desk": {
      if (jobRow.job_type !== "sales_prep") {
        throw new Error(`Unsupported job_type for sales-desk: ${jobRow.job_type}`);
      }
      return await runSalesDeskPrep(
        jobRow.owner_id,
        jobRow.tenant_id,
        jobRow.input as SalesPrepRequest
      );
    }
    default:
      throw new Error(`Unknown worker_id: ${jobRow.worker_id}`);
  }
}

function humanizeWorkerId(workerId: string): string {
  if (workerId === "chief-of-staff") return "Chief of Staff";
  if (workerId === "ops") return "Ops Worker";
  if (workerId === "sales-desk") return "Sales Desk";
  return workerId;
}

function actionUrlForJob(workerId: string, jobId: string): string {
  // Tenant-side canonical worker routes.
  return `/admin/ai/team/${workerId}?job=${encodeURIComponent(jobId)}`;
}

async function runChiefOfStaffWeekPlan(
  ownerId: string,
  input: { request: WeekPlanRequest }
): Promise<Record<string, unknown>> {
  // Import lazily to avoid loading heavy deps into every request path.
  const { generateWeekPlanForUser } = await import("./workers/chiefOfStaffWeekPlan");

  const response: WeekPlanResponse = await generateWeekPlanForUser({
    ownerId,
    request: input.request,
  });

  return {
    response,
  };
}

async function runOpsPropose(
  ownerId: string,
  input: { decision_id: string; cheap_mode?: boolean }
): Promise<Record<string, unknown>> {
  const { generateOpsProposalForDecision } = await import("./workers/opsPropose");

  const response = await generateOpsProposalForDecision({
    ownerId,
    decisionId: input.decision_id,
    cheapMode: input.cheap_mode === true,
  });

  return {
    response,
  };
}

async function runSalesDeskPrep(
  ownerId: string,
  tenantId: string,
  input: SalesPrepRequest
): Promise<Record<string, unknown>> {
  const { generateSalesPrepForUser } = await import("./workers/salesDeskPrep");

  const response: SalesPrepResponse = await generateSalesPrepForUser({
    ownerId,
    tenantId,
    request: input,
  });

  return {
    response,
  };
}
