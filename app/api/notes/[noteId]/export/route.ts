import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/notes/[noteId]/export
   Export a note as markdown file
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: Request, context: any) {
  try {
    const { noteId } = context.params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "md";
    const includeFrontmatter = searchParams.get("frontmatter") !== "false";
    
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get note
    const { data: note, error: noteError } = await supabase
      .from("notes")
      .select("*, category:note_categories(name, slug)")
      .eq("id", noteId)
      .eq("owner_id", user.id)
      .single();
    
    if (noteError || !note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    
    // Build markdown content
    let content = "";
    
    if (includeFrontmatter) {
      const frontmatter: Record<string, unknown> = {
        title: note.title,
        slug: note.slug,
        created: note.created_at,
        updated: note.updated_at,
        version: note.version,
      };
      
      if (note.tags?.length) {
        frontmatter.tags = note.tags;
      }
      if (note.project_name) {
        frontmatter.project = note.project_name;
      }
      if (note.category) {
        frontmatter.category = note.category.name;
      }
      if (Object.keys(note.metadata || {}).length) {
        frontmatter.metadata = note.metadata;
      }
      
      content += "---\n";
      content += Object.entries(frontmatter)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return `${key}:\n${value.map(v => `  - ${v}`).join("\n")}`;
          }
          if (typeof value === "object") {
            return `${key}: ${JSON.stringify(value)}`;
          }
          return `${key}: ${value}`;
        })
        .join("\n");
      content += "\n---\n\n";
    }
    
    content += note.content;
    
    // Set filename
    const filename = `${note.slug}.${format === "mdx" ? "mdx" : "md"}`;
    
    // Return as downloadable file
    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
    
  } catch (error) {
    console.error("Note export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
