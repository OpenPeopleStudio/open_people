import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { CreateNoteRequest, NoteFilters } from "@/types/notes";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/notes
   List notes for the authenticated user
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get profile to check permissions (super_admin, owner, or admin can access notes)
    const { data: profile } = await supabase
      .from("709_profiles")
      .select("role, tenant_id")
      .eq("id", user.id)
      .single();
    
    const allowedRoles = ["super_admin", "owner", "admin"];
    if (!profile || !allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    // Parse filters
    const { searchParams } = new URL(request.url);
    const filters: NoteFilters = {
      category_id: searchParams.get("category_id") || undefined,
      project_name: searchParams.get("project_name") || undefined,
      status: searchParams.get("status") || undefined,
      is_pinned: searchParams.get("is_pinned") === "true" ? true : undefined,
      is_template: searchParams.get("is_template") === "true" ? true : 
                   searchParams.get("is_template") === "false" ? false : undefined,
      search: searchParams.get("search") || undefined,
    };
    
    // Build query
    let query = supabase
      .from("notes")
      .select("*, category:note_categories(*)", { count: "exact" })
      .eq("owner_id", user.id)
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
    
  } catch (error) {
    console.error("Notes fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/notes
   Create a new note
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get profile to check permissions (super_admin, owner, or admin can create notes)
    const { data: profile } = await supabase
      .from("709_profiles")
      .select("role, tenant_id")
      .eq("id", user.id)
      .single();
    
    const allowedRoles = ["super_admin", "owner", "admin"];
    if (!profile || !allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
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
      .rpc("generate_note_slug", { p_title: title, p_owner_id: user.id });
    
    const slug = slugData || title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    
    // Generate excerpt
    const excerpt = content.slice(0, 200).replace(/[#*_`~\[\]()]/g, "");
    
    // Insert note
    const { data: note, error: insertError } = await supabase
      .from("notes")
      .insert({
        owner_id: user.id,
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
    
  } catch (error) {
    console.error("Note create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
