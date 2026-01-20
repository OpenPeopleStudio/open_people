import { NextRequest, NextResponse } from "next/server";
import { runDispatchCycle } from "@/lib/events/dispatcher";

/* ═══════════════════════════════════════════════════════════════════════════
   Event Dispatch API
   POST /api/events/dispatch - Run a dispatch cycle (for cron/scheduler)
   GET  /api/events/dispatch - Check dispatcher status

   This endpoint is designed to be called by:
   - Vercel Cron Jobs
   - External schedulers (AWS EventBridge, etc.)
   - Manual triggers for debugging

   Authentication: Requires CRON_SECRET or service role
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const batchSize = typeof body.batch_size === "number" ? body.batch_size : undefined;
    const retryBatchSize = typeof body.retry_batch_size === "number" ? body.retry_batch_size : undefined;

    const result = await runDispatchCycle({
      batchSize,
      retryBatchSize,
    });

    return NextResponse.json({
      success: true,
      dispatched: {
        pending: result.pending,
        retries: result.retries,
      },
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[api/events/dispatch] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Simple health check / status endpoint
  return NextResponse.json({
    status: "ok",
    dispatcher: "event-backbone",
    timestamp: new Date().toISOString(),
  });
}
