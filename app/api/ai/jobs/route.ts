import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ensureAIWorkerRunnerStarted } from "@/lib/ai/jobs/runner";

import type { AIWorkerId, AIWorkerJobType } from "@/types/ai-jobs";

/* ═══════════════════════════════════════════════════════════════════════════
   AI Worker Jobs API (Async runs)

   POST /api/ai/jobs
     - Enqueue a durable background job for a worker
     - Returns immediately with { job }
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      worker_id: AIWorkerId;
      job_type: AIWorkerJobType;
      input: Record<string, unknown>;
    };

    if (!body?.worker_id || !body?.job_type) {
      return NextResponse.json(
        { error: "worker_id and job_type are required" },
        { status: 400 }
      );
    }

    // Tenant context (optional)
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    const tenantId = profile?.tenant_id ?? null;

    const { data: job, error } = await supabase
      .from("ai_worker_jobs")
      .insert({
        owner_id: user.id,
        tenant_id: tenantId,
        worker_id: body.worker_id,
        job_type: body.job_type,
        status: "queued",
        input: body.input || {},
      })
      .select("*")
      .single();

    if (error || !job) {
      console.error("Failed to create ai_worker_job:", error);
      return NextResponse.json(
        { error: "Failed to enqueue job" },
        { status: 500 }
      );
    }

    // Ensure the in-process runner is active (dev or opt-in).
    ensureAIWorkerRunnerStarted();

    return NextResponse.json({ job }, { status: 202 });
  } catch (err) {
    console.error("POST /api/ai/jobs error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

