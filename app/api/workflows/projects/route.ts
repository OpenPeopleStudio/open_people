import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { indexEntity } from "@/lib/workflows/search";
import type { CreateProjectRequest } from "@/types/workflows";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/workflows/projects
   List projects
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const includeTasks = searchParams.get("include_tasks") === "true";
    
    let query = supabase
      .from("projects")
      .select(includeTasks ? "*, tasks(id, title, status, priority, due_date)" : "*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    
    if (status) {
      query = query.eq("status", status);
    }
    
    const { data: projects, error } = await query;
    
    if (error) {
      console.error("Failed to fetch projects:", error);
      return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
    }
    
    return NextResponse.json({ projects: projects || [] });
    
  } catch (error) {
    console.error("Projects fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/workflows/projects
   Create a project
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body: CreateProjectRequest = await request.json();
    
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    
    // Generate slug
    const slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    
    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        owner_id: user.id,
        name: body.name.trim(),
        description: body.description,
        slug,
        color: body.color || "#6366f1",
        icon: body.icon,
        parent_id: body.parent_id,
        start_date: body.start_date,
        target_date: body.target_date,
      })
      .select()
      .single();
    
    if (error) {
      console.error("Failed to create project:", error);
      return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
    }
    
    // Index for search
    await indexEntity(
      supabase,
      user.id,
      "project",
      project.id,
      project.name,
      project.description || ""
    );
    
    return NextResponse.json({ project });
    
  } catch (error) {
    console.error("Project create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
