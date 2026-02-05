import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/chat/conversations/[conversationId]
   Get conversation with messages
   ═══════════════════════════════════════════════════════════════════════════ */

type RouteContext = { params: { conversationId: string } | Promise<{ conversationId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { conversationId } = await Promise.resolve(context.params);
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get conversation with project info
    const { data: conversation, error: convError } = await supabase
      .from("ai_conversations")
      .select("*, project:projects(id, name, color)")
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

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { conversationId } = await Promise.resolve(context.params);
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    const allowedFields = [
      "title", "project_id", "system_prompt", "model", "temperature",
      "attached_notes", "attached_files", "attached_folders",
      "use_memory", "memory_threshold", "is_archived", "is_pinned"
    ];
    
    // Verify project ownership if updating project_id
    if (body.project_id) {
      const { data: project } = await supabase
        .from("projects")
        .select("id")
        .eq("id", body.project_id)
        .eq("owner_id", user.id)
        .single();
      
      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
    }
    
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
      .select("*, project:projects(id, name, color)")
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

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { conversationId } = await Promise.resolve(context.params);
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
