import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/notes/[noteId]/versions
   Get all versions of a note
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
    
    // Verify ownership of parent note
    const { data: note } = await supabase
      .from("notes")
      .select("id")
      .eq("id", noteId)
      .eq("owner_id", user.id)
      .single();
    
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    
    // Get all versions
    const { data: versions, error: versionsError } = await supabase
      .from("note_versions")
      .select("*")
      .eq("note_id", noteId)
      .order("version", { ascending: false });
    
    if (versionsError) {
      console.error("Failed to fetch versions:", versionsError);
      return NextResponse.json({ error: "Failed to fetch versions" }, { status: 500 });
    }
    
    return NextResponse.json({ versions: versions || [] });
    
  } catch (error) {
    console.error("Versions fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/notes/[noteId]/versions/restore
   Restore a note to a specific version
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(
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
    
    // Parse body
    const { version } = await request.json();
    
    if (!version) {
      return NextResponse.json({ error: "Version number required" }, { status: 400 });
    }
    
    // Get the version to restore
    const { data: versionData, error: versionError } = await supabase
      .from("note_versions")
      .select("*")
      .eq("note_id", noteId)
      .eq("version", version)
      .single();
    
    if (versionError || !versionData) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }
    
    // Update note with version content (this will create a new version)
    const { data: note, error: updateError } = await supabase
      .from("notes")
      .update({
        title: versionData.title,
        content: versionData.content,
        metadata: {
          ...versionData.metadata,
          restored_from_version: version,
        },
      })
      .eq("id", noteId)
      .eq("owner_id", user.id)
      .select("*, category:note_categories(*)")
      .single();
    
    if (updateError) {
      console.error("Failed to restore version:", updateError);
      return NextResponse.json({ error: "Failed to restore version" }, { status: 500 });
    }
    
    return NextResponse.json({ note });
    
  } catch (error) {
    console.error("Version restore error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
