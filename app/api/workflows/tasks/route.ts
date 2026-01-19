import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { indexEntity } from "@/lib/workflows/search";
import type { CreateTaskRequest } from "@/types/workflows";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/workflows/tasks
   List tasks
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("project_id");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const dueWithin = searchParams.get("due_within"); // days
    const limit = parseInt(searchParams.get("limit") || "100");
    
    let query = supabase
      .from("tasks")
      .select("*, project:projects(id, name, color)")
      .eq("owner_id", user.id)
      .order("position", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (projectId) {
      query = query.eq("project_id", projectId);
    }
    
    if (status) {
      if (status === "active") {
        query = query.not("status", "in", '("done","cancelled")');
      } else {
        query = query.eq("status", status);
      }
    }
    
    if (priority) {
      query = query.eq("priority", priority);
    }
    
    if (dueWithin) {
      const days = parseInt(dueWithin);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      query = query.lte("due_date", futureDate.toISOString());
    }
    
    const { data: tasks, error } = await query;
    
    if (error) {
      console.error("Failed to fetch tasks:", error);
      return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }
    
    return NextResponse.json({ tasks: tasks || [] });
    
  } catch (error) {
    console.error("Tasks fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/workflows/tasks
   Create a task
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body: CreateTaskRequest = await request.json();
    
    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    
    // Get next position
    let position = 0;
    if (body.project_id) {
      const { data: lastTask } = await supabase
        .from("tasks")
        .select("position")
        .eq("project_id", body.project_id)
        .is("parent_id", null)
        .order("position", { ascending: false })
        .limit(1)
        .single();
      position = (lastTask?.position || 0) + 1;
    }
    
    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        owner_id: user.id,
        title: body.title.trim(),
        description: body.description,
        project_id: body.project_id,
        parent_id: body.parent_id,
        priority: body.priority || "normal",
        due_date: body.due_date,
        tags: body.tags || [],
        checklist: (body.checklist || []).map((item, i) => ({
          id: `check-${i}`,
          title: item.title,
          done: false,
        })),
        position,
      })
      .select("*, project:projects(id, name, color)")
      .single();
    
    if (error) {
      console.error("Failed to create task:", error);
      return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
    }
    
    // Index for search
    await indexEntity(
      supabase,
      user.id,
      "task",
      task.id,
      task.title,
      task.description || "",
      task.tags
    );
    
    return NextResponse.json({ task });
    
  } catch (error) {
    console.error("Task create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
