import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Workspace Comments API
   GET /api/email/workspace/comments?threadId=xxx - Get comments for thread
   POST /api/email/workspace/comments - Add comment to thread
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get("threadId");

    if (!threadId) {
      return NextResponse.json(
        { error: "Missing threadId parameter" },
        { status: 400 }
      );
    }

    // Verify user has access to the thread
    const { data: thread } = await supabase
      .from("email_threads")
      .select("tenant_id")
      .eq("id", threadId)
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

    // Get comments for thread
    const { data: comments, error } = await supabase
      .from("email_comments")
      .select(`
        id,
        content,
        mentions,
        is_internal,
        created_at,
        updated_at,
        author_id,
        profiles!email_comments_author_id_fkey (
          full_name,
          email,
          avatar_url
        )
      `)
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Get comments error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ comments: comments || [] });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { thread_id, content, mentions = [], is_internal = true } = body;

    if (!thread_id || !content) {
      return NextResponse.json(
        { error: "Missing required fields: thread_id, content" },
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

    // Create comment
    const { data: comment, error } = await supabase
      .from("email_comments")
      .insert({
        tenant_id: thread.tenant_id,
        thread_id,
        author_id: user.id,
        content,
        mentions,
        is_internal,
      })
      .select(`
        id,
        content,
        mentions,
        is_internal,
        created_at,
        updated_at,
        author_id,
        profiles!email_comments_author_id_fkey (
          full_name,
          email,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error("Create comment error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log audit event
    await supabase.rpc("log_email_event", {
      p_tenant_id: thread.tenant_id,
      p_event_type: "comment",
      p_event_subtype: "added",
      p_user_id: user.id,
      p_thread_id: thread_id,
    });

    return NextResponse.json({
      success: true,
      comment,
    });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}