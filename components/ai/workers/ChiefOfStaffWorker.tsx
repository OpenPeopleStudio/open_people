"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type {
  PlanProposal,
  WeekPlanRequest,
  WeekPlanResponse,
  ProposedTaskCreate,
  ProposedTaskUpdate,
  ProposedOutcome,
} from "@/lib/ai/prompts/chiefOfStaff";
import type { AIWorkerJobRow } from "@/types/ai-jobs";

/* ═══════════════════════════════════════════════════════════════════════════
   Chief of Staff Worker - AI Weekly Planning
   Extracted as a reusable component for the AI Team
   ═══════════════════════════════════════════════════════════════════════════ */

interface Goal {
  id: string;
  title: string;
  category: string | null;
  status: string;
  progress: number;
}

interface Project {
  id: string;
  name: string;
  status: string;
}

export default function ChiefOfStaffWorker() {
  const searchParams = useSearchParams();

  // Form state
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [availableHours, setAvailableHours] = useState<string>("");
  const [nonNegotiables, setNonNegotiables] = useState<string>("");
  const [additionalContext, setAdditionalContext] = useState<string>("");
  const [focusGoalIds, setFocusGoalIds] = useState<string[]>([]);
  const [focusProjectIds, setFocusProjectIds] = useState<string[]>([]);
  
  // Data state
  const [goals, setGoals] = useState<Goal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Planning state
  const [generating, setGenerating] = useState(false);
  const [proposal, setProposal] = useState<PlanProposal | null>(null);
  const [contextUsed, setContextUsed] = useState<WeekPlanResponse["context_used"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<AIWorkerJobRow | null>(null);
  
  // Review state
  const [selectedTasksToCreate, setSelectedTasksToCreate] = useState<Set<number>>(new Set());
  const [selectedTasksToUpdate, setSelectedTasksToUpdate] = useState<Set<number>>(new Set());
  const [applying, setApplying] = useState(false);
  const [appliedResult, setAppliedResult] = useState<{
    created: number;
    updated: number;
    noteId?: string;
  } | null>(null);
  
  // Load goals and projects
  useEffect(() => {
    async function loadData() {
      try {
        const [goalsRes, projectsRes] = await Promise.all([
          fetch("/api/profile/goals?status=active"),
          fetch("/api/workflows/projects"),
        ]);
        
        if (goalsRes.ok) {
          const data = await goalsRes.json();
          setGoals(data.goals || []);
        }
        
        if (projectsRes.ok) {
          const data = await projectsRes.json();
          setProjects(data.projects || []);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  // If navigated here from an in-app notification, restore job from query param
  useEffect(() => {
    const jobId = searchParams.get("job");
    if (!jobId) return;
    void hydrateJob(jobId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function hydrateJob(jobId: string) {
    try {
      setError(null);
      const j = await fetchJob(jobId);
      setJob(j);

      if (j.status === "completed") {
        applyCompletedJob(j);
        return;
      }

      if (j.status === "failed") {
        setError(j.error_message || "Job failed");
        return;
      }

      void pollJobUntilDone(jobId, {
        onUpdate: setJob,
        onCompleted: (done) => {
          setJob(done);
          applyCompletedJob(done);
        },
        onFailed: (failed) => {
          setJob(failed);
          setError(failed.error_message || "Job failed");
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load job");
    }
  }

  function applyCompletedJob(done: AIWorkerJobRow) {
    const response = (done.result as any)?.response as WeekPlanResponse | undefined;
    if (!response?.proposal) {
      setError("Job completed but returned no proposal");
      return;
    }

    setProposal(response.proposal);
    setContextUsed(response.context_used);
    setSelectedTasksToCreate(new Set(response.proposal.tasks_to_create.map((_, i) => i)));
    setSelectedTasksToUpdate(new Set(response.proposal.tasks_to_update.map((_, i) => i)));
  }
  
  // Generate plan
  async function handleGeneratePlan() {
    setGenerating(true);
    setError(null);
    setProposal(null);
    setAppliedResult(null);
    setJob(null);
    
    try {
      const request: WeekPlanRequest = {
        start_date: startDate,
        ...(availableHours ? { available_hours: parseInt(availableHours) } : {}),
        ...(nonNegotiables
          ? {
              non_negotiables: nonNegotiables
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean),
            }
          : {}),
        ...(focusGoalIds.length > 0 ? { focus_goal_ids: focusGoalIds } : {}),
        ...(focusProjectIds.length > 0 ? { focus_project_ids: focusProjectIds } : {}),
        ...(additionalContext ? { additional_context: additionalContext } : {}),
      };

      // Enqueue async job (returns immediately)
      const res = await fetch("/api/ai/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          worker_id: "chief-of-staff",
          job_type: "week_plan",
          input: { request },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to enqueue plan job");
      }

      const data = await res.json();
      setJob(data.job);

      // Start polling for completion (non-blocking; user can navigate away)
      void pollJobUntilDone(data.job.id, {
        onUpdate: setJob,
        onCompleted: (done) => {
          setJob(done);
          applyCompletedJob(done);
        },
        onFailed: (failed) => {
          setJob(failed);
          setError(failed.error_message || "Job failed");
        },
      });
      
    } catch (err) {
      console.error("Failed to generate plan:", err);
      setError(err instanceof Error ? err.message : "Failed to generate plan");
    } finally {
      setGenerating(false);
    }
  }
  
  // Apply selected changes
  async function handleApplyPlan() {
    if (!proposal) return;
    
    setApplying(true);
    setError(null);
    
    const createdTaskIds: string[] = [];
    const updatedTaskIds: string[] = [];
    
    try {
      // Create selected tasks
      for (const idx of selectedTasksToCreate) {
        const task = proposal.tasks_to_create[idx];
        if (!task) continue;
        
        const res = await fetch("/api/workflows/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: task.title,
            description: task.description,
            priority: task.priority,
            due_date: task.due_date,
            project_id: task.project_id,
            tags: task.tags,
          }),
        });
        
        if (res.ok) {
          const data = await res.json();
          createdTaskIds.push(data.task.id);
        }
      }
      
      // Update selected tasks
      for (const idx of selectedTasksToUpdate) {
        const update = proposal.tasks_to_update[idx];
        if (!update) continue;
        
        const updateBody: Record<string, unknown> = {};
        if (update.new_status) updateBody.status = update.new_status;
        if (update.new_priority) updateBody.priority = update.new_priority;
        if (update.new_due_date) updateBody.due_date = update.new_due_date;
        
        if (Object.keys(updateBody).length > 0) {
          const res = await fetch(`/api/workflows/tasks/${update.task_id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateBody),
          });
          
          if (res.ok) {
            updatedTaskIds.push(update.task_id);
          }
        }
      }
      
      // Save plan as a note
      let noteId: string | undefined;
      if (proposal.outcomes.length > 0) {
        const noteContent = generatePlanNoteContent(proposal, createdTaskIds, updatedTaskIds);
        
        const noteRes = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `Week Plan: ${proposal.week_start.split("T")[0]}`,
            content: noteContent,
            tags: ["week-plan", "chief-of-staff"],
            project_name: "week-plans",
            status: "published",
            metadata: {
              plan_type: "weekly",
              week_start: proposal.week_start,
              week_end: proposal.week_end,
              created_task_ids: createdTaskIds,
              updated_task_ids: updatedTaskIds,
            },
          }),
        });
        
        if (noteRes.ok) {
          const noteData = await noteRes.json();
          noteId = noteData.note?.id;
        }
      }
      
      setAppliedResult({
        created: createdTaskIds.length,
        updated: updatedTaskIds.length,
        ...(noteId ? { noteId } : {}),
      });
      
    } catch (err) {
      console.error("Failed to apply plan:", err);
      setError(err instanceof Error ? err.message : "Failed to apply plan");
    } finally {
      setApplying(false);
    }
  }
  
  // Reset to start over
  function handleReset() {
    setProposal(null);
    setContextUsed(null);
    setAppliedResult(null);
    setSelectedTasksToCreate(new Set());
    setSelectedTasksToUpdate(new Set());
    setJob(null);
  }
  
  // Toggle selection helpers
  function toggleTaskCreate(idx: number) {
    setSelectedTasksToCreate(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  }
  
  function toggleTaskUpdate(idx: number) {
    setSelectedTasksToUpdate(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  }
  
  function toggleGoalFocus(goalId: string) {
    setFocusGoalIds(prev =>
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  }
  
  function toggleProjectFocus(projectId: string) {
    setFocusProjectIds(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  }
  
  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12 text-[var(--text-muted)]">
          Loading...
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--electric-cyan)] to-[var(--electric-lime)] flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--void)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Chief of Staff
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              AI-powered weekly planning aligned to your goals
            </p>
          </div>
        </div>
      </div>
      
      {/* Success state */}
      {appliedResult && (
        <div className="mb-6 p-6 rounded-2xl bg-[var(--success)]/10 border border-[var(--success)]/30">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[var(--success)] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                Plan Applied Successfully
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Created {appliedResult.created} task(s) and updated {appliedResult.updated} task(s).
                {appliedResult.noteId && " Your plan has been saved as a note."}
              </p>
              <div className="flex gap-3">
                <a
                  href="/admin/workflows"
                  className="px-4 py-2 rounded-lg bg-[var(--surface-1)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--surface-2)] transition-colors"
                >
                  View Tasks
                </a>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] text-sm font-medium hover:brightness-110 transition-all"
                >
                  Plan Another Week
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-[var(--error)]/10 border border-[var(--error)]/30">
          <p className="text-sm text-[var(--error)]">{error}</p>
        </div>
      )}

      {/* Job status */}
      {job && !proposal && !appliedResult && (
        <div className="mb-6 p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Run status: {job.status}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                You can keep using the app. You’ll get an in-app notification when this completes.
              </p>
            </div>
            <a
              href="/admin/notifications"
              className="px-3 py-1.5 rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)] text-sm hover:text-[var(--text-primary)] transition-colors shrink-0"
            >
              Notifications
            </a>
          </div>
        </div>
      )}
      
      {/* Form or Proposal */}
      {!proposal && !appliedResult ? (
        <div className="space-y-6">
          {/* Planning inputs */}
          <div className="p-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Plan Your Week
            </h2>
            
            <div className="space-y-5">
              {/* Start date and hours */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    Week Starting
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    Available Hours
                  </label>
                  <input
                    type="number"
                    value={availableHours}
                    onChange={(e) => setAvailableHours(e.target.value)}
                    placeholder="e.g., 40"
                    min="1"
                    max="168"
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                  />
                </div>
              </div>
              
              {/* Non-negotiables */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Non-Negotiables (one per line)
                </label>
                <textarea
                  value={nonNegotiables}
                  onChange={(e) => setNonNegotiables(e.target.value)}
                  placeholder="Things that must happen this week..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] resize-none focus:outline-none focus:border-[var(--electric-lime)]"
                />
              </div>
              
              {/* Focus goals */}
              {goals.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Focus Goals (optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {goals.map(goal => (
                      <button
                        key={goal.id}
                        onClick={() => toggleGoalFocus(goal.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          focusGoalIds.includes(goal.id)
                            ? "bg-[var(--electric-lime)] text-[var(--void)]"
                            : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        {goal.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Focus projects */}
              {projects.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Focus Projects (optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {projects.map(project => (
                      <button
                        key={project.id}
                        onClick={() => toggleProjectFocus(project.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          focusProjectIds.includes(project.id)
                            ? "bg-[var(--electric-lime)] text-[var(--void)]"
                            : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        {project.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Additional context */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Additional Context (optional)
                </label>
                <textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="Any other context the AI should consider..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] resize-none focus:outline-none focus:border-[var(--electric-lime)]"
                />
              </div>
            </div>
          </div>
          
          {/* Generate button */}
          <button
            onClick={handleGeneratePlan}
            disabled={generating || (job?.status === "queued" || job?.status === "running")}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--electric-cyan)] to-[var(--electric-lime)] text-[var(--void)] font-semibold hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Generating Plan...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Weekly Plan
              </>
            )}
          </button>
          
          {/* Info */}
          <p className="text-xs text-[var(--text-muted)] text-center">
            The AI will analyze your goals, tasks, and recent notes to propose a plan.
            You can review and modify before applying.
          </p>
        </div>
      ) : proposal && !appliedResult ? (
        <PlanReview
          proposal={proposal}
          contextUsed={contextUsed}
          selectedTasksToCreate={selectedTasksToCreate}
          selectedTasksToUpdate={selectedTasksToUpdate}
          onToggleTaskCreate={toggleTaskCreate}
          onToggleTaskUpdate={toggleTaskUpdate}
          onApply={handleApplyPlan}
          onCancel={handleReset}
          applying={applying}
        />
      ) : null}
    </div>
  );
}

async function fetchJob(jobId: string): Promise<AIWorkerJobRow> {
  const res = await fetch(`/api/ai/jobs/${jobId}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to load job");
  }
  const data = await res.json();
  return data.job as AIWorkerJobRow;
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function pollJobUntilDone(
  jobId: string,
  handlers: {
    onUpdate?: (job: AIWorkerJobRow) => void;
    onCompleted?: (job: AIWorkerJobRow) => void;
    onFailed?: (job: AIWorkerJobRow) => void;
  }
): Promise<void> {
  // Conservative polling: fast at first, then back off.
  const delays = [500, 750, 1000, 1500, 2000, 3000];

  for (let i = 0; i < 200; i++) {
    const job = await fetchJob(jobId);
    handlers.onUpdate?.(job);

    if (job.status === "completed") {
      handlers.onCompleted?.(job);
      return;
    }

    if (job.status === "failed" || job.status === "cancelled") {
      handlers.onFailed?.(job);
      return;
    }

    await sleep(delays[Math.min(i, delays.length - 1)]);
  }

  // If we get here, the job took unusually long. Leave it running.
}


/* ═══════════════════════════════════════════════════════════════════════════
   Plan Review Component
   ═══════════════════════════════════════════════════════════════════════════ */

function PlanReview({
  proposal,
  contextUsed,
  selectedTasksToCreate,
  selectedTasksToUpdate,
  onToggleTaskCreate,
  onToggleTaskUpdate,
  onApply,
  onCancel,
  applying,
}: {
  proposal: PlanProposal;
  contextUsed: WeekPlanResponse["context_used"] | null;
  selectedTasksToCreate: Set<number>;
  selectedTasksToUpdate: Set<number>;
  onToggleTaskCreate: (idx: number) => void;
  onToggleTaskUpdate: (idx: number) => void;
  onApply: () => void;
  onCancel: () => void;
  applying: boolean;
}) {
  const priorityColors: Record<string, string> = {
    urgent: "var(--error)",
    high: "var(--warning)",
    normal: "var(--electric-cyan)",
    low: "var(--text-muted)",
  };
  
  return (
    <div className="space-y-6">
      {/* Summary header */}
      <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-[var(--text-primary)]">
              Plan for {proposal.week_start.split("T")[0]} → {proposal.week_end.split("T")[0]}
            </h2>
            {contextUsed && (
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Based on {contextUsed.goals_count} goals, {contextUsed.active_tasks_count} tasks, {contextUsed.notes_count} notes
              </p>
            )}
          </div>
          <button
            onClick={onCancel}
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            Start Over
          </button>
        </div>
      </div>
      
      {/* Outcomes */}
      {proposal.outcomes.length > 0 && (
        <div className="p-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--electric-lime)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Weekly Outcomes
          </h3>
          <div className="space-y-3">
            {proposal.outcomes.map((outcome, idx) => (
              <OutcomeCard key={idx} outcome={outcome} />
            ))}
          </div>
        </div>
      )}
      
      {/* Tasks to Create */}
      {proposal.tasks_to_create.length > 0 && (
        <div className="p-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--electric-cyan)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Tasks ({selectedTasksToCreate.size}/{proposal.tasks_to_create.length} selected)
          </h3>
          <div className="space-y-2">
            {proposal.tasks_to_create.map((task, idx) => (
              <TaskCreateCard
                key={idx}
                task={task}
                selected={selectedTasksToCreate.has(idx)}
                onToggle={() => onToggleTaskCreate(idx)}
                priorityColors={priorityColors}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Tasks to Update */}
      {proposal.tasks_to_update.length > 0 && (
        <div className="p-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Task Updates ({selectedTasksToUpdate.size}/{proposal.tasks_to_update.length} selected)
          </h3>
          <div className="space-y-2">
            {proposal.tasks_to_update.map((update, idx) => (
              <TaskUpdateCard
                key={idx}
                update={update}
                selected={selectedTasksToUpdate.has(idx)}
                onToggle={() => onToggleTaskUpdate(idx)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Questions */}
      {proposal.questions.length > 0 && (
        <div className="p-6 rounded-2xl bg-[var(--warning)]/10 border border-[var(--warning)]/30">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Questions from AI
          </h3>
          <div className="space-y-3">
            {proposal.questions.map((q, idx) => (
              <div key={idx} className="text-sm">
                <p className="text-[var(--text-primary)]">{q.question}</p>
                {q.context && (
                  <p className="text-[var(--text-muted)] text-xs mt-1">{q.context}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Concerns */}
      {proposal.concerns && proposal.concerns.length > 0 && (
        <div className="p-4 rounded-xl bg-[var(--error)]/10 border border-[var(--error)]/30">
          <h4 className="text-sm font-medium text-[var(--error)] mb-2">Concerns</h4>
          <ul className="text-sm text-[var(--text-secondary)] space-y-1">
            {proposal.concerns.map((concern, idx) => (
              <li key={idx}>• {concern}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* AI Reasoning */}
      {proposal.reasoning && (
        <div className="p-4 rounded-xl bg-[var(--surface-2)]">
          <h4 className="text-sm font-medium text-[var(--text-muted)] mb-2">AI Reasoning</h4>
          <p className="text-sm text-[var(--text-secondary)]">{proposal.reasoning}</p>
        </div>
      )}
      
      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl bg-[var(--surface-1)] text-[var(--text-secondary)] font-medium hover:text-[var(--text-primary)] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onApply}
          disabled={applying || (selectedTasksToCreate.size === 0 && selectedTasksToUpdate.size === 0 && proposal.outcomes.length === 0)}
          className="flex-1 py-3 rounded-xl bg-[var(--electric-lime)] text-[var(--void)] font-semibold hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {applying ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Applying...
            </>
          ) : (
            <>Apply Plan</>
          )}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Card Components
   ═══════════════════════════════════════════════════════════════════════════ */

function OutcomeCard({ outcome }: { outcome: ProposedOutcome }) {
  return (
    <div className="p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]">
      <div className="flex items-start gap-3">
        <span className="w-6 h-6 rounded-full bg-[var(--electric-lime)]/20 text-[var(--electric-lime)] flex items-center justify-center text-sm font-medium">
          {outcome.priority}
        </span>
        <div className="flex-1">
          <p className="font-medium text-[var(--text-primary)]">{outcome.description}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">{outcome.rationale}</p>
        </div>
      </div>
    </div>
  );
}

function TaskCreateCard({
  task,
  selected,
  onToggle,
  priorityColors,
}: {
  task: ProposedTaskCreate;
  selected: boolean;
  onToggle: () => void;
  priorityColors: Record<string, string>;
}) {
  return (
    <div
      onClick={onToggle}
      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
        selected
          ? "bg-[var(--electric-cyan)]/10 border-[var(--electric-cyan)]/50"
          : "bg-[var(--surface-2)] border-[var(--border-subtle)] opacity-60"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
            selected
              ? "bg-[var(--electric-cyan)] border-[var(--electric-cyan)]"
              : "border-[var(--border)]"
          }`}
        >
          {selected && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-[var(--text-primary)]">{task.title}</span>
            <span
              className="px-1.5 py-0.5 text-xs rounded"
              style={{
                backgroundColor: `${priorityColors[task.priority]}20`,
                color: priorityColors[task.priority],
              }}
            >
              {task.priority}
            </span>
          </div>
          {task.description && (
            <p className="text-sm text-[var(--text-muted)] mb-1">{task.description}</p>
          )}
          <p className="text-xs text-[var(--text-muted)]">{task.rationale}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
            {task.due_date && <span>Due: {task.due_date.split("T")[0]}</span>}
            {task.estimated_minutes && <span>~{task.estimated_minutes}min</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskUpdateCard({
  update,
  selected,
  onToggle,
}: {
  update: ProposedTaskUpdate;
  selected: boolean;
  onToggle: () => void;
}) {
  const changes: string[] = [];
  if (update.new_status) changes.push(`Status → ${update.new_status}`);
  if (update.new_priority) changes.push(`Priority → ${update.new_priority}`);
  if (update.new_due_date) changes.push(`Due → ${update.new_due_date.split("T")[0]}`);
  
  return (
    <div
      onClick={onToggle}
      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
        selected
          ? "bg-[var(--warning)]/10 border-[var(--warning)]/50"
          : "bg-[var(--surface-2)] border-[var(--border-subtle)] opacity-60"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
            selected
              ? "bg-[var(--warning)] border-[var(--warning)]"
              : "border-[var(--border)]"
          }`}
        >
          {selected && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[var(--text-primary)] mb-1">{update.current_title}</p>
          <div className="flex flex-wrap gap-2 mb-1">
            {changes.map((change, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 text-xs rounded bg-[var(--warning)]/20 text-[var(--warning)]"
              >
                {change}
              </span>
            ))}
          </div>
          <p className="text-xs text-[var(--text-muted)]">{update.rationale}</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════════ */

function generatePlanNoteContent(
  proposal: PlanProposal,
  createdTaskIds: string[],
  updatedTaskIds: string[]
): string {
  const lines: string[] = [];
  
  lines.push(`# Week Plan: ${proposal.week_start.split("T")[0]} to ${proposal.week_end.split("T")[0]}`);
  lines.push("");
  lines.push(`*Generated by AI Chief of Staff on ${new Date().toLocaleString()}*`);
  lines.push("");
  
  // Outcomes
  if (proposal.outcomes.length > 0) {
    lines.push("## Outcomes");
    lines.push("");
    for (const outcome of proposal.outcomes) {
      lines.push(`### ${outcome.priority}. ${outcome.description}`);
      lines.push("");
      lines.push(`*${outcome.rationale}*`);
      lines.push("");
    }
  }
  
  // Focus areas
  if (proposal.focus_areas && proposal.focus_areas.length > 0) {
    lines.push("## Focus Areas");
    lines.push("");
    for (const area of proposal.focus_areas) {
      lines.push(`- ${area}`);
    }
    lines.push("");
  }
  
  // Created tasks
  if (createdTaskIds.length > 0) {
    lines.push("## Tasks Created");
    lines.push("");
    lines.push(`${createdTaskIds.length} new task(s) created from this plan.`);
    lines.push("");
  }
  
  // Updated tasks
  if (updatedTaskIds.length > 0) {
    lines.push("## Tasks Updated");
    lines.push("");
    lines.push(`${updatedTaskIds.length} task(s) updated from this plan.`);
    lines.push("");
  }
  
  // AI reasoning
  if (proposal.reasoning) {
    lines.push("## AI Reasoning");
    lines.push("");
    lines.push(proposal.reasoning);
    lines.push("");
  }
  
  return lines.join("\n");
}
