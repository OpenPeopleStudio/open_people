import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { storeFact, getFactsByType } from "@/lib/mlf/facts";
import { logActivity } from "@/lib/mlf/activity";
import type { CreateFactRequest, FactType } from "@/types/mlf";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/mlf/facts
   List knowledge facts
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const factType = searchParams.get("type") as FactType | null;
    const subjectType = searchParams.get("subject_type");
    const subjectName = searchParams.get("subject_name");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    
    let query = supabase
      .from("knowledge_facts")
      .select("*")
      .eq("owner_id", user.id)
      .eq("is_active", true)
      .eq("is_current", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (factType) {
      query = query.eq("fact_type", factType);
    }
    
    if (subjectType) {
      query = query.eq("subject_type", subjectType);
    }
    
    if (subjectName) {
      query = query.ilike("subject_name", `%${subjectName}%`);
    }
    
    if (search) {
      query = query.ilike("fact", `%${search}%`);
    }
    
    const { data: facts, error } = await query;
    
    if (error) {
      console.error("Failed to fetch facts:", error);
      return NextResponse.json({ error: "Failed to fetch facts" }, { status: 500 });
    }
    
    return NextResponse.json({ facts: facts || [] });
    
  } catch (error) {
    console.error("Facts fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/mlf/facts
   Create a new fact
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body: CreateFactRequest = await request.json();
    
    if (!body.fact?.trim()) {
      return NextResponse.json({ error: "Fact content is required" }, { status: 400 });
    }
    
    if (!body.fact_type) {
      return NextResponse.json({ error: "Fact type is required" }, { status: 400 });
    }
    
    const fact = await storeFact(supabase, user.id, body);
    
    if (!fact) {
      return NextResponse.json({ error: "Failed to create fact" }, { status: 500 });
    }
    
    // Log activity
    await logActivity({
      supabase,
      actorId: user.id,
      action: "fact.create",
      actionCategory: "ai",
      resourceType: "fact",
      resourceId: fact.id,
      resourceName: fact.fact.slice(0, 100),
      request,
    });
    
    return NextResponse.json({ fact });
    
  } catch (error) {
    console.error("Fact create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
