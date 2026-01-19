import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/chat/conversations/[conversationId]
   Get conversation with messages
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get conversation
    const { data: conversation, error: convError } = await supabase
      .from("ai_conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("owner_id", user.id)
      .single();
    
    if (convError || !conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    
    // Get messages
    const { data: messages } = await supabase
      .from("ai_messages")
      .select("*, attachments:ai_message_attachments(*)")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    
    return NextResponse.json({
      conversation,
      messages: messages || [],
    });
    
  } catch (error) {
    console.error("Conversation fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   PATCH /api/chat/conversations/[conversationId]
   Update conversation settings
   ═══════════════════════════════════════════════════════════════════════════ */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    const allowedFields = [
      "title", "system_prompt", "model", "temperature",
      "attached_notes", "attached_files", "attached_folders",
      "use_memory", "memory_threshold", "is_archived", "is_pinned"
    ];
    
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }
    
    const { data: conversation, error: updateError } = await supabase
      .from("ai_conversations")
      .update(updates)
      .eq("id", conversationId)
      .eq("owner_id", user.id)
      .select()
      .single();
    
    if (updateError) {
      console.error("Failed to update conversation:", updateError);
      return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 });
    }
    
    return NextResponse.json({ conversation });
    
  } catch (error) {
    console.error("Conversation update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   DELETE /api/chat/conversations/[conversationId]
   Delete conversation
   ═══════════════════════════════════════════════════════════════════════════ */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { error: deleteError } = await supabase
      .from("ai_conversations")
      .delete()
      .eq("id", conversationId)
      .eq("owner_id", user.id);
    
    if (deleteError) {
      console.error("Failed to delete conversation:", deleteError);
      return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Conversation delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
