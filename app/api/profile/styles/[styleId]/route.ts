import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/* ═══════════════════════════════════════════════════════════════════════════
   DELETE /api/profile/styles/[styleId]
   Delete a custom conversation style
   ═══════════════════════════════════════════════════════════════════════════ */

export async function DELETE(request: Request, context: any) {
  void request;
  try {
    const supabase = await createSupabaseServer();
    const { styleId } = context.params;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Only allow deleting user's own styles (not system styles)
    const { error } = await supabase
      .from("ai_conversation_styles")
      .delete()
      .eq("id", styleId)
      .eq("user_id", user.id);
    
    if (error) {
      console.error("Failed to delete style:", error);
      return NextResponse.json({ error: "Failed to delete style" }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Style delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   PATCH /api/profile/styles/[styleId]
   Update a custom conversation style
   ═══════════════════════════════════════════════════════════════════════════ */

export async function PATCH(request: Request, context: any) {
  void request;
  try {
    const supabase = await createSupabaseServer();
    const { styleId } = context.params;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Build updates object
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.communication_style !== undefined) updates.communication_style = body.communication_style;
    if (body.formality_level !== undefined) updates.formality_level = body.formality_level;
    if (body.detail_preference !== undefined) updates.detail_preference = body.detail_preference;
    if (body.emotional_support_level !== undefined) updates.emotional_support_level = body.emotional_support_level;
    if (body.challenge_me !== undefined) updates.challenge_me = body.challenge_me;
    if (body.use_analogies !== undefined) updates.use_analogies = body.use_analogies;
    if (body.use_humor !== undefined) updates.use_humor = body.use_humor;
    if (body.be_philosophical !== undefined) updates.be_philosophical = body.be_philosophical;
    if (body.action_oriented !== undefined) updates.action_oriented = body.action_oriented;
    if (body.custom_instructions !== undefined) updates.custom_instructions = body.custom_instructions;
    
    const { data: style, error } = await supabase
      .from("ai_conversation_styles")
      .update(updates)
      .eq("id", styleId)
      .eq("user_id", user.id) // Only allow updating user's own styles
      .select()
      .single();
    
    if (error) {
      console.error("Failed to update style:", error);
      return NextResponse.json({ error: "Failed to update style" }, { status: 500 });
    }
    
    return NextResponse.json({ style });
    
  } catch (error) {
    console.error("Style update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
