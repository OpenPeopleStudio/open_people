import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Workspace Assignments API
   POST /api/email/workspace/assignments - Assign thread to user
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { thread_id, assignee_id, due_at, notes } = body;

    if (!thread_id || !assignee_id) {
      return NextResponse.json(
        { error: "Missing required fields: thread_id, assignee_id" },
        { status: 400 }
      );
    }

    // Verify user has access to the thread
    const { data: thread } = await supabase
      .from("email_threads")
      .select("tenant_id")
      .eq("id", thread_id)
      .single();

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Check if user belongs to the tenant
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile || profile.tenant_id !== thread.tenant_id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Create assignment using RPC function
    const { data: assignmentId, error } = await supabase.rpc("assign_thread_to_user", {
      p_thread_id: thread_id,
      p_assignee_id: assignee_id,
      p_assigned_by: user.id,
      p_due_at: due_at,
      p_notes: notes,
    });

    if (error) {
      console.error("Assignment error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      assignment_id: assignmentId,
    });
  } catch (error) {
    console.error("Assignment error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}