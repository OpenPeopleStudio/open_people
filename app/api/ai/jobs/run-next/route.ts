import { NextRequest, NextResponse } from "next/server";
import { runOneJob } from "@/lib/ai/jobs/runner";

export const runtime = "nodejs";

/* ═══════════════════════════════════════════════════════════════════════════
   AI Worker Runner Trigger (Production-friendly)

   POST /api/ai/jobs/run-next
   - Claims and runs at most ONE job, then returns.
   - Intended for cron / external worker calls.

   Security:
   - Requires header: x-ai-runner-secret: <AI_RUNNER_SECRET>
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-ai-runner-secret");
  if (!process.env.AI_RUNNER_SECRET || secret !== process.env.AI_RUNNER_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ran = await runOneJob();
    return NextResponse.json({ ran }, { status: 200 });
  } catch (err) {
    console.error("POST /api/ai/jobs/run-next error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Runner error" },
      { status: 500 }
    );
  }
}

