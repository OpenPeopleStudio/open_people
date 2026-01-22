import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { indexEntity } from "@/lib/workflows/search";
import { errors } from "@/lib/http/responses";
import { parseJsonBody } from "@/lib/http/validation";
import { opsCommitRequestSchema } from "@/lib/schemas/ops";
import {
  OPS_WORKER_TAG,
  SOURCE_TAGS,
  type OpsCommitRequest,
  type OpsCommitResponse,
  type OpsProposal,
  type ProposedActionItem,
  type DecisionSourceType,
} from "@/lib/ai/prompts/opsWorker";

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/ops/commit
   Apply selected task proposals (create/update tasks)
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return errors.unauthorized("Unauthorized");
    }

    // 2. Parse request
    const bodyResult = await parseJsonBody(request, opsCommitRequestSchema);
    if ("error" in bodyResult) {
      return bodyResult.error;
    }
    const overrides = bodyResult.data.overrides as
      | Record<string, Partial<ProposedActionItem>>
      | undefined;
    const body: OpsCommitRequest = {
      run_id: bodyResult.data.run_id,
      selected_task_ids: bodyResult.data.selected_task_ids ?? [],
      selected_update_ids: bodyResult.data.selected_update_ids ?? [],
      ...(overrides ? { overrides } : {}),
    };

    // 3. Fetch the ops run
    const { data: opsRun, error: runError } = await supabase
      .from("ops_runs")
      .select("*, decision:decisions(*)")
      .eq("id", body.run_id)
      .eq("owner_id", user.id)
      .single();

    if (runError || !opsRun) {
      return errors.notFound("Ops run not found");
    }

    if (opsRun.status === "committed") {
      return errors.badRequest("This run has already been committed");
    }

    if (opsRun.status !== "completed") {
      return errors.badRequest("Ops run is not in completed status");
    }

    const proposal = opsRun.proposal as OpsProposal | null;
    if (!proposal) {
      return errors.badRequest("No proposal found in ops run");
    }

    // 4. Get decision source for tagging
    const decision = opsRun.decision;
    const sourceType = (decision?.source as { type?: string })?.type as DecisionSourceType | undefined;
    const sourceTag = sourceType ? SOURCE_TAGS[sourceType] : undefined;

    // 5. Process selected tasks to create
    const createdTasks: OpsCommitResponse["created_tasks"] = [];
    const commitErrors: OpsCommitResponse["errors"] = [];

    const selectedCreateIds = new Set(body.selected_task_ids || []);
    const tasksToCreate = proposal.tasks_to_create.filter((t) => selectedCreateIds.has(t.id));

    for (const proposedTask of tasksToCreate) {
      try {
        // Apply any overrides
        const overrides = body.overrides?.[proposedTask.id] || {};
        const task: ProposedActionItem = { ...proposedTask, ...overrides };

        // Build tags
        const tags = [...(task.tags || []), OPS_WORKER_TAG];
        if (sourceTag) {
          tags.push(sourceTag);
        }

        // Build checklist
        const checklist = (task.checklist || []).map((item, i) => ({
          id: `check-${i}`,
          title: item.title,
          done: false,
        }));

        // Get next position (if project specified)
        let position = 0;
        if (task.project_id) {
          const { data: lastTask } = await supabase
            .from("tasks")
            .select("position")
            .eq("project_id", task.project_id)
            .is("parent_id", null)
            .order("position", { ascending: false })
            .limit(1)
            .single();
          position = (lastTask?.position || 0) + 1;
        }

        // Create the task
        const { data: newTask, error: createError } = await supabase
          .from("tasks")
          .insert({
            owner_id: user.id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            due_date: task.due_date,
            project_id: task.project_id,
            tags,
            checklist,
            estimated_minutes: task.estimated_minutes,
            position,
            metadata: {
              ops_worker: true,
              source_decision_id: decision?.id,
              rationale: task.rationale,
              aligned_goal_ids: task.aligned_goal_ids,
              source_excerpt: task.source_excerpt,
              confidence: task.confidence,
            },
          })
          .select()
          .single();

        if (createError || !newTask) {
          commitErrors.push({
            proposal_id: task.id,
            error: createError?.message || "Failed to create task",
          });
          continue;
        }

        // Index for search
        await indexEntity(supabase, user.id, "task", newTask.id, newTask.title, newTask.description || "", tags);

        createdTasks.push({
          proposal_id: task.id,
          task_id: newTask.id,
          title: newTask.title,
        });
      } catch (err) {
        commitErrors.push({
          proposal_id: proposedTask.id,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    // 6. Process selected tasks to update
    const updatedTasks: OpsCommitResponse["updated_tasks"] = [];

    const selectedUpdateIds = new Set(body.selected_update_ids || []);
    const tasksToUpdate = proposal.tasks_to_update.filter((t) => selectedUpdateIds.has(t.task_id));

    for (const proposedUpdate of tasksToUpdate) {
      try {
        // Build update payload
        const updatePayload: Record<string, unknown> = {};

        if (proposedUpdate.new_status) {
          updatePayload.status = proposedUpdate.new_status;
          if (proposedUpdate.new_status === "done") {
            updatePayload.completed_at = new Date().toISOString();
          }
        }

        if (proposedUpdate.new_priority) {
          updatePayload.priority = proposedUpdate.new_priority;
        }

        if (proposedUpdate.new_due_date) {
          updatePayload.due_date = proposedUpdate.new_due_date;
        }

        // Handle checklist additions
        if (proposedUpdate.add_checklist_items && proposedUpdate.add_checklist_items.length > 0) {
          // Fetch current checklist
          const { data: currentTask } = await supabase
            .from("tasks")
            .select("checklist")
            .eq("id", proposedUpdate.task_id)
            .eq("owner_id", user.id)
            .single();

          const existingChecklist = (currentTask?.checklist || []) as Array<{
            id: string;
            title: string;
            done: boolean;
          }>;
          const newItems = proposedUpdate.add_checklist_items.map((item, i) => ({
            id: `check-${existingChecklist.length + i}`,
            title: item.title,
            done: false,
          }));

          updatePayload.checklist = [...existingChecklist, ...newItems];
        }

        // Only update if there's something to change
        if (Object.keys(updatePayload).length === 0) {
          continue;
        }

        const { data: updatedTask, error: updateError } = await supabase
          .from("tasks")
          .update(updatePayload)
          .eq("id", proposedUpdate.task_id)
          .eq("owner_id", user.id)
          .select("id, title")
          .single();

        if (updateError || !updatedTask) {
          commitErrors.push({
            proposal_id: proposedUpdate.task_id,
            error: updateError?.message || "Failed to update task",
          });
          continue;
        }

        updatedTasks.push({
          task_id: updatedTask.id,
          title: updatedTask.title,
        });
      } catch (err) {
        commitErrors.push({
          proposal_id: proposedUpdate.task_id,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    // 7. Update ops_run as committed
    const createdTaskIds = createdTasks.map((t) => t.task_id);
    const updatedTaskIds = updatedTasks.map((t) => t.task_id);

    await supabase
      .from("ops_runs")
      .update({
        status: "committed",
        created_task_ids: createdTaskIds,
        updated_task_ids: updatedTaskIds,
        committed_by: user.id,
        committed_at: new Date().toISOString(),
      })
      .eq("id", body.run_id);

    // 8. Update decision as committed
    if (decision) {
      await supabase
        .from("decisions")
        .update({
          status: "committed",
          created_task_ids: createdTaskIds,
        })
        .eq("id", decision.id);
    }

    // 9. Return response
    const response: OpsCommitResponse = {
      created_tasks: createdTasks,
      updated_tasks: updatedTasks,
      errors: commitErrors,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Ops commit error:", error);
    return errors.serverError("Internal server error", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
