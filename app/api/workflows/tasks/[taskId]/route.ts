import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { indexEntity, removeFromIndex } from "@/lib/workflows/search";

/* ═══════════════════════════════════════════════════════════════════════════
   GET /api/workflows/tasks/[taskId]
   Get a single task
   ═══════════════════════════════════════════════════════════════════════════ */

export async function GET(request: Request, context: any) {
  try {
    const { taskId } = context.params;
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { data: task, error } = await supabase
      .from("tasks")
      .select("*, project:projects(id, name, color), subtasks:tasks(id, title, status, position)")
      .eq("id", taskId)
      .eq("owner_id", user.id)
      .single();
    
    if (error || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    
    return NextResponse.json({ task });
    
  } catch (error) {
    console.error("Task fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   PATCH /api/workflows/tasks/[taskId]
   Update a task
   ═══════════════════════════════════════════════════════════════════════════ */

export async function PATCH(request: Request, context: any) {
  try {
    const { taskId } = context.params;
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.project_id !== undefined) updates.project_id = body.project_id;
    if (body.parent_id !== undefined) updates.parent_id = body.parent_id;
    if (body.position !== undefined) updates.position = body.position;
    if (body.assigned_to !== undefined) updates.assigned_to = body.assigned_to;
    if (body.status !== undefined) {
      updates.status = body.status;
      if (body.status === "done") {
        updates.completed_at = new Date().toISOString();
      } else {
        updates.completed_at = null;
      }
    }
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.due_date !== undefined) updates.due_date = body.due_date;
    if (body.start_date !== undefined) updates.start_date = body.start_date;
    if (body.estimated_minutes !== undefined) updates.estimated_minutes = body.estimated_minutes;
    if (body.actual_minutes !== undefined) updates.actual_minutes = body.actual_minutes;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.labels !== undefined) updates.labels = body.labels;
    if (body.checklist !== undefined) updates.checklist = body.checklist;
    
    const { data: task, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", taskId)
      .eq("owner_id", user.id)
      .select("*, project:projects(id, name, color)")
      .single();
    
    if (error) {
      console.error("Failed to update task:", error);
      return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
    }
    
    // Re-index for search
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
    console.error("Task update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   DELETE /api/workflows/tasks/[taskId]
   Delete a task
   ═══════════════════════════════════════════════════════════════════════════ */

export async function DELETE(request: Request, context: any) {
  try {
    const { taskId } = context.params;
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId)
      .eq("owner_id", user.id);
    
    if (error) {
      console.error("Failed to delete task:", error);
      return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
    }
    
    // Remove from search index
    await removeFromIndex(supabase, "task", taskId);
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Task delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
