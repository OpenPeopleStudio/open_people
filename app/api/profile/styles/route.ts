import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/profile/styles
   Get conversation styles (system + user's custom)
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get system styles (user_id is null) and user's custom styles
    const { data: styles, error } = await supabase
      .from("ai_conversation_styles")
      .select("*")
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .order("user_id", { ascending: true, nullsFirst: true })
      .order("name", { ascending: true });
    
    if (error) {
      console.error("Failed to fetch styles:", error);
      return NextResponse.json({ error: "Failed to fetch styles" }, { status: 500 });
    }
    
    // Separate system and custom styles
    const systemStyles = styles?.filter(s => !s.user_id) || [];
    const customStyles = styles?.filter(s => s.user_id) || [];
    
    return NextResponse.json({
      system_styles: systemStyles,
      custom_styles: customStyles,
    });
    
  } catch (error) {
    console.error("Styles fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/profile/styles
   Create a custom conversation style
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    
    const { data: style, error } = await supabase
      .from("ai_conversation_styles")
      .insert({
        user_id: user.id,
        name: body.name.trim(),
        description: body.description,
        communication_style: body.communication_style,
        formality_level: body.formality_level,
        detail_preference: body.detail_preference,
        emotional_support_level: body.emotional_support_level,
        challenge_me: body.challenge_me,
        use_analogies: body.use_analogies,
        use_humor: body.use_humor,
        be_philosophical: body.be_philosophical,
        action_oriented: body.action_oriented,
        custom_instructions: body.custom_instructions,
      })
      .select()
      .single();
    
    if (error) {
      console.error("Failed to create style:", error);
      return NextResponse.json({ error: "Failed to create style" }, { status: 500 });
    }
    
    return NextResponse.json({ style });
    
  } catch (error) {
    console.error("Style create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
