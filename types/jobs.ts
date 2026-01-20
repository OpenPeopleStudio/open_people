/**
 * Jobs Queue Types
 *
 * Types for the generalized background jobs queue system.
 */

// ═══════════════════════════════════════════════════════════════════════════
// Job Status
// ═══════════════════════════════════════════════════════════════════════════

export type JobStatus = "pending" | "running" | "completed" | "failed" | "cancelled" | "dlq";

// ═══════════════════════════════════════════════════════════════════════════
// Job Types
// ═══════════════════════════════════════════════════════════════════════════

/** Database row for a job */
export interface JobRow {
  id: string;
  queue: string;
  job_type: string;
  tenant_id: string | null;
  owner_id: string | null;
  priority: number;
  status: JobStatus;
  locked_at: string | null;
  locked_by: string | null;
  input: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  retry_backoff_seconds: number;
  next_retry_at: string | null;
  idempotency_key: string | null;
  scheduled_for: string | null;
  timeout_seconds: number;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
}

/** Options for enqueuing a job */
export interface EnqueueJobOptions {
  /** Target queue (default: "default") */
  queue?: string;
  /** Job type identifier */
  job_type: string;
  /** Job input payload */
  input: Record<string, unknown>;
  /** Tenant scope */
  tenant_id?: string | null;
  /** Job owner */
  owner_id?: string | null;
  /** Priority (higher = sooner) */
  priority?: number;
  /** Idempotency key for deduplication */
  idempotency_key?: string;
  /** Schedule for future execution */
  scheduled_for?: Date | string;
  /** Maximum retry attempts */
  max_retries?: number;
  /** Job timeout in seconds */
  timeout_seconds?: number;
}

/** Result of job execution */
export interface JobResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  duration_ms: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Job Handler Types
// ═══════════════════════════════════════════════════════════════════════════

/** Context passed to job handlers */
export interface JobContext {
  job: JobRow;
  /** Supabase client with service role */
  supabase: unknown;
  /** Log a message with job context */
  log: (level: "debug" | "info" | "warn" | "error", message: string, meta?: Record<string, unknown>) => void;
  /** Update job progress (for long-running jobs) */
  progress?: (percent: number, message?: string) => Promise<void>;
}

/** Job handler function */
export type JobHandler<TInput = unknown, TResult = unknown> = (
  input: TInput,
  context: JobContext
) => Promise<TResult>;

/** Registered job handler with metadata */
export interface RegisteredHandler {
  handler: JobHandler;
  /** Maximum concurrent executions (per worker) */
  concurrency?: number;
  /** Timeout override */
  timeout_seconds?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Queue Configuration
// ═══════════════════════════════════════════════════════════════════════════

/** Queue configuration */
export interface QueueConfig {
  name: string;
  /** Default concurrency for this queue */
  concurrency: number;
  /** Default timeout for jobs in this queue */
  default_timeout_seconds: number;
  /** Default retry configuration */
  default_max_retries: number;
  /** Default backoff (in seconds) */
  default_backoff_seconds: number;
  /** Poll interval (in ms) */
  poll_interval_ms: number;
}

/** Default queue configurations */
export const DEFAULT_QUEUES: Record<string, QueueConfig> = {
  default: {
    name: "default",
    concurrency: 5,
    default_timeout_seconds: 600,
    default_max_retries: 3,
    default_backoff_seconds: 30,
    poll_interval_ms: 1000,
  },
  ai: {
    name: "ai",
    concurrency: 3,
    default_timeout_seconds: 900,
    default_max_retries: 2,
    default_backoff_seconds: 60,
    poll_interval_ms: 1500,
  },
  email: {
    name: "email",
    concurrency: 10,
    default_timeout_seconds: 120,
    default_max_retries: 5,
    default_backoff_seconds: 15,
    poll_interval_ms: 500,
  },
  webhooks: {
    name: "webhooks",
    concurrency: 20,
    default_timeout_seconds: 30,
    default_max_retries: 5,
    default_backoff_seconds: 5,
    poll_interval_ms: 500,
  },
  analytics: {
    name: "analytics",
    concurrency: 2,
    default_timeout_seconds: 1800,
    default_max_retries: 1,
    default_backoff_seconds: 300,
    poll_interval_ms: 5000,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// DLQ Types
// ═══════════════════════════════════════════════════════════════════════════

/** Job DLQ entry */
export interface JobDLQRow {
  id: string;
  job_id: string;
  queue: string;
  job_type: string;
  tenant_id: string | null;
  input: Record<string, unknown>;
  final_error: string;
  total_attempts: number;
  can_replay: boolean;
  replayed_at: string | null;
  replay_job_id: string | null;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Tenant Limits Types
// ═══════════════════════════════════════════════════════════════════════════

/** Tenant rate limit configuration */
export interface JobTenantLimits {
  tenant_id: string;
  queue: string;
  max_concurrent: number;
  current_running: number;
  max_per_minute: number;
  count_this_minute: number;
  minute_window_start: string;
  is_throttled: boolean;
  throttled_until: string | null;
  throttle_reason: string | null;
  updated_at: string;
}
