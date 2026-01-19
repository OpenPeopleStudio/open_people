import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { CreateConversationRequest } from "@/types/ai-chat";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/chat/conversations
   List conversations
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Parse query params
    const { searchParams } = new URL(request.url);
    const archived = searchParams.get("archived") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");
    
    // Fetch conversations
    let query = supabase
      .from("ai_conversations")
      .select("*")
      .eq("owner_id", user.id)
      .eq("is_archived", archived)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(limit);
    
    const { data: conversations, error } = await query;
    
    if (error) {
      console.error("Failed to fetch conversations:", error);
      return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
    }
    
    return NextResponse.json({ conversations: conversations || [] });
    
  } catch (error) {
    console.error("Conversations fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/chat/conversations
   Create a new conversation
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body: CreateConversationRequest = await request.json();
    const {
      title,
      system_prompt,
      model = "gpt-4o",
      temperature = 0.7,
      attached_notes = [],
      attached_files = [],
      attached_folders = [],
      use_memory = true,
    } = body;
    
    // Create conversation
    const { data: conversation, error: insertError } = await supabase
      .from("ai_conversations")
      .insert({
        owner_id: user.id,
        title,
        system_prompt,
        model,
        temperature,
        attached_notes,
        attached_files,
        attached_folders,
        use_memory,
      })
      .select()
      .single();
    
    if (insertError) {
      console.error("Failed to create conversation:", insertError);
      return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
    }
    
    return NextResponse.json({ conversation });
    
  } catch (error) {
    console.error("Conversation create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
