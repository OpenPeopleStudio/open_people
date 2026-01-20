/**
 * Jobs Queue - Generalized background job processing
 *
 * Provides a consistent API for enqueueing and processing background jobs
 * with retries, rate limiting, and observability.
 *
 * Usage:
 *   // Enqueue a job
 *   const jobId = await enqueueJob({
 *     job_type: "send_email",
 *     input: { to: "user@example.com", template: "welcome" },
 *   });
 *
 *   // Register a handler
 *   registerHandler("send_email", async (input, ctx) => {
 *     await sendEmail(input.to, input.template);
 *     return { sent: true };
 *   });
 */

import { createSupabaseAdmin } from "@/lib/supabase/server";
import type {
  JobRow,
  EnqueueJobOptions,
  JobResult,
  JobHandler,
  JobContext,
  RegisteredHandler,
  QueueConfig,
  DEFAULT_QUEUES,
} from "@/types/jobs";

// ═══════════════════════════════════════════════════════════════════════════
// Job Enqueueing
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Enqueue a new background job.
 * Returns the job ID (for tracking).
 */
export async function enqueueJob(options: EnqueueJobOptions): Promise<string> {
  const supabase = await createSupabaseAdmin();

  const { data: jobId, error } = await supabase.rpc("enqueue_job", {
    p_queue: options.queue ?? "default",
    p_job_type: options.job_type,
    p_input: options.input,
    p_tenant_id: options.tenant_id ?? null,
    p_owner_id: options.owner_id ?? null,
    p_priority: options.priority ?? 0,
    p_idempotency_key: options.idempotency_key ?? null,
    p_scheduled_for: options.scheduled_for
      ? typeof options.scheduled_for === "string"
        ? options.scheduled_for
        : options.scheduled_for.toISOString()
      : null,
    p_max_retries: options.max_retries ?? 3,
    p_timeout_seconds: options.timeout_seconds ?? 600,
  });

  if (error) {
    throw new JobQueueError(`Failed to enqueue job: ${error.message}`, error);
  }

  return jobId as string;
}

/**
 * Enqueue multiple jobs in a batch.
 */
export async function enqueueJobs(jobs: EnqueueJobOptions[]): Promise<string[]> {
  const results: string[] = [];
  for (const job of jobs) {
    const id = await enqueueJob(job);
    results.push(id);
  }
  return results;
}

/**
 * Cancel a pending job.
 */
export async function cancelJob(jobId: string): Promise<boolean> {
  const supabase = await createSupabaseAdmin();

  const { error } = await supabase
    .from("jobs")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", jobId)
    .eq("status", "pending");

  return !error;
}

/**
 * Get job status and details.
 */
export async function getJob(jobId: string): Promise<JobRow | null> {
  const supabase = await createSupabaseAdmin();

  const { data, error } = await supabase.from("jobs").select("*").eq("id", jobId).single();

  if (error || !data) return null;
  return data as JobRow;
}

// ═══════════════════════════════════════════════════════════════════════════
// Handler Registry
// ═══════════════════════════════════════════════════════════════════════════

const handlerRegistry = new Map<string, RegisteredHandler>();

/**
 * Register a job handler for a specific job type.
 */
export function registerHandler<TInput = unknown, TResult = unknown>(
  jobType: string,
  handler: JobHandler<TInput, TResult>,
  options?: { concurrency?: number; timeout_seconds?: number }
): void {
  handlerRegistry.set(jobType, {
    handler: handler as JobHandler,
    concurrency: options?.concurrency,
    timeout_seconds: options?.timeout_seconds,
  });
}

/**
 * Get a registered handler.
 */
export function getHandler(jobType: string): RegisteredHandler | undefined {
  return handlerRegistry.get(jobType);
}

// ═══════════════════════════════════════════════════════════════════════════
// Job Execution
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Execute a single job.
 */
