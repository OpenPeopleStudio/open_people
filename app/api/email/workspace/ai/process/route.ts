import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Email AI Processing API
   POST /api/email/workspace/ai/process - Queue message for AI processing
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message_id, tasks = ["summarize", "classify", "suggest_reply"] } = body;

    if (!message_id) {
      return NextResponse.json(
        { error: "Missing message_id" },
        { status: 400 }
      );
    }

    // Verify user has access to the message
    const { data: message } = await supabase
      .from("email_messages")
      .select("tenant_id, thread_id")
      .eq("id", message_id)
      .single();

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Check if user belongs to the tenant
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile || profile.tenant_id !== message.tenant_id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if already queued
    const { data: existingQueue } = await supabase
      .from("email_ai_queue")
      .select("id, status")
      .eq("message_id", message_id)
      .single();

    if (existingQueue && existingQueue.status !== "failed") {
      return NextResponse.json({
        success: true,
        status: existingQueue.status,
        message: "Already queued for processing",
      });
    }

    // Queue for AI processing
    const { data: queueEntry, error: queueError } = await supabase
      .from("email_ai_queue")
      .insert({
        tenant_id: message.tenant_id,
        message_id,
        thread_id: message.thread_id,
        tasks,
        priority: 0,
      })
      .select()
      .single();

    if (queueError) {
      console.error("Queue AI processing error:", queueError);
      return NextResponse.json({ error: queueError.message }, { status: 500 });
    }

    // TODO: Trigger actual AI job processing (integrate with job queue system)
    // For now, we'll rely on a background job processor

    return NextResponse.json({
      success: true,
      queue_id: queueEntry.id,
      message: "Queued for AI processing",
    });
  } catch (error) {
    console.error("AI processing error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}