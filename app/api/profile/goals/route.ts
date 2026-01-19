import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { CreateGoalRequest } from "@/types/ai-profile";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/profile/goals
   Get user's goals
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    
    let query = supabase
      .from("ai_user_goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    if (status) {
      query = query.eq("status", status);
    }
    
    if (category) {
      query = query.eq("category", category);
    }
    
    const { data: goals, error } = await query;
    
    if (error) {
      console.error("Failed to fetch goals:", error);
      return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
    }
    
    return NextResponse.json({ goals: goals || [] });
    
  } catch (error) {
    console.error("Goals fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/profile/goals
   Create a new goal
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body: CreateGoalRequest = await request.json();
    
    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    
    const { data: goal, error } = await supabase
      .from("ai_user_goals")
      .insert({
        user_id: user.id,
        title: body.title.trim(),
        description: body.description,
        why_important: body.why_important,
        category: body.category,
        timeframe: body.timeframe,
        target_date: body.target_date,
        milestones: body.milestones || [],
      })
      .select()
      .single();
    
    if (error) {
      console.error("Failed to create goal:", error);
      return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
    }
    
    return NextResponse.json({ goal });
    
  } catch (error) {
    console.error("Goal create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