export async function executeJob(job: JobRow): Promise<JobResult> {
  const startTime = Date.now();
  const handler = handlerRegistry.get(job.job_type);

  if (!handler) {
    return {
      success: false,
      error: `No handler registered for job type: ${job.job_type}`,
      duration_ms: Date.now() - startTime,
    };
  }

  const supabase = await createSupabaseAdmin();

  // Build context
  const context: JobContext = {
    job,
    supabase,
    log: (level, message, meta) => {
      const logFn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
      logFn(`[job:${job.id}] ${message}`, meta ? JSON.stringify(meta) : "");
    },
  };

  try {
    // Execute with timeout
    const timeout = handler.timeout_seconds ?? job.timeout_seconds;
    const result = await Promise.race([
      handler.handler(job.input, context),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Job timed out after ${timeout}s`)), timeout * 1000)
      ),
    ]);

    // Mark job as completed
    await supabase.rpc("complete_job", {
      p_job_id: job.id,
      p_result: result as Record<string, unknown>,
    });

    return {
      success: true,
      data: result,
      duration_ms: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Mark job as failed
    await supabase.rpc("fail_job", {
      p_job_id: job.id,
      p_error: errorMessage,
      p_move_to_dlq: false,
    });

    return {
      success: false,
      error: errorMessage,
      duration_ms: Date.now() - startTime,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Worker Runner
// ═══════════════════════════════════════════════════════════════════════════

import os from "os";

const RUNNER_ID = `job-runner:${os.hostname()}:${process.pid}`;

declare global {
  // eslint-disable-next-line no-var
  var __jobRunnerStarted: Record<string, boolean> | undefined;
  // eslint-disable-next-line no-var
  var __jobRunnerIntervals: Record<string, NodeJS.Timeout> | undefined;
}

/**
 * Start a job runner for a specific queue.
 */
export function startQueueRunner(
  queue: string,
  config?: Partial<QueueConfig>
): void {
  const allowInProcess =
    process.env.JOB_RUNNER_MODE === "in_process" || process.env.NODE_ENV === "development";

  if (!allowInProcess) return;

  globalThis.__jobRunnerStarted = globalThis.__jobRunnerStarted || {};
  globalThis.__jobRunnerIntervals = globalThis.__jobRunnerIntervals || {};

  if (globalThis.__jobRunnerStarted[queue]) return;
  globalThis.__jobRunnerStarted[queue] = true;

  const pollInterval = config?.poll_interval_ms ?? 1000;

  console.log(`[job-runner] Starting runner for queue: ${queue}`);

  globalThis.__jobRunnerIntervals[queue] = setInterval(() => {
    void runQueueTick(queue).catch((err) =>
      console.error(`[job-runner] ${queue} tick error:`, err)
    );
  }, pollInterval);
}

/**
 * Stop a queue runner.
 */
export function stopQueueRunner(queue: string): void {
  if (globalThis.__jobRunnerIntervals?.[queue]) {
    clearInterval(globalThis.__jobRunnerIntervals[queue]);
    delete globalThis.__jobRunnerIntervals[queue];
  }
  if (globalThis.__jobRunnerStarted) {
    globalThis.__jobRunnerStarted[queue] = false;
  }
}

/**
 * Single tick of the queue runner.
 */
async function runQueueTick(queue: string): Promise<void> {
  const supabase = await createSupabaseAdmin();

  // Claim a job
  const { data: job, error } = await supabase.rpc("claim_next_job", {
    p_queue: queue,
    p_runner_id: RUNNER_ID,
  });

  if (error) {
    console.error(`[job-runner] Failed to claim job from ${queue}:`, error);
    return;
  }

  if (!job) return;

  // Execute the job
  await executeJob(job as JobRow);
}

/**
 * Run a single processing cycle for a queue (for cron/serverless).
 */
export async function runQueueCycle(
  queue: string,
  options?: { batchSize?: number }
): Promise<{ processed: number; errors: number }> {
  const supabase = await createSupabaseAdmin();
  let processed = 0;
  let errors = 0;

  // Claim batch of jobs
  const { data: jobs, error } = await supabase.rpc("claim_jobs_batch", {
    p_queue: queue,
    p_runner_id: RUNNER_ID,
    p_batch_size: options?.batchSize ?? 10,
  });

  if (error) {
    console.error(`[job-runner] Failed to claim jobs from ${queue}:`, error);
    return { processed: 0, errors: 1 };
  }

  if (!jobs || jobs.length === 0) {
    return { processed: 0, errors: 0 };
  }

  // Execute jobs
  const results = await Promise.allSettled(jobs.map((job: JobRow) => executeJob(job)));

  for (const result of results) {
    if (result.status === "fulfilled" && result.value.success) {
      processed++;
    } else {
      errors++;
    }
  }

  // Also process retry jobs
  const { data: retryJobs } = await supabase.rpc("claim_retry_jobs", {
    p_queue: queue,
    p_runner_id: RUNNER_ID,
    p_batch_size: Math.floor((options?.batchSize ?? 10) / 2),
  });

  if (retryJobs && retryJobs.length > 0) {
    const retryResults = await Promise.allSettled(
      retryJobs.map((job: JobRow) => executeJob(job))
    );

    for (const result of retryResults) {
      if (result.status === "fulfilled" && result.value.success) {
        processed++;
      } else {
        errors++;
      }
    }
  }

  return { processed, errors };
}

// ═══════════════════════════════════════════════════════════════════════════
// Error Types
// ═══════════════════════════════════════════════════════════════════════════

export class JobQueueError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "JobQueueError";
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate an idempotency key for a job.
 */
export function generateJobIdempotencyKey(
  jobType: string,
  uniqueAttrs: Record<string, unknown>
): string {
  const payload = JSON.stringify({ type: jobType, ...uniqueAttrs });
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `${jobType}:${Math.abs(hash).toString(36)}`;
}
