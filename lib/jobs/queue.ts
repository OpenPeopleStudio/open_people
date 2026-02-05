/**
 * Event-Driven Job Queue System
 *
 * Provides a robust job queue system for background processing with:
 * - Event-driven architecture
 * - Priority queues
 * - Retry mechanisms
 * - Monitoring and metrics
 * - Scalable worker pools
 */

import { createSupabaseServer } from '@/lib/supabase/server';
import { logPerformance } from '@/lib/observability/logger';

export enum JobPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3,
}

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETRY = 'retry',
}

export enum JobType {
  // Email processing
  EMAIL_TRIAGE = 'email_triage',
  EMAIL_SEND = 'email_send',
  EMAIL_ANALYZE = 'email_analyze',

  // AI processing
  AI_ANALYZE_CONTENT = 'ai_analyze_content',
  AI_GENERATE_SUMMARY = 'ai_generate_summary',
  AI_CLASSIFY_DOCUMENT = 'ai_classify_document',

  // Vault operations
  VAULT_ENCRYPT_FILE = 'vault_encrypt_file',
  VAULT_DECRYPT_FILE = 'vault_decrypt_file',
  VAULT_GENERATE_THUMBNAIL = 'vault_generate_thumbnail',

  // Background tasks
  CLEANUP_EXPIRED_SESSIONS = 'cleanup_expired_sessions',
  SEND_NOTIFICATIONS = 'send_notifications',
  GENERATE_REPORTS = 'generate_reports',

  // Webhook processing
  WEBHOOK_DELIVER = 'webhook_deliver',
  WEBHOOK_RETRY = 'webhook_retry',
}

export interface JobData {
  [key: string]: unknown;
}

export interface Job {
  id: string;
  type: JobType;
  priority: JobPriority;
  data: JobData;
  status: JobStatus;
  maxRetries: number;
  retryCount: number;
  nextRunAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  correlationId?: string;
}

export interface JobResult {
  success: boolean;
  data?: unknown;
  error?: string;
  retryAfter?: number; // seconds
}

type JobRow = {
  id: string;
  type: JobType;
  priority: JobPriority;
  data: JobData;
  status: JobStatus;
  max_retries: number;
  retry_count: number;
  next_run_at: string;
  created_at: string;
  updated_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  failed_at?: string | null;
  error_message?: string | null;
  created_by?: string | null;
  correlation_id?: string | null;
};

export interface JobHandler {
  (job: Job): Promise<JobResult>;
}

/**
 * Job Queue Manager
 */
export class JobQueue {
  private handlers: Map<JobType, JobHandler> = new Map();
  private isProcessing = false;
  private processingInterval?: NodeJS.Timeout;

  constructor(
    private queueName: string,
    private pollInterval = 5000, // 5 seconds
    private maxConcurrentJobs = 5
  ) {}

  /**
   * Register a job handler
   */
  registerHandler(type: JobType, handler: JobHandler): void {
    this.handlers.set(type, handler);
  }

  /**
   * Start processing jobs
   */
  start(): void {
    if (this.isProcessing) return;

    this.isProcessing = true;
    console.log(`[JobQueue:${this.queueName}] Starting job processing`);

    this.processingInterval = setInterval(() => {
      this.processJobs();
    }, this.pollInterval);
  }

