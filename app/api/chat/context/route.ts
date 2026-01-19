import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/chat/context
   Get available context items (notes, files, folders) for attachment
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'notes', 'files', 'folders'
    const search = searchParams.get("search");
    
    const result: {
      notes?: { id: string; title: string; project_name: string | null; updated_at: string }[];
      files?: { id: string; filename: string; ai_category: string | null; ai_summary: string | null }[];
      folders?: { id: string; name: string; file_count: number }[];
    } = {};
    
    // Get notes
    if (!type || type === "notes") {
      let notesQuery = supabase
        .from("notes")
        .select("id, title, project_name, updated_at")
        .eq("owner_id", user.id)
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(50);
      
      if (search) {
        notesQuery = notesQuery.ilike("title", `%${search}%`);
      }
      
      const { data: notes } = await notesQuery;
      result.notes = notes || [];
    }
    
    // Get vault files
    if (!type || type === "files") {
      // First get user's vault
      const { data: vault } = await supabase
        .from("vault_spaces")
        .select("id")
        .eq("owner_id", user.id)
        .single();
      
      if (vault) {
        let filesQuery = supabase
          .from("vault_files")
          .select("id, filename, ai_category, ai_summary")
          .eq("vault_id", vault.id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .limit(50);
        
        if (search) {
          filesQuery = filesQuery.ilike("filename", `%${search}%`);
        }
        
        const { data: files } = await filesQuery;
        result.files = files || [];
      } else {
        result.files = [];
      }
    }
    
    // Get vault folders
    if (!type || type === "folders") {
      const { data: vault } = await supabase
        .from("vault_spaces")
        .select("id")
        .eq("owner_id", user.id)
        .single();
      
      if (vault) {
        let foldersQuery = supabase
          .from("vault_folders")
          .select("id, name, file_count")
          .eq("vault_id", vault.id)
          .order("name", { ascending: true })
          .limit(50);
        
        if (search) {
          foldersQuery = foldersQuery.ilike("name", `%${search}%`);
        }
        
        const { data: folders } = await foldersQuery;
        result.folders = folders || [];
      } else {
        result.folders = [];
      }
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error("Context fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
