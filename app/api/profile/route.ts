import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { UpdateProfileRequest } from "@/types/ai-profile";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/profile
   Get current user's AI profile
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Try to get existing profile
    let { data: profile, error } = await supabase
      .from("ai_user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    
    // If no profile exists, create one
    if (error?.code === "PGRST116" || !profile) {
      const { data: newProfile, error: createError } = await supabase
        .from("ai_user_profiles")
        .insert({ user_id: user.id })
        .select()
        .single();
      
      if (createError) {
        console.error("Failed to create profile:", createError);
        return NextResponse.json({ error: "Failed to create profile", details: createError.message }, { status: 500 });
      }
      
      profile = newProfile;
    }
    
    // Get active goals
    const { data: goals } = await supabase
      .from("ai_user_goals")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false });
    
    return NextResponse.json({
      profile,
      goals: goals || [],
    });
    
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   PATCH /api/profile
   Update user's AI profile
   ═══════════════════════════════════════════════════════════════════════════ */

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body: UpdateProfileRequest = await request.json();
    
    // Build updates object (only include provided fields)
    const updates: Record<string, unknown> = {};
    
    // Identity
    if (body.preferred_name !== undefined) updates.preferred_name = body.preferred_name;
    if (body.self_description !== undefined) updates.self_description = body.self_description;
    if (body.roles !== undefined) updates.roles = body.roles;
    
    // Purpose
    if (body.core_why !== undefined) updates.core_why = body.core_why;
    if (body.mission_statement !== undefined) updates.mission_statement = body.mission_statement;
    if (body.long_term_vision !== undefined) updates.long_term_vision = body.long_term_vision;
    if (body.core_values !== undefined) updates.core_values = body.core_values;
    
    // Strengths
    if (body.strengths !== undefined) updates.strengths = body.strengths;
    if (body.growth_areas !== undefined) updates.growth_areas = body.growth_areas;
    if (body.passions !== undefined) updates.passions = body.passions;
    if (body.expertise_areas !== undefined) updates.expertise_areas = body.expertise_areas;
    if (body.learning_goals !== undefined) updates.learning_goals = body.learning_goals;
    
    // Communication
    if (body.communication_style !== undefined) updates.communication_style = body.communication_style;
    if (body.formality_level !== undefined) updates.formality_level = body.formality_level;
    if (body.detail_preference !== undefined) updates.detail_preference = body.detail_preference;
    if (body.emotional_support_level !== undefined) updates.emotional_support_level = body.emotional_support_level;
    if (body.challenge_me !== undefined) updates.challenge_me = body.challenge_me;
    if (body.celebrate_wins !== undefined) updates.celebrate_wins = body.celebrate_wins;
    if (body.use_analogies !== undefined) updates.use_analogies = body.use_analogies;
    if (body.use_humor !== undefined) updates.use_humor = body.use_humor;
    if (body.be_philosophical !== undefined) updates.be_philosophical = body.be_philosophical;
    if (body.action_oriented !== undefined) updates.action_oriented = body.action_oriented;
    
    // Context
    if (body.current_focus !== undefined) updates.current_focus = body.current_focus;
    if (body.current_challenges !== undefined) updates.current_challenges = body.current_challenges;
    if (body.life_stage !== undefined) updates.life_stage = body.life_stage;
    if (body.important_context !== undefined) updates.important_context = body.important_context;
    
    // Boundaries
    if (body.topics_to_avoid !== undefined) updates.topics_to_avoid = body.topics_to_avoid;
    if (body.sensitive_areas !== undefined) updates.sensitive_areas = body.sensitive_areas;
    
    // Upsert profile
    const { data: profile, error: updateError } = await supabase
      .from("ai_user_profiles")
      .upsert({
        user_id: user.id,
        ...updates,
      }, {
        onConflict: "user_id",
      })
      .select()
      .single();
    
    if (updateError) {
      console.error("Failed to update profile:", updateError);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
    
    return NextResponse.json({ profile });
    
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