  /**
   * Stop processing jobs
   */
  stop(): void {
    this.isProcessing = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      delete this.processingInterval;
    }
    console.log(`[JobQueue:${this.queueName}] Stopped job processing`);
  }

  /**
   * Add a job to the queue
   */
  async addJob(
    type: JobType,
    data: JobData,
    options: {
      priority?: JobPriority;
      delay?: number; // seconds
      maxRetries?: number;
      correlationId?: string;
      createdBy?: string;
    } = {}
  ): Promise<string> {
    const supabase = await createSupabaseServer();

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const nextRunAt = new Date(Date.now() + (options.delay || 0) * 1000);

    const { error } = await supabase
      .from('job_queue')
      .insert({
        id: jobId,
        type,
        priority: options.priority || JobPriority.NORMAL,
        data,
        status: JobStatus.PENDING,
        max_retries: options.maxRetries || 3,
        retry_count: 0,
        next_run_at: nextRunAt.toISOString(),
        correlation_id: options.correlationId,
        created_by: options.createdBy,
      });

    if (error) {
      console.error(`[JobQueue:${this.queueName}] Failed to add job:`, error);
      throw new Error(`Failed to add job: ${error.message}`);
    }

    console.log(`[JobQueue:${this.queueName}] Added job ${jobId} of type ${type}`);
    return jobId;
  }

  /**
   * Process pending jobs
   */
  private async processJobs(): Promise<void> {
    if (!this.isProcessing) return;

    try {
      const supabase = await createSupabaseServer();

      // Get pending jobs ordered by priority and creation time
      const { data: jobs, error } = await supabase
        .from('job_queue')
        .select('*')
        .eq('status', JobStatus.PENDING)
        .lte('next_run_at', new Date().toISOString())
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(this.maxConcurrentJobs);

      if (error) {
        console.error(`[JobQueue:${this.queueName}] Failed to fetch jobs:`, error);
        return;
      }

      if (!jobs || jobs.length === 0) return;

      console.log(`[JobQueue:${this.queueName}] Processing ${jobs.length} jobs`);

      // Process jobs concurrently
      const processingPromises = (jobs as JobRow[]).map(job => this.processJob(job));
      await Promise.allSettled(processingPromises);

    } catch (error) {
      console.error(`[JobQueue:${this.queueName}] Error in job processing:`, error);
    }
  }

  /**
   * Process a single job
   */
  private async processJob(jobData: JobRow): Promise<void> {
    const job: Job = {
      id: jobData.id,
      type: jobData.type,
      priority: jobData.priority,
      data: jobData.data,
      status: jobData.status,
      maxRetries: jobData.max_retries,
      retryCount: jobData.retry_count,
      nextRunAt: new Date(jobData.next_run_at),
      createdAt: new Date(jobData.created_at),
      updatedAt: new Date(jobData.updated_at),
      ...(jobData.started_at ? { startedAt: new Date(jobData.started_at) } : {}),
      ...(jobData.completed_at ? { completedAt: new Date(jobData.completed_at) } : {}),
      ...(jobData.failed_at ? { failedAt: new Date(jobData.failed_at) } : {}),
      ...(jobData.error_message ? { errorMessage: jobData.error_message } : {}),
      ...(jobData.created_by ? { createdBy: jobData.created_by } : {}),
      ...(jobData.correlation_id ? { correlationId: jobData.correlation_id } : {}),
    };

    const handler = this.handlers.get(job.type);
    if (!handler) {
      console.error(`[JobQueue:${this.queueName}] No handler registered for job type: ${job.type}`);
      await this.failJob(job.id, `No handler for job type: ${job.type}`);
      return;
    }

    const startTime = Date.now();
    try {
      // Mark job as processing
      await this.updateJobStatus(job.id, JobStatus.PROCESSING);

      // Execute handler
      const result = await handler(job);

      if (result.success) {
        await this.completeJob(job.id, result.data);
        logPerformance(`job_${job.type}_duration`, Date.now() - startTime, 'ms', {
          jobId: job.id,
          success: true,
        });
      } else {
        await this.handleJobFailure(job, result);
        logPerformance(`job_${job.type}_duration`, Date.now() - startTime, 'ms', {
          jobId: job.id,
          success: false,
          ...(result.error ? { error: new Error(result.error) } : {}),
        });
      }

    } catch (error) {
      console.error(`[JobQueue:${this.queueName}] Job ${job.id} failed:`, error);
      await this.handleJobFailure(job, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      logPerformance(`job_${job.type}_duration`, Date.now() - startTime, 'ms', {
        jobId: job.id,
        success: false,
        error: errorObj,
      });
    }
  }

  /**
   * Handle job failure with retry logic
   */
  private async handleJobFailure(job: Job, result: JobResult): Promise<void> {
    const newRetryCount = job.retryCount + 1;

    if (newRetryCount >= job.maxRetries) {
      // Max retries exceeded
      await this.failJob(job.id, result.error || 'Max retries exceeded');
    } else {
      // Schedule retry with exponential backoff
      const delaySeconds = Math.min(300, Math.pow(2, newRetryCount) * 60); // Max 5 minutes
      const nextRunAt = new Date(Date.now() + delaySeconds * 1000);

      await this.retryJob(job.id, nextRunAt, result.error, newRetryCount);
    }
  }

  /**
   * Update job status
   */
  private async updateJobStatus(jobId: string, status: JobStatus, additionalFields: Record<string, unknown> = {}): Promise<void> {
    const supabase = await createSupabaseServer();

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
      ...additionalFields,
    };

    if (status === JobStatus.PROCESSING) {
      updateData.started_at = new Date().toISOString();
    } else if (status === JobStatus.COMPLETED) {
      updateData.completed_at = new Date().toISOString();
    } else if (status === JobStatus.FAILED) {
      updateData.failed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('job_queue')
      .update(updateData)
      .eq('id', jobId);

    if (error) {
      console.error(`[JobQueue:${this.queueName}] Failed to update job ${jobId}:`, error);
    }
  }

  private async completeJob(jobId: string, result?: unknown): Promise<void> {
    await this.updateJobStatus(jobId, JobStatus.COMPLETED, { result });
  }

  private async failJob(jobId: string, errorMessage: string): Promise<void> {
    await this.updateJobStatus(jobId, JobStatus.FAILED, { error_message: errorMessage });
  }

  private async retryJob(jobId: string, nextRunAt: Date, errorMessage?: string, retryCount?: number): Promise<void> {
    await this.updateJobStatus(jobId, JobStatus.RETRY, {
      next_run_at: nextRunAt.toISOString(),
      error_message: errorMessage,
      retry_count: retryCount,
    });
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  }> {
    const supabase = await createSupabaseServer();

    const { data, error } = await supabase
      .from('job_queue')
      .select('status')
      .in('status', [JobStatus.PENDING, JobStatus.PROCESSING, JobStatus.COMPLETED, JobStatus.FAILED]);

    if (error) {
      console.error(`[JobQueue:${this.queueName}] Failed to get stats:`, error);
      return { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 };
    }

    const stats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      total: data?.length || 0,
    };

    data?.forEach(job => {
      stats[job.status as keyof typeof stats]++;
    });

    return stats;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Global Job Queue Instances
// ═══════════════════════════════════════════════════════════════════════════

// Main application job queue
export const appJobQueue = new JobQueue('app', 5000, 5);

// Email processing job queue
export const emailJobQueue = new JobQueue('email', 3000, 3);

// AI processing job queue
export const aiJobQueue = new JobQueue('ai', 10000, 2);

// Background maintenance job queue
export const maintenanceJobQueue = new JobQueue('maintenance', 30000, 1);

// ═══════════════════════════════════════════════════════════════════════════
// Convenience Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Schedule a job for later execution
 */
export async function scheduleJob(
  queue: JobQueue,
  type: JobType,
  data: JobData,
  options: {
    priority?: JobPriority;
    delay?: number;
    maxRetries?: number;
    correlationId?: string;
    createdBy?: string;
  } = {}
): Promise<string> {
  return queue.addJob(type, data, options);
}

/**
 * Start all job queues
 */
export function startAllJobQueues(): void {
  appJobQueue.start();
  emailJobQueue.start();
  aiJobQueue.start();
  maintenanceJobQueue.start();

  console.log('All job queues started');
}

/**
 * Stop all job queues
 */
export function stopAllJobQueues(): void {
  appJobQueue.stop();
  emailJobQueue.stop();
  aiJobQueue.stop();
  maintenanceJobQueue.stop();

  console.log('All job queues stopped');
}
