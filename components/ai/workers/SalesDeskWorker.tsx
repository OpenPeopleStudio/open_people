"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { AIWorkerJobRow } from "@/types/ai-jobs";

/* ═══════════════════════════════════════════════════════════════════════════
   Sales Desk Worker - Call Prep, Follow-Ups, and Objection Handling
   ═══════════════════════════════════════════════════════════════════════════ */

interface SalesPrepResult {
  call_prep_brief: string;
  talking_points: string[];
  objection_scripts: {
    objection: string;
    response: string;
  }[];
  follow_up_draft: {
    subject: string;
    body: string;
  };
  suggested_tasks: {
    title: string;
    due_date?: string;
    priority: "urgent" | "high" | "normal" | "low";
  }[];
  reasoning: string;
}

export default function SalesDeskWorker() {
  const searchParams = useSearchParams();

  // Form state
  const [leadName, setLeadName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [opportunityContext, setOpportunityContext] = useState("");
  const [previousEmails, setPreviousEmails] = useState("");
  const [knownObjections, setKnownObjections] = useState("");
  const [callObjective, setCallObjective] = useState("");
  const [cheapMode, setCheapMode] = useState(false);

  // Job/result state
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<SalesPrepResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<AIWorkerJobRow | null>(null);

  // Applied state
  const [appliedTasks, setAppliedTasks] = useState<Set<number>>(new Set());
  const [applyingIdx, setApplyingIdx] = useState<number | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Restore job from URL param
  useEffect(() => {
    const jobId = searchParams.get("job");
    if (jobId) {
      void hydrateJob(jobId);
    }
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
    const response = (done.result as Record<string, unknown>)
      ?.response as SalesPrepResult | undefined;
    if (!response) {
      setError("Job completed but returned no result");
      return;
    }
    setResult(response);
  }

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setResult(null);
    setJob(null);
    setAppliedTasks(new Set());

    try {
      const input = {
        lead_name: leadName.trim() || undefined,
        company_name: companyName.trim() || undefined,
        opportunity_context: opportunityContext.trim() || undefined,
        previous_emails: previousEmails.trim() || undefined,
        known_objections: knownObjections.trim() || undefined,
        call_objective: callObjective.trim() || undefined,
        cheap_mode: cheapMode,
      };

      const res = await fetch("/api/ai/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          worker_id: "sales-desk",
          job_type: "sales_prep",
          input,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to enqueue sales prep job");
      }

      const data = await res.json();
      setJob(data.job);

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
      setError(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCreateTask(idx: number) {
    if (!result) return;
    const task = result.suggested_tasks[idx];
    if (!task) return;

    setApplyingIdx(idx);

    try {
      const res = await fetch("/api/workflows/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: task.title,
          due_date: task.due_date,
          priority: task.priority,
          tags: ["sales-desk"],
        }),
      });

      if (res.ok) {
        setAppliedTasks((prev) => new Set(prev).add(idx));
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create task");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setApplyingIdx(null);
    }
  }

  function handleCopy(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  }

  function handleReset() {
    setResult(null);
    setJob(null);
    setAppliedTasks(new Set());
    setError(null);
  }

  const isProcessing =
    generating || job?.status === "queued" || job?.status === "running";

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#22D3EE] flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Sales Desk
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Prepare for calls, draft follow-ups, and handle objections
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-[var(--error)]/10 border border-[var(--error)]/30">
          <p className="text-sm text-[var(--error)]">{error}</p>
        </div>
      )}

      {/* Job status */}
      {job && !result && (
        <div className="mb-6 p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Run status: {job.status}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                You can keep using the app. You&apos;ll get an in-app
                notification when this completes.
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

      {/* Form */}
      {!result && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Lead / Opportunity Info
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    Lead Name
                  </label>
                  <input
                    type="text"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="e.g., John Smith"
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#6366F1]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g., Acme Corp"
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#6366F1]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Opportunity Context
                </label>
                <textarea
                  value={opportunityContext}
                  onChange={(e) => setOpportunityContext(e.target.value)}
                  placeholder="Describe the deal stage, product interest, budget, timeline..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] resize-none focus:outline-none focus:border-[#6366F1]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Previous Emails / Notes (optional)
                </label>
                <textarea
                  value={previousEmails}
                  onChange={(e) => setPreviousEmails(e.target.value)}
                  placeholder="Paste relevant email threads or meeting notes..."
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] resize-none focus:outline-none focus:border-[#6366F1]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Known Objections (optional)
                </label>
                <textarea
                  value={knownObjections}
                  onChange={(e) => setKnownObjections(e.target.value)}
                  placeholder="e.g., Price concern, competitor evaluation, timing..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] resize-none focus:outline-none focus:border-[#6366F1]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Call Objective
                </label>
                <input
                  type="text"
                  value={callObjective}
                  onChange={(e) => setCallObjective(e.target.value)}
                  placeholder="e.g., Book a demo, close the deal, handle pricing objection"
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[#6366F1]"
                />
              </div>

              {/* Cheap mode toggle */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setCheapMode(!cheapMode)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    cheapMode
                      ? "bg-[#6366F1]"
                      : "bg-[var(--surface-2)] border border-[var(--border-subtle)]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      cheapMode ? "translate-x-5" : ""
                    }`}
                  />
                </button>
                <span className="text-sm text-[var(--text-secondary)]">
                  Fast mode (cheaper, less detailed)
                </span>
              </div>
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isProcessing || !opportunityContext.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#22D3EE] text-white font-semibold hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <svg
                  className="w-5 h-5 animate-spin"
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
                Generating...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Generate Sales Prep
              </>
            )}
          </button>

          <p className="text-xs text-[var(--text-muted)] text-center">
            The AI will generate a call prep brief, objection scripts, a
            follow-up email draft, and suggested next-step tasks.
          </p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Call Prep Brief */}
          <div className="p-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-[#6366F1]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Call Prep Brief
              </h3>
              <button
                onClick={() =>
                  handleCopy(result.call_prep_brief, "call_prep_brief")
                }
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                {copiedField === "call_prep_brief" ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="prose prose-sm prose-invert max-w-none text-[var(--text-secondary)] whitespace-pre-wrap">
              {result.call_prep_brief}
            </div>
          </div>

          {/* Talking Points */}
          {result.talking_points.length > 0 && (
            <div className="p-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
              <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-[#22D3EE]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                Talking Points
              </h3>
              <ul className="space-y-2">
                {result.talking_points.map((point, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                  >
                    <span className="text-[#6366F1] mt-1">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Objection Scripts */}
          {result.objection_scripts.length > 0 && (
            <div className="p-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
              <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-[var(--warning)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                Objection Scripts
              </h3>
              <div className="space-y-4">
                {result.objection_scripts.map((script, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]"
                  >
                    <p className="text-sm font-medium text-[var(--warning)] mb-2">
                      &quot;{script.objection}&quot;
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {script.response}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Follow-Up Draft */}
          <div className="p-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-[var(--electric-cyan)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Follow-Up Email Draft
              </h3>
              <button
                onClick={() =>
                  handleCopy(
                    `Subject: ${result.follow_up_draft.subject}\n\n${result.follow_up_draft.body}`,
                    "follow_up"
                  )
                }
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                {copiedField === "follow_up" ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-[var(--text-muted)]">
                  Subject:
                </span>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {result.follow_up_draft.subject}
                </p>
              </div>
              <div>
                <span className="text-xs text-[var(--text-muted)]">Body:</span>
                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                  {result.follow_up_draft.body}
                </p>
              </div>
            </div>
          </div>

          {/* Suggested Tasks */}
          {result.suggested_tasks.length > 0 && (
            <div className="p-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
              <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-[var(--electric-lime)]"
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
                Suggested Tasks
              </h3>
              <div className="space-y-2">
                {result.suggested_tasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-1.5 py-0.5 text-xs rounded ${
                            task.priority === "urgent"
                              ? "bg-[var(--error)]/20 text-[var(--error)]"
                              : task.priority === "high"
                              ? "bg-[var(--warning)]/20 text-[var(--warning)]"
                              : "bg-[var(--surface-1)] text-[var(--text-muted)]"
                          }`}
                        >
                          {task.priority}
                        </span>
                        {task.due_date && (
                          <span className="text-xs text-[var(--text-muted)]">
                            Due: {task.due_date.split("T")[0]}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCreateTask(idx)}
                      disabled={
                        appliedTasks.has(idx) || applyingIdx === idx
                      }
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        appliedTasks.has(idx)
                          ? "bg-[var(--success)]/20 text-[var(--success)]"
                          : "bg-[var(--electric-lime)] text-[var(--void)] hover:brightness-110"
                      }`}
                    >
                      {appliedTasks.has(idx)
                        ? "Created"
                        : applyingIdx === idx
                        ? "..."
                        : "Create"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reasoning */}
          {result.reasoning && (
            <div className="p-4 rounded-xl bg-[var(--surface-2)]">
              <h4 className="text-sm font-medium text-[var(--text-muted)] mb-2">
                AI Reasoning
              </h4>
              <p className="text-sm text-[var(--text-secondary)]">
                {result.reasoning}
              </p>
            </div>
          )}

          {/* Reset button */}
          <button
            onClick={handleReset}
            className="w-full py-3 rounded-xl bg-[var(--surface-1)] text-[var(--text-secondary)] font-medium hover:text-[var(--text-primary)] transition-colors"
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Polling Helpers
   ═══════════════════════════════════════════════════════════════════════════ */

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
