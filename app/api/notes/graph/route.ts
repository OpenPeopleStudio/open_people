import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/notes/graph
   Get notes and their connections for graph visualization
   ═══════════════════════════════════════════════════════════════════════════ */

export interface GraphNode {
  id: string;
  title: string;
  slug: string;
  category_id: string | null;
  category_name: string | null;
  category_color: string | null;
  project_name: string | null;
  tags: string[];
  status: string;
  created_at: string;
  updated_at: string;
  connection_count: number;
  content_length: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  link_type: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    total_notes: number;
    total_connections: number;
    orphan_notes: number;
    most_connected: { id: string; title: string; count: number } | null;
    categories: { id: string; name: string; color: string; count: number }[];
    projects: { name: string; count: number }[];
  };
}

type NoteCategory = {
  name?: string | null;
  color?: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("category_id");
    const projectName = searchParams.get("project_name");
    const includeArchived = searchParams.get("include_archived") === "true";
    
    // Fetch all notes
    let notesQuery = supabase
      .from("notes")
      .select(`
        id,
        title,
        slug,
        category_id,
        project_name,
        tags,
        status,
        content,
        created_at,
        updated_at,
        category:note_categories(id, name, color)
      `)
      .eq("owner_id", user.id)
      .eq("is_template", false);
    
    if (!includeArchived) {
      notesQuery = notesQuery.neq("status", "archived");
    }
    
    if (categoryId) {
      notesQuery = notesQuery.eq("category_id", categoryId);
    }
    
    if (projectName) {
      notesQuery = notesQuery.eq("project_name", projectName);
    }
    
    const { data: notes, error: notesError } = await notesQuery;
    
    if (notesError) {
      console.error("Failed to fetch notes:", notesError);
      return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
    }
    
    // Fetch all links between notes
    const noteIds = (notes || []).map(n => n.id);
    
    const { data: links, error: linksError } = await supabase
      .from("note_links")
      .select("id, source_note_id, target_note_id, link_type")
      .or(`source_note_id.in.(${noteIds.join(",")}),target_note_id.in.(${noteIds.join(",")})`);
    
    if (linksError) {
      console.error("Failed to fetch links:", linksError);
      // Continue without links
    }
    
    // Filter links to only include those where both notes are in our set
    const noteIdSet = new Set(noteIds);
    const validLinks = (links || []).filter(
      link => noteIdSet.has(link.source_note_id) && noteIdSet.has(link.target_note_id)
    );
    
    // Count connections per note
    const connectionCounts: Record<string, number> = {};
    for (const link of validLinks) {
      connectionCounts[link.source_note_id] = (connectionCounts[link.source_note_id] || 0) + 1;
      connectionCounts[link.target_note_id] = (connectionCounts[link.target_note_id] || 0) + 1;
    }
    
    // Build nodes
    const nodes: GraphNode[] = (notes || []).map(note => ({
      id: note.id,
      title: note.title,
      slug: note.slug,
      category_id: note.category_id,
      category_name: (note.category as NoteCategory | null | undefined)?.name || null,
      category_color: (note.category as NoteCategory | null | undefined)?.color || null,
      project_name: note.project_name,
      tags: note.tags || [],
      status: note.status,
      created_at: note.created_at,
      updated_at: note.updated_at,
      connection_count: connectionCounts[note.id] || 0,
      content_length: note.content?.length || 0,
    }));
    
    // Build edges
    const edges: GraphEdge[] = validLinks.map(link => ({
      id: link.id,
      source: link.source_note_id,
      target: link.target_note_id,
      link_type: link.link_type,
    }));
    
    // Compute stats
    const orphanNotes = nodes.filter(n => n.connection_count === 0).length;
    const mostConnected = nodes.reduce<{ id: string; title: string; count: number } | null>(
      (max, node) => {
        if (!max || node.connection_count > max.count) {
          return { id: node.id, title: node.title, count: node.connection_count };
        }
        return max;
      },
      null
    );
    
    // Category stats
    const categoryStats: Record<string, { id: string; name: string; color: string; count: number }> = {};
    for (const node of nodes) {
      if (node.category_id) {
        if (!categoryStats[node.category_id]) {
          categoryStats[node.category_id] = {
            id: node.category_id,
            name: node.category_name || "Unknown",
            color: node.category_color || "#6b7280",
            count: 0,
          };
        }
        categoryStats[node.category_id].count++;
      }
    }
    
    // Project stats
    const projectStats: Record<string, number> = {};
    for (const node of nodes) {
      if (node.project_name) {
        projectStats[node.project_name] = (projectStats[node.project_name] || 0) + 1;
      }
    }
    
    const graphData: GraphData = {
      nodes,
      edges,
      stats: {
        total_notes: nodes.length,
        total_connections: edges.length,
        orphan_notes: orphanNotes,
        most_connected: mostConnected,
        categories: Object.values(categoryStats).sort((a, b) => b.count - a.count),
        projects: Object.entries(projectStats)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
      },
    };
    
    return NextResponse.json(graphData);
    
  } catch (error) {
    console.error("Graph data error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
