import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { storeFact } from "@/lib/mlf/facts";
import { logActivity } from "@/lib/mlf/activity";
import type { FactType } from "@/types/mlf";

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/chat/actions/fact
   Create a fact from chat - lightweight endpoint for quick fact creation
   ═══════════════════════════════════════════════════════════════════════════ */

interface CreateFactFromChatRequest {
  fact: string;
  fact_type: FactType;
  project_id?: string;
  conversation_id?: string;
  message_id?: string;
  source_excerpt?: string;
  tags?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body: CreateFactFromChatRequest = await request.json();
    const { 
      fact, 
      fact_type, 
      project_id, 
      conversation_id, 
      message_id, 
      source_excerpt,
      tags = [] 
    } = body;
    
    if (!fact?.trim()) {
      return NextResponse.json({ error: "Fact content is required" }, { status: 400 });
    }
    
    if (!fact_type) {
      return NextResponse.json({ error: "Fact type is required" }, { status: 400 });
    }
    
    // Get project name if project_id provided for subject linking
    let subjectName: string | undefined;
    let subjectType: string | undefined;
    if (project_id) {
      const { data: project } = await supabase
        .from("projects")
        .select("name")
        .eq("id", project_id)
        .eq("owner_id", user.id)
        .single();
      
      if (project) {
        subjectName = project.name;
        subjectType = "project";
      }
    }
    
    // Store the fact
    const newFact = await storeFact(supabase, user.id, {
      fact: fact.trim(),
      fact_type,
      subject_type: subjectType,
      subject_name: subjectName,
      source_type: "conversation",
      source_id: message_id || conversation_id,
      source_excerpt,
      tags: ["from-chat", ...tags],
      confidence: 0.9, // User-created facts have high confidence
    });
    
    if (!newFact) {
      return NextResponse.json({ error: "Failed to create fact" }, { status: 500 });
    }
    
    // Log activity
    await logActivity({
      supabase,
      actorId: user.id,
      action: "fact.create",
      actionCategory: "ai",
      resourceType: "fact",
      resourceId: newFact.id,
      resourceName: newFact.fact.slice(0, 100),
      context: {
        source: "chat",
        conversation_id,
        message_id,
        project_id,
      },
      request,
    });
    
    return NextResponse.json({ 
      fact: newFact,
      message: `Fact saved successfully`,
    });
    
  } catch (error) {
    console.error("Fact create from chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
