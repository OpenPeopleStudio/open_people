/**
 * Jobs Queue - Public API
 *
 * Background job processing with retries, rate limiting, and observability.
 */

// Core queue objects and lifecycle
export {
  JobQueue,
  appJobQueue,
  emailJobQueue,
  aiJobQueue,
  maintenanceJobQueue,
  startAllJobQueues,
  stopAllJobQueues,
} from "./queue";

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
