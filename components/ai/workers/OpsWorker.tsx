"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { DecisionIntakeForm } from "@/components/ops/DecisionIntakeForm";
import { ProposalReview } from "@/components/ops/ProposalReview";
import type {
  Decision,
  DecisionSource,
  OpsProposal,
  OpsRunLog,
  OpsCommitResponse,
} from "@/lib/ai/prompts/opsWorker";
import type { AIWorkerJobRow } from "@/types/ai-jobs";

/* ═══════════════════════════════════════════════════════════════════════════
   Ops Worker - Decision to Tasks
   Extracted as a reusable component for the AI Team
   ═══════════════════════════════════════════════════════════════════════════ */

type ViewState = "intake" | "generating" | "review" | "success";

export default function OpsWorker() {
  const searchParams = useSearchParams();

  // View state
  const [view, setView] = useState<ViewState>("intake");

  // Data state
  const [, setCurrentDecision] = useState<Decision | null>(null);
  const [currentRun, setCurrentRun] = useState<OpsRunLog | null>(null);
  const [proposal, setProposal] = useState<OpsProposal | null>(null);
  const [commitResult, setCommitResult] = useState<OpsCommitResponse | null>(null);
  const [budgetInfo, setBudgetInfo] = useState<{
    used_cents: number;
    remaining_cents: number;
    warning?: string;
  }>();

  // Selection state
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [selectedUpdateIds, setSelectedUpdateIds] = useState<Set<string>>(new Set());

  // Loading states
  const [ingesting, setIngesting] = useState(false);
  const [proposing, setProposing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recent decisions
  const [recentDecisions, setRecentDecisions] = useState<Decision[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  // Settings
  const [cheapMode, setCheapMode] = useState(false);
  const [job, setJob] = useState<AIWorkerJobRow | null>(null);

  // Load recent decisions
  useEffect(() => {
    async function loadRecent() {
      try {
        const res = await fetch("/api/ops/ingest?limit=5");
        if (res.ok) {
          const data = await res.json();
          setRecentDecisions(data.decisions || []);
        }
      } catch (err) {
        console.error("Failed to load recent decisions:", err);
      } finally {
        setLoadingRecent(false);
      }
    }
    loadRecent();
  }, []);

  // Restore job from query param (e.g. from notification)
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

      setView("generating");
      void pollJobUntilDone(jobId, {
        onUpdate: setJob,
        onCompleted: (done) => {
          setJob(done);
          applyCompletedJob(done);
        },
        onFailed: (failed) => {
          setJob(failed);
          setError(failed.error_message || "Job failed");
          setView("intake");
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load job");
    }
  }

  function applyCompletedJob(done: AIWorkerJobRow) {
    const response = (done.result as any)?.response as any;
    if (!response?.proposal || !response?.run) {
      setError("Job completed but returned no proposal");
      setView("intake");
      return;
    }

    setCurrentRun(response.run);
    setProposal(response.proposal);
    setBudgetInfo(response.budget);

    const allTaskIds = new Set<string>(response.proposal.tasks_to_create.map((t: { id: string }) => t.id));
    const allUpdateIds = new Set<string>(response.proposal.tasks_to_update.map((t: { task_id: string }) => t.task_id));
    setSelectedTaskIds(allTaskIds);
    setSelectedUpdateIds(allUpdateIds);
    setView("review");
  }

  // Ingest a new decision
  async function handleIngest(data: { raw_text: string; source: DecisionSource }) {
    setIngesting(true);
    setError(null);
    setJob(null);

    try {
      // Step 1: Ingest the decision
      const ingestRes = await fetch("/api/ops/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!ingestRes.ok) {
        const errData = await ingestRes.json();
        throw new Error(errData.error || "Failed to ingest decision");
      }

      const { decision } = await ingestRes.json();
      setCurrentDecision(decision);

      // Step 2: Enqueue proposals (async)
      setView("generating");

      const jobRes = await fetch("/api/ai/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          worker_id: "ops",
          job_type: "ops_propose",
          input: {
            decision_id: decision.id,
            cheap_mode: cheapMode,
          },
        }),
      });

      if (!jobRes.ok) {
        const errData = await jobRes.json();
        throw new Error(errData.error || "Failed to enqueue ops proposals job");
      }

      const jobData = await jobRes.json();
      setJob(jobData.job);

      setProposing(true);
      void pollJobUntilDone(jobData.job.id, {
        onUpdate: setJob,
        onCompleted: (done) => {
          setJob(done);
          setProposing(false);
          applyCompletedJob(done);
        },
        onFailed: (failed) => {
          setJob(failed);
          setProposing(false);
          setError(failed.error_message || "Job failed");
          setView("intake");
        },
      });
    } catch (err) {
      console.error("Ingest/propose error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setView("intake");
    } finally {
      setIngesting(false);
      // proposing is set false when job completes/fails
    }
  }

  // Commit selected tasks
  async function handleCommit() {
    if (!currentRun || !proposal) return;

    setCommitting(true);
    setError(null);

    try {
      const res = await fetch("/api/ops/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          run_id: currentRun.id,
          selected_task_ids: Array.from(selectedTaskIds),
          selected_update_ids: Array.from(selectedUpdateIds),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to commit tasks");
      }

      const data: OpsCommitResponse = await res.json();
      setCommitResult(data);
      setView("success");
    } catch (err) {
      console.error("Commit error:", err);
      setError(err instanceof Error ? err.message : "Failed to create tasks");
    } finally {
      setCommitting(false);
    }
  }

  // Reset to start over
  function handleReset() {
    setView("intake");
    setCurrentDecision(null);
    setCurrentRun(null);
    setProposal(null);
    setCommitResult(null);
    setSelectedTaskIds(new Set());
    setSelectedUpdateIds(new Set());
    setError(null);
    setJob(null);
  }

  // Toggle task selection
  function toggleTask(id: string) {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleUpdate(id: string) {
    setSelectedUpdateIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // Resume a previous decision
  async function handleResume(decision: Decision) {
    if (decision.status === "proposed" && decision.ops_run_id) {
      // Load the existing proposal
      try {
        const res = await fetch(`/api/ops/decisions/${decision.id}`);
        if (res.ok) {
          const data = await res.json();
          const fullDecision = data.decision;
          setCurrentDecision(fullDecision);

          if (fullDecision.ops_run?.proposal) {
            setCurrentRun(fullDecision.ops_run);
            setProposal(fullDecision.ops_run.proposal);

            const allTaskIds = new Set<string>(
              fullDecision.ops_run.proposal.tasks_to_create.map((t: { id: string }) => t.id)
            );
            const allUpdateIds = new Set<string>(
              fullDecision.ops_run.proposal.tasks_to_update.map((t: { task_id: string }) => t.task_id)
            );
            setSelectedTaskIds(allTaskIds);
            setSelectedUpdateIds(allUpdateIds);

            setView("review");
          }
        }
      } catch (err) {
        console.error("Failed to load decision:", err);
      }
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--electric-lime)] to-[var(--electric-cyan)] flex items-center justify-center">
            <svg
              className="w-5 h-5 text-[var(--void)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Ops Worker</h1>
            <p className="text-sm text-[var(--text-muted)]">Turn decisions into actionable tasks with AI</p>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-[var(--error)]/10 border border-[var(--error)]/30">
          <p className="text-sm text-[var(--error)]">{error}</p>
        </div>
      )}

      {/* Job status */}
      {job && view !== "review" && view !== "success" && (
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

      {/* Success state */}
      {view === "success" && commitResult && (
        <div className="mb-6 p-6 rounded-2xl bg-[var(--success)]/10 border border-[var(--success)]/30">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[var(--success)] flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[var(--text-primary)] mb-1">Tasks Created Successfully</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Created {commitResult.created_tasks.length} task(s)
                {commitResult.updated_tasks.length > 0 && ` and updated ${commitResult.updated_tasks.length} task(s)`}.
                {commitResult.errors.length > 0 && ` ${commitResult.errors.length} error(s) occurred.`}
              </p>

              {/* List created tasks */}
              {commitResult.created_tasks.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-[var(--text-muted)] mb-2">Created:</p>
                  <ul className="space-y-1">
                    {commitResult.created_tasks.map((t) => (
                      <li key={t.task_id} className="text-sm text-[var(--text-secondary)]">
                        • {t.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

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
                  Process Another
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generating state */}
      {view === "generating" && (
        <div className="p-12 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--electric-cyan)]/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[var(--electric-cyan)] animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Analyzing Content</h3>
          <p className="text-sm text-[var(--text-muted)]">
            AI is extracting action items and generating task proposals...
          </p>
        </div>
      )}

      {/* Intake form */}
      {view === "intake" && (
        <div className="space-y-6">
          {/* Settings */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Cheap Mode</p>
              <p className="text-xs text-[var(--text-muted)]">Use faster, cheaper model (less accurate)</p>
            </div>
            <button
              onClick={() => setCheapMode(!cheapMode)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                cheapMode ? "bg-[var(--electric-lime)]" : "bg-[var(--surface-2)]"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  cheapMode ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Intake form */}
          <div className="p-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Process Decision</h2>
            <DecisionIntakeForm onSubmit={handleIngest} loading={ingesting || proposing} />
          </div>

          {/* Recent decisions */}
          {!loadingRecent && recentDecisions.length > 0 && (
            <div className="p-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
              <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Recent Decisions</h3>
              <div className="space-y-2">
                {recentDecisions.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-2)]/80 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[var(--text-primary)] truncate">
                        {(d.source as DecisionSource).label || (d.source as DecisionSource).type}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {d.status} • {new Date(d.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {d.status === "proposed" && (
                      <button
                        onClick={() => handleResume(d)}
                        className="px-3 py-1 text-xs rounded-lg bg-[var(--electric-cyan)]/20 text-[var(--electric-cyan)] hover:bg-[var(--electric-cyan)]/30 transition-colors"
                      >
                        Resume
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Proposal review */}
      {view === "review" && proposal && (
        <ProposalReview
          proposal={proposal}
          selectedTaskIds={selectedTaskIds}
          selectedUpdateIds={selectedUpdateIds}
          onToggleTask={toggleTask}
          onToggleUpdate={toggleUpdate}
          onApply={handleCommit}
          onCancel={handleReset}
          applying={committing}
          {...(budgetInfo ? { budgetInfo } : {})}
        />
      )}
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
}
