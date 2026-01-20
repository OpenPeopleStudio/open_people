/**
 * Jobs Queue - Public API
 *
 * Background job processing with retries, rate limiting, and observability.
 */

// Core queue operations
export {
  enqueueJob,
  enqueueJobs,
  cancelJob,
  getJob,
  generateJobIdempotencyKey,
  JobQueueError,
} from "./queue";

// Handler registration
export { registerHandler, getHandler } from "./queue";

// Execution
export { executeJob, runQueueCycle } from "./queue";

// Runner lifecycle
export { startQueueRunner, stopQueueRunner } from "./queue";

// Re-export types
export type {
  JobRow,
  JobStatus,
  EnqueueJobOptions,
  JobResult,
  JobHandler,
  JobContext,
  RegisteredHandler,
  QueueConfig,
  JobDLQRow,
  JobTenantLimits,
} from "@/types/jobs";

export { DEFAULT_QUEUES } from "@/types/jobs";
