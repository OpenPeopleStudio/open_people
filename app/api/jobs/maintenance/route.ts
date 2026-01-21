/**
 * Job Maintenance API
 *
 * Handles maintenance operations for the job queue system.
 */

import { NextResponse } from "next/server";
import { withAuthAndAuthZ, UserRole } from "@/lib/auth/middleware";
import { scheduleMaintenanceJobs } from "@/lib/jobs/processor";

/**
 * POST /api/jobs/maintenance
 * Trigger maintenance jobs manually
 */
const handleTriggerMaintenance = withAuthAndAuthZ({
  role: UserRole.SUPER_ADMIN, // Only super admins
})(async (auth) => {
  try {
    await scheduleMaintenanceJobs();

    return NextResponse.json({
      message: 'Maintenance jobs scheduled successfully',
      jobs: [
        {
          type: 'cleanup_expired_sessions',
          description: 'Remove expired vault sessions',
          priority: 'low',
        },
        {
          type: 'generate_reports',
          description: 'Generate daily usage reports',
          priority: 'normal',
        },
      ],
      scheduled_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to schedule maintenance jobs:', error);
    return NextResponse.json(
      { error: 'Failed to schedule maintenance jobs' },
      { status: 500 }
    );
  }
});

export const POST = handleTriggerMaintenance;