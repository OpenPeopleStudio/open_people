import { createClient } from "@/lib/supabase/server";
import { emailWorkspace } from "@/lib/email/workspace";
import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Workspace Suggestions API
   GET /api/email/workspace/suggestions/[threadId] - Get AI suggestions for thread
   POST /api/email/workspace/suggestions/[threadId] - Use a suggestion
   ═══════════════════════════════════════════════════════════════════════════ */

type RouteContext = { params: Promise<{ threadId: string }> };
type AdminRole = "owner" | "admin" | "super_admin";
const ADMIN_ROLES: AdminRole[] = ["owner", "admin", "super_admin"];

export async function GET(request: NextRequest, context: RouteContext) {
  void request;
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { threadId } = await context.params;

    // Verify user has access to the thread
    const { data: thread } = await supabase
      .from("email_threads")
      .select("tenant_id, ai_summary, ai_intent, ai_sentiment, ai_priority_score, ai_processed_at")
      .eq("id", threadId)
      .single();

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Check if user belongs to the tenant
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.tenant_id !== thread.tenant_id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    if (!profile.role || !ADMIN_ROLES.includes(profile.role as AdminRole)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const suggestions = await emailWorkspace.getThreadSuggestions(threadId);

    return NextResponse.json({
      suggestions,
      thread: {
        ai_summary: thread.ai_summary,
        ai_intent: thread.ai_intent,
        ai_sentiment: thread.ai_sentiment,
        ai_priority_score: thread.ai_priority_score,
        ai_processed_at: thread.ai_processed_at,
      },
    });
  } catch (error) {
    console.error("Get suggestions error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { threadId } = await context.params;
    const body = await request.json();
    const { suggestion_id } = body;

    if (!suggestion_id) {
      return NextResponse.json(
        { error: "Missing suggestion_id" },
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
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.tenant_id !== thread.tenant_id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    if (!profile.role || !ADMIN_ROLES.includes(profile.role as AdminRole)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const success = await emailWorkspace.useSuggestion(suggestion_id);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Failed to use suggestion" }, { status: 500 });
    }
  } catch (error) {
    console.error("Use suggestion error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
