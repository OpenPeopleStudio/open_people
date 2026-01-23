import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { generateEmbedding } from "@/lib/ai-chat/memory";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/chat/memories/[memoryId]
   Get single memory
   ═══════════════════════════════════════════════════════════════════════════ */

type RouteContext = { params: Promise<{ memoryId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { memoryId } = await context.params;
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { data: memory, error } = await supabase
      .from("ai_memories")
      .select("*")
      .eq("id", memoryId)
      .eq("owner_id", user.id)
      .single();
    
    if (error || !memory) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    }
    
    return NextResponse.json({ memory });
    
  } catch (error) {
    console.error("Memory fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   PATCH /api/chat/memories/[memoryId]
   Update memory
   ═══════════════════════════════════════════════════════════════════════════ */

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { memoryId } = await context.params;
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    
    if (body.content !== undefined) {
      updates.content = body.content;
      // Re-generate embedding if content changed
      updates.embedding = await generateEmbedding(body.content);
    }
    if (body.summary !== undefined) updates.summary = body.summary;
    if (body.category !== undefined) updates.category = body.category;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.importance !== undefined) updates.importance = body.importance;
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    
    const { data: memory, error: updateError } = await supabase
      .from("ai_memories")
      .update(updates)
      .eq("id", memoryId)
      .eq("owner_id", user.id)
      .select()
      .single();
    
    if (updateError) {
      console.error("Failed to update memory:", updateError);
      return NextResponse.json({ error: "Failed to update memory" }, { status: 500 });
    }
    
    return NextResponse.json({ memory });
    
  } catch (error) {
    console.error("Memory update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   DELETE /api/chat/memories/[memoryId]
   Delete memory (soft delete - sets is_active to false)
   ═══════════════════════════════════════════════════════════════════════════ */

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { memoryId } = await context.params;
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Soft delete
    const { error: updateError } = await supabase
      .from("ai_memories")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", memoryId)
      .eq("owner_id", user.id);
    
    if (updateError) {
      console.error("Failed to delete memory:", updateError);
      return NextResponse.json({ error: "Failed to delete memory" }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Memory delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
