import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { withAuthAndAuthZ, UserRole } from "@/lib/auth/middleware";
import type { CreateNoteRequest, NoteFilters } from "@/types/notes";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/notes
   List notes for the authenticated user
   ═══════════════════════════════════════════════════════════════════════════ */

const handleGetNotes = withAuthAndAuthZ({
  role: UserRole.OWNER, // Owner or higher (includes admin, super_admin)
})(async (auth, request: NextRequest) => {
  const supabase = await createSupabaseServer();
    
    // Parse filters
    const { searchParams } = new URL(request.url);
    const filters: NoteFilters = {};
    const categoryId = searchParams.get("category_id");
    const projectName = searchParams.get("project_name");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const isPinned = searchParams.get("is_pinned");
    const isTemplate = searchParams.get("is_template");

    if (categoryId) filters.category_id = categoryId;
    if (projectName) filters.project_name = projectName;
    if (status) filters.status = status;
    if (search) filters.search = search;
    if (isPinned === "true") filters.is_pinned = true;
    if (isTemplate === "true") filters.is_template = true;
    if (isTemplate === "false") filters.is_template = false;
    
  // Build query
  let query = supabase
    .from("notes")
    .select("*, category:note_categories(*)", { count: "exact" })
    .eq("owner_id", auth.user.id)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });
    
    // Apply filters
    if (filters.category_id) {
      query = query.eq("category_id", filters.category_id);
    }
    if (filters.project_name) {
      query = query.eq("project_name", filters.project_name);
    }
    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.is_pinned !== undefined) {
      query = query.eq("is_pinned", filters.is_pinned);
    }
    if (filters.is_template !== undefined) {
      query = query.eq("is_template", filters.is_template);
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
    }
    
    const { data: notes, error: notesError, count } = await query;
    
    if (notesError) {
      console.error("Failed to fetch notes:", notesError);
      return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
    }
    
  return NextResponse.json({
    notes: notes || [],
    total: count || 0,
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/notes
   Create a new note
   ═══════════════════════════════════════════════════════════════════════════ */

const handleCreateNote = withAuthAndAuthZ({
  role: UserRole.OWNER, // Owner or higher (includes admin, super_admin)
})(async (auth, request: NextRequest) => {
  const supabase = await createSupabaseServer();
    
    // Parse body
    const body: CreateNoteRequest = await request.json();
    const {
      title,
      content = "",
      category_id,
      format = "markdown",
      tags = [],
      metadata = {},
      project_name,
      status = "draft",
      is_pinned = false,
      is_api_accessible = false,
      api_key_id,
    } = body;
    
    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    
  // Generate slug
  const { data: slugData } = await supabase
    .rpc("generate_note_slug", { p_title: title, p_owner_id: auth.user.id });

  const slug = slugData || title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  // Generate excerpt
  const excerpt = content.slice(0, 200).replace(/[#*_`~\[\]()]/g, "");

  // Insert note
  const { data: note, error: insertError } = await supabase
    .from("notes")
    .insert({
      owner_id: auth.user.id,
        title,
        slug,
        content,
        excerpt,
        category_id,
        format,
        tags,
        metadata,
        project_name,
        status,
        is_pinned,
        is_api_accessible,
        api_key_id,
        published_at: status === "published" ? new Date().toISOString() : null,
      })
      .select("*, category:note_categories(*)")
      .single();
    
    if (insertError) {
      console.error("Failed to create note:", insertError);
      return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
    }
    
  return NextResponse.json({ note });
});

// Export the wrapped handlers
export const GET = handleGetNotes;
export const POST = handleCreateNote;
