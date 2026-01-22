import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { verifyFact } from "@/lib/mlf/facts";
import { logActivity } from "@/lib/mlf/activity";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/mlf/facts/[factId]
   Get a single fact
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: Request, context: any) {
  void request;
  try {
    const { factId } = context.params;
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { data: fact, error } = await supabase
      .from("knowledge_facts")
      .select("*")
      .eq("id", factId)
      .eq("owner_id", user.id)
      .single();
    
    if (error || !fact) {
      return NextResponse.json({ error: "Fact not found" }, { status: 404 });
    }
    
    return NextResponse.json({ fact });
    
  } catch (error) {
    console.error("Fact fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   PATCH /api/mlf/facts/[factId]
   Update a fact
   ═══════════════════════════════════════════════════════════════════════════ */

export async function PATCH(request: Request, context: any) {
  try {
    const { factId } = context.params;
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Handle verification
    if (body.verify === true) {
      const success = await verifyFact(supabase, factId, user.id);
      
      if (!success) {
        return NextResponse.json({ error: "Failed to verify fact" }, { status: 500 });
      }
      
      await logActivity({
        supabase,
        actorId: user.id,
        action: "fact.verify",
        actionCategory: "ai",
        resourceType: "fact",
        resourceId: factId,
        request,
      });
      
      const { data: fact } = await supabase
        .from("knowledge_facts")
        .select("*")
        .eq("id", factId)
        .single();
      
      return NextResponse.json({ fact });
    }
    
    // Regular update
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    
    if (body.fact !== undefined) updates.fact = body.fact;
    if (body.fact_type !== undefined) updates.fact_type = body.fact_type;
    if (body.subject_type !== undefined) updates.subject_type = body.subject_type;
    if (body.subject_name !== undefined) updates.subject_name = body.subject_name;
    if (body.confidence !== undefined) updates.confidence = body.confidence;
    if (body.category !== undefined) updates.category = body.category;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    
    const { data: fact, error: updateError } = await supabase
      .from("knowledge_facts")
      .update(updates)
      .eq("id", factId)
      .eq("owner_id", user.id)
      .select()
      .single();
    
    if (updateError) {
      console.error("Failed to update fact:", updateError);
      return NextResponse.json({ error: "Failed to update fact" }, { status: 500 });
    }
    
    return NextResponse.json({ fact });
    
  } catch (error) {
    console.error("Fact update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   DELETE /api/mlf/facts/[factId]
   Delete (deactivate) a fact
   ═══════════════════════════════════════════════════════════════════════════ */

export async function DELETE(request: Request, context: any) {
  try {
    const { factId } = context.params;
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Soft delete
    const { error } = await supabase
      .from("knowledge_facts")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", factId)
      .eq("owner_id", user.id);
    
    if (error) {
      console.error("Failed to delete fact:", error);
      return NextResponse.json({ error: "Failed to delete fact" }, { status: 500 });
    }
    
    await logActivity({
      supabase,
      actorId: user.id,
      action: "fact.delete",
      actionCategory: "ai",
      resourceType: "fact",
      resourceId: factId,
      request,
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Fact delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
