import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { recordFeedback, getFeedbackSummary } from "@/lib/workflows/observability";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/ai/feedback
   Get feedback summary
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    
    const summary = await getFeedbackSummary(supabase, user.id, days);
    
    return NextResponse.json(summary);
    
  } catch (error) {
    console.error("Feedback fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/ai/feedback
   Record feedback for an AI response
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    
    if (!body.rating || !["good", "bad", "neutral"].includes(body.rating)) {
      return NextResponse.json({ error: "Valid rating is required" }, { status: 400 });
    }
    
    const feedback = await recordFeedback(supabase, user.id, {
      runId: body.run_id,
      messageId: body.message_id,
      rating: body.rating,
      ratingScore: body.rating_score,
      feedbackType: body.feedback_type,
      feedbackText: body.feedback_text,
      issues: body.issues,
      expectedAnswer: body.expected_answer,
    });
    
    if (!feedback) {
      return NextResponse.json({ error: "Failed to record feedback" }, { status: 500 });
    }
    
    return NextResponse.json({ feedback });
    
  } catch (error) {
    console.error("Feedback record error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
