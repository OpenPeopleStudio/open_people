import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/chat/actions/note
   Create a note from chat - lightweight endpoint for quick note creation
   ═══════════════════════════════════════════════════════════════════════════ */

interface CreateNoteFromChatRequest {
  title: string;
  content: string;
  project_id?: string;
  conversation_id?: string;
  message_id?: string;
  tags?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body: CreateNoteFromChatRequest = await request.json();
    const { title, content, project_id, conversation_id, message_id, tags = [] } = body;
    
    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    
    // Get project name if project_id provided
    let projectName: string | null = null;
    if (project_id) {
      const { data: project } = await supabase
        .from("projects")
        .select("name")
        .eq("id", project_id)
        .eq("owner_id", user.id)
        .single();
      
      if (project) {
        projectName = project.name;
      }
    }
    
    // Generate slug
    const { data: slugData } = await supabase
      .rpc("generate_note_slug", { p_title: title, p_owner_id: user.id });
    
    const slug = slugData || title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    
    // Generate excerpt
    const excerpt = content.slice(0, 200).replace(/[#*_`~\[\]()]/g, "");
    
    // Build metadata to track source
    const metadata: Record<string, unknown> = {
      source: "chat",
    };
    if (conversation_id) metadata.source_conversation_id = conversation_id;
    if (message_id) metadata.source_message_id = message_id;
    
    // Insert note
    const { data: note, error: insertError } = await supabase
      .from("notes")
      .insert({
        owner_id: user.id,
        title: title.trim(),
        slug,
        content,
        excerpt,
        format: "markdown",
        tags: ["from-chat", ...tags],
        metadata,
        project_name: projectName,
        status: "draft",
        is_pinned: false,
        is_api_accessible: false,
      })
      .select("*, category:note_categories(*)")
      .single();
    
    if (insertError) {
      console.error("Failed to create note:", insertError);
      return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
    }
    
    return NextResponse.json({ 
      note,
      message: `Note "${note.title}" created successfully`,
    });
    
  } catch (error) {
    console.error("Note create from chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
