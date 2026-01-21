/**
 * Job Processor
 *
 * Initializes and manages all job queues with their handlers.
 * Provides a central point for job processing management.
 */

import {
  appJobQueue,
  emailJobQueue,
  aiJobQueue,
  maintenanceJobQueue,
  JobType,
  startAllJobQueues,
  stopAllJobQueues,
} from './queue';

import {
  emailTriageHandler,
  aiContentAnalysisHandler,
  sessionCleanupHandler,
  notificationSenderHandler,
  webhookDeliveryHandler,
  securityEventHandler,
  reportGeneratorHandler,
} from './handlers';

/**
 * Initialize all job queues with their handlers
 */
export function initializeJobQueues(): void {
  // Email processing queue
  emailJobQueue.registerHandler(JobType.EMAIL_TRIAGE, emailTriageHandler);
  emailJobQueue.registerHandler(JobType.EMAIL_SEND, notificationSenderHandler);
  emailJobQueue.registerHandler(JobType.EMAIL_ANALYZE, aiContentAnalysisHandler);

  // AI processing queue
  aiJobQueue.registerHandler(JobType.AI_ANALYZE_CONTENT, aiContentAnalysisHandler);
  aiJobQueue.registerHandler(JobType.AI_GENERATE_SUMMARY, aiContentAnalysisHandler);
  aiJobQueue.registerHandler(JobType.AI_CLASSIFY_DOCUMENT, aiContentAnalysisHandler);

  // Application queue
  appJobQueue.registerHandler(JobType.WEBHOOK_DELIVER, webhookDeliveryHandler);
  appJobQueue.registerHandler(JobType.WEBHOOK_RETRY, webhookDeliveryHandler);
  appJobQueue.registerHandler(JobType.SEND_NOTIFICATIONS, notificationSenderHandler);

  // Maintenance queue
  maintenanceJobQueue.registerHandler(JobType.CLEANUP_EXPIRED_SESSIONS, sessionCleanupHandler);
  maintenanceJobQueue.registerHandler(JobType.GENERATE_REPORTS, reportGeneratorHandler);

  console.log('Job queues initialized with handlers');
}

/**
 * Start all job processing
 */
export function startJobProcessing(): void {
  initializeJobQueues();
  startAllJobQueues();
}

/**
 * Stop all job processing
 */
export function stopJobProcessing(): void {
  stopAllJobQueues();
}

/**
 * Get job queue statistics
 */
export async function getJobQueueStats() {
  const [appStats, emailStats, aiStats, maintenanceStats] = await Promise.all([
    appJobQueue.getStats(),
    emailJobQueue.getStats(),
    aiJobQueue.getStats(),
    maintenanceJobQueue.getStats(),
  ]);

  return {
    app: appStats,
    email: emailStats,
    ai: aiStats,
    maintenance: maintenanceStats,
    total: {
      pending: appStats.pending + emailStats.pending + aiStats.pending + maintenanceStats.pending,
      processing: appStats.processing + emailStats.processing + aiStats.processing + maintenanceStats.processing,
      completed: appStats.completed + emailStats.completed + aiStats.completed + maintenanceStats.completed,
      failed: appStats.failed + emailStats.failed + aiStats.failed + maintenanceStats.failed,
      total: appStats.total + emailStats.total + aiStats.total + maintenanceStats.total,
    },
  };
}

/**
 * Schedule recurring maintenance jobs
 */
export async function scheduleMaintenanceJobs(): Promise<void> {
  const supabase = await import('@/lib/supabase/server').then(m => m.createSupabaseServer());

  // Schedule session cleanup every hour
  try {
    await maintenanceJobQueue.addJob(
      JobType.CLEANUP_EXPIRED_SESSIONS,
      {},
      {
        priority: 0, // Low priority
        delay: 3600, // 1 hour
        maxRetries: 3,
      }
    );
  } catch (error) {
    console.error('Failed to schedule session cleanup job:', error);
  }

  // Schedule report generation daily
  try {
    await maintenanceJobQueue.addJob(
      JobType.GENERATE_REPORTS,
      {
        reportType: 'usage',
        parameters: { period: 'daily' },
      },
      {
        priority: 1, // Normal priority
        delay: 86400, // 24 hours
        maxRetries: 2,
      }
    );
  } catch (error) {
    console.error('Failed to schedule report generation job:', error);
  }
}

/**
 * Graceful shutdown handler
 */
export function setupGracefulShutdown(): void {
  const shutdown = (signal: string) => {
    console.log(`Received ${signal}, shutting down job processors...`);
    stopJobProcessing();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception in job processor:', error);
    stopJobProcessing();
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection in job processor:', reason);
    stopJobProcessing();
    process.exit(1);
  });
}