import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { generateEmbedding, summarizeMemory } from "@/lib/ai-chat/memory";
import type { CreateMemoryRequest } from "@/types/ai-chat";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/chat/memories
   List memories
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    
    let query = supabase
      .from("ai_memories")
      .select("*")
      .eq("owner_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (category) {
      query = query.eq("category", category);
    }
    
    if (search) {
      query = query.ilike("content", `%${search}%`);
    }
    
    const { data: memories, error } = await query;
    
    if (error) {
      console.error("Failed to fetch memories:", error);
      return NextResponse.json({ error: "Failed to fetch memories" }, { status: 500 });
    }
    
    return NextResponse.json({ memories: memories || [] });
    
  } catch (error) {
    console.error("Memories fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/chat/memories
   Create a manual memory
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body: CreateMemoryRequest = await request.json();
    const {
      content,
      summary: providedSummary,
      category,
      tags = [],
      importance = 0.5,
    } = body;
    
    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }
    
    // Generate embedding
    const embedding = await generateEmbedding(content);
    
    // Generate summary if not provided
    const summary = providedSummary || await summarizeMemory(content);
    
    // Create memory
    const { data: memory, error: insertError } = await supabase
      .from("ai_memories")
      .insert({
        owner_id: user.id,
        content,
        summary,
        category,
        tags,
        importance,
        source_type: "manual",
        embedding,
      })
      .select()
      .single();
    
    if (insertError) {
      console.error("Failed to create memory:", insertError);
      return NextResponse.json({ error: "Failed to create memory" }, { status: 500 });
    }
    
    return NextResponse.json({ memory });
    
  } catch (error) {
    console.error("Memory create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
