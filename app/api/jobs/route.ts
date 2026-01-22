/**
 * Job Queue Management API
 *
 * Provides endpoints for managing and monitoring the job queue system.
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuthAndAuthZ, UserRole } from "@/lib/auth/middleware";
import { getJobQueueStats, scheduleMaintenanceJobs } from "@/lib/jobs/processor";
import { appJobQueue, emailJobQueue, aiJobQueue, maintenanceJobQueue, JobType, JobPriority } from "@/lib/jobs/queue";

/**
 * GET /api/jobs
 * Get job queue statistics and status
 */
const handleGetJobs = withAuthAndAuthZ({
  role: UserRole.ADMIN, // Admin or higher
})(async (auth) => {
  const stats = await getJobQueueStats();

  return NextResponse.json({
    stats,
    queues: {
      app: {
        name: 'app',
        status: 'active', // TODO: Add actual status tracking
        pollInterval: 5000,
        maxConcurrentJobs: 5,
      },
      email: {
        name: 'email',
        status: 'active',
        pollInterval: 3000,
        maxConcurrentJobs: 3,
      },
      ai: {
        name: 'ai',
        status: 'active',
        pollInterval: 10000,
        maxConcurrentJobs: 2,
      },
      maintenance: {
        name: 'maintenance',
        status: 'active',
        pollInterval: 30000,
        maxConcurrentJobs: 1,
      },
    },
  });
});

/**
 * POST /api/jobs
 * Create a new job
 */
const handleCreateJob = withAuthAndAuthZ({
  role: UserRole.ADMIN, // Admin or higher
})(async (auth, request: NextRequest) => {
  const body = await request.json();
  const { type, data, priority, delay, maxRetries } = body;

  if (!type || !data) {
    return NextResponse.json(
      { error: "Missing required fields: type, data" },
      { status: 400 }
    );
  }

  // Validate job type
  if (!Object.values(JobType).includes(type)) {
    return NextResponse.json(
      { error: `Invalid job type: ${type}` },
      { status: 400 }
    );
  }

  // Determine which queue to use based on job type
  let queue;
  if (type.startsWith('email_')) {
    queue = emailJobQueue;
  } else if (type.startsWith('ai_')) {
    queue = aiJobQueue;
  } else if (type.includes('cleanup') || type.includes('report')) {
    queue = maintenanceJobQueue;
  } else {
    queue = appJobQueue;
  }

  try {
    const jobId = await queue.addJob(type, data, {
      priority: priority || JobPriority.NORMAL,
      delay: delay || 0,
      maxRetries: maxRetries || 3,
      correlationId: `manual_${Date.now()}`,
      createdBy: auth.user.id,
    });

    return NextResponse.json({
      jobId,
      queue: queue['queueName'],
      status: 'scheduled',
    });
  } catch (error) {
    console.error('Failed to create job:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/jobs/maintenance
 * Trigger maintenance jobs
 */
const handleTriggerMaintenance = withAuthAndAuthZ({
  role: UserRole.SUPER_ADMIN, // Only super admins
})(async (auth) => {
  try {
    await scheduleMaintenanceJobs();

    return NextResponse.json({
      message: 'Maintenance jobs scheduled',
      jobs: [
        'cleanup_expired_sessions',
        'generate_reports',
      ],
    });
  } catch (error) {
    console.error('Failed to schedule maintenance jobs:', error);
    return NextResponse.json(
      { error: 'Failed to schedule maintenance jobs' },
      { status: 500 }
    );
  }
});

export const GET = handleGetJobs;
export const POST = handleCreateJob;
