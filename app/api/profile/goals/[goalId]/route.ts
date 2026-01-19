import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/profile/goals/[goalId]
   Get a single goal
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    const { goalId } = await params;
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { data: goal, error } = await supabase
      .from("ai_user_goals")
      .select("*")
      .eq("id", goalId)
      .eq("user_id", user.id)
      .single();
    
    if (error || !goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }
    
    return NextResponse.json({ goal });
    
  } catch (error) {
    console.error("Goal fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   PATCH /api/profile/goals/[goalId]
   Update a goal
   ═══════════════════════════════════════════════════════════════════════════ */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    const { goalId } = await params;
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.why_important !== undefined) updates.why_important = body.why_important;
    if (body.category !== undefined) updates.category = body.category;
    if (body.timeframe !== undefined) updates.timeframe = body.timeframe;
    if (body.status !== undefined) {
      updates.status = body.status;
      if (body.status === "achieved") {
        updates.achieved_at = new Date().toISOString();
      }
    }
    if (body.progress !== undefined) updates.progress = body.progress;
    if (body.milestones !== undefined) updates.milestones = body.milestones;
    if (body.lessons_learned !== undefined) updates.lessons_learned = body.lessons_learned;
    if (body.target_date !== undefined) updates.target_date = body.target_date;
    
    const { data: goal, error } = await supabase
      .from("ai_user_goals")
      .update(updates)
      .eq("id", goalId)
      .eq("user_id", user.id)
      .select()
      .single();
    
    if (error) {
      console.error("Failed to update goal:", error);
      return NextResponse.json({ error: "Failed to update goal" }, { status: 500 });
    }
    
    return NextResponse.json({ goal });
    
  } catch (error) {
    console.error("Goal update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   DELETE /api/profile/goals/[goalId]
   Delete a goal
   ═══════════════════════════════════════════════════════════════════════════ */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ goalId: string }> }
) {
  try {
    const { goalId } = await params;
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { error } = await supabase
      .from("ai_user_goals")
      .delete()
      .eq("id", goalId)
      .eq("user_id", user.id);
    
    if (error) {
      console.error("Failed to delete goal:", error);
      return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Goal delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
