import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/notes/[noteId]/links
   Get links for a specific note
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { noteId } = await params;
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get outgoing links (this note links to others)
    const { data: outgoingLinks } = await supabase
      .from("note_links")
      .select(`
        id,
        link_type,
        context,
        target_note:notes!note_links_target_note_id_fkey(id, title, slug)
      `)
      .eq("source_note_id", noteId);
    
    // Get incoming links (others link to this note)
    const { data: incomingLinks } = await supabase
      .from("note_links")
      .select(`
        id,
        link_type,
        context,
        source_note:notes!note_links_source_note_id_fkey(id, title, slug)
      `)
      .eq("target_note_id", noteId);
    
    return NextResponse.json({
      outgoing: outgoingLinks || [],
      incoming: incomingLinks || [],
    });
    
  } catch (error) {
    console.error("Note links error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/notes/[noteId]/links
   Parse note content and update links
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { noteId } = await params;
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get the note's content
    const { data: note, error: noteError } = await supabase
      .from("notes")
      .select("id, content, owner_id")
      .eq("id", noteId)
      .eq("owner_id", user.id)
      .single();
    
    if (noteError || !note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    
    // Parse content for [[slug]] or [[title]] patterns (Obsidian style)
    const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
    const matches: { match: string; slug: string; context: string }[] = [];
    let match;
    
    while ((match = wikiLinkRegex.exec(note.content)) !== null) {
      const linkText = match[1];
      // Get surrounding context (50 chars before and after)
      const start = Math.max(0, match.index - 50);
      const end = Math.min(note.content.length, match.index + match[0].length + 50);
      const context = note.content.slice(start, end);
      
      // Convert to slug format
      const slug = linkText
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      
      matches.push({ match: linkText, slug, context });
    }
    
    // Also parse markdown links [text](/super-admin/notes/id) or [text](slug)
    const mdLinkRegex = /\[([^\]]+)\]\((?:\/super-admin\/notes\/)?([a-f0-9-]+|[a-z0-9-]+)\)/g;
    while ((match = mdLinkRegex.exec(note.content)) !== null) {
      const idOrSlug = match[2];
      const start = Math.max(0, match.index - 50);
      const end = Math.min(note.content.length, match.index + match[0].length + 50);
      const context = note.content.slice(start, end);
      
      matches.push({ match: match[1], slug: idOrSlug, context });
    }
    
    if (matches.length === 0) {
      return NextResponse.json({ 
        links_created: 0, 
        links_removed: 0,
        message: "No links found in content" 
      });
    }
    
    // Find matching notes by slug or ID
    const slugsAndIds = [...new Set(matches.map(m => m.slug))];
    
    const { data: targetNotes } = await supabase
      .from("notes")
      .select("id, slug")
      .eq("owner_id", user.id)
      .or(`slug.in.(${slugsAndIds.join(",")}),id.in.(${slugsAndIds.join(",")})`);
    
    const slugToId = new Map<string, string>();
    for (const tn of targetNotes || []) {
      slugToId.set(tn.slug, tn.id);
      slugToId.set(tn.id, tn.id);
    }
    
    // Get existing links
    const { data: existingLinks } = await supabase
      .from("note_links")
      .select("id, target_note_id")
      .eq("source_note_id", noteId);
    
    const existingTargets = new Set((existingLinks || []).map(l => l.target_note_id));
    
    // Create new links
    const newLinks: { source_note_id: string; target_note_id: string; link_type: string; context: string }[] = [];
    
    for (const m of matches) {
      const targetId = slugToId.get(m.slug);
      if (targetId && targetId !== noteId && !existingTargets.has(targetId)) {
        newLinks.push({
          source_note_id: noteId,
          target_note_id: targetId,
          link_type: "reference",
          context: m.context,
        });
        existingTargets.add(targetId); // Prevent duplicates
      }
    }
    
    if (newLinks.length > 0) {
      await supabase.from("note_links").insert(newLinks);
    }
    
    // Optionally remove links that are no longer in content
    const currentTargets = new Set(matches.map(m => slugToId.get(m.slug)).filter(Boolean));
    const linksToRemove = (existingLinks || [])
      .filter(l => !currentTargets.has(l.target_note_id))
      .map(l => l.id);
    
    if (linksToRemove.length > 0) {
      await supabase.from("note_links").delete().in("id", linksToRemove);
    }
    
    return NextResponse.json({
      links_created: newLinks.length,
      links_removed: linksToRemove.length,
      total_matches: matches.length,
    });
    
  } catch (error) {
    console.error("Parse links error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
