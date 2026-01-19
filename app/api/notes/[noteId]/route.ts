import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { UpdateNoteRequest } from "@/types/notes";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/notes/[noteId]
   Get a single note with version history
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { noteId } = await params;
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get note
    const { data: note, error: noteError } = await supabase
      .from("notes")
      .select("*, category:note_categories(*)")
      .eq("id", noteId)
      .eq("owner_id", user.id)
      .single();
    
    if (noteError || !note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    
    // Get recent versions
    const { data: versions } = await supabase
      .from("note_versions")
      .select("*")
      .eq("note_id", noteId)
      .order("version", { ascending: false })
      .limit(10);
    
    // Get backlinks (notes that link to this one)
    const { data: backlinks } = await supabase
      .from("note_links")
      .select("source_note_id, context, notes!note_links_source_note_id_fkey(id, title, slug)")
      .eq("target_note_id", noteId);
    
    return NextResponse.json({
      note,
      versions: versions || [],
      backlinks: backlinks || [],
    });
    
  } catch (error) {
    console.error("Note fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   PATCH /api/notes/[noteId]
   Update a note
   ═══════════════════════════════════════════════════════════════════════════ */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { noteId } = await params;
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Verify ownership
    const { data: existing } = await supabase
      .from("notes")
      .select("id, status")
      .eq("id", noteId)
      .eq("owner_id", user.id)
      .single();
    
    if (!existing) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    
    // Parse body
    const body: UpdateNoteRequest = await request.json();
    const {
      title,
      content,
      category_id,
      format,
      tags,
      metadata,
      project_name,
      status,
      is_pinned,
      is_api_accessible,
      api_key_id,
    } = body;
    
    // Build update object
    const updates: Record<string, unknown> = {};
    
    if (title !== undefined) updates.title = title;
    if (content !== undefined) {
      updates.content = content;
      updates.excerpt = content.slice(0, 200).replace(/[#*_`~\[\]()]/g, "");
    }
    if (category_id !== undefined) updates.category_id = category_id;
    if (format !== undefined) updates.format = format;
    if (tags !== undefined) updates.tags = tags;
    if (metadata !== undefined) updates.metadata = metadata;
    if (project_name !== undefined) updates.project_name = project_name;
    if (status !== undefined) {
      updates.status = status;
      if (status === "published" && existing.status !== "published") {
        updates.published_at = new Date().toISOString();
      }
    }
    if (is_pinned !== undefined) updates.is_pinned = is_pinned;
    if (is_api_accessible !== undefined) updates.is_api_accessible = is_api_accessible;
    if (api_key_id !== undefined) updates.api_key_id = api_key_id;
    
    // Update note (version trigger handles versioning)
    const { data: note, error: updateError } = await supabase
      .from("notes")
      .update(updates)
      .eq("id", noteId)
      .select("*, category:note_categories(*)")
      .single();
    
    if (updateError) {
      console.error("Failed to update note:", updateError);
      return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
    }
    
    return NextResponse.json({ note });
    
  } catch (error) {
    console.error("Note update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   DELETE /api/notes/[noteId]
   Delete a note
   ═══════════════════════════════════════════════════════════════════════════ */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { noteId } = await params;
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Delete (RLS handles ownership check)
    const { error: deleteError } = await supabase
      .from("notes")
      .delete()
      .eq("id", noteId)
      .eq("owner_id", user.id);
    
    if (deleteError) {
      console.error("Failed to delete note:", deleteError);
      return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Note delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
