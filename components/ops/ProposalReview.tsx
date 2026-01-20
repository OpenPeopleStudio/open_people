"use client";

import { useState } from "react";
import type { OpsProposal, ProposedActionItem, ProposedTaskUpdate } from "@/lib/ai/prompts/opsWorker";
import { ChecklistEditor } from "./ChecklistEditor";

interface ProposalReviewProps {
  proposal: OpsProposal;
  selectedTaskIds: Set<string>;
  selectedUpdateIds: Set<string>;
  onToggleTask: (id: string) => void;
  onToggleUpdate: (id: string) => void;
  onApply: () => void;
  onCancel: () => void;
  applying?: boolean;
  budgetInfo?: {
    used_cents: number;
    remaining_cents: number;
    warning?: string;
  };
}

const priorityColors: Record<string, string> = {
  urgent: "var(--error)",
  high: "var(--warning)",
  normal: "var(--electric-cyan)",
  low: "var(--text-muted)",
};

export function ProposalReview({
  proposal,
  selectedTaskIds,
  selectedUpdateIds,
  onToggleTask,
  onToggleUpdate,
  onApply,
  onCancel,
  applying,
  budgetInfo,
}: ProposalReviewProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const totalSelected = selectedTaskIds.size + selectedUpdateIds.size;
  const hasSelections = totalSelected > 0;

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-[var(--text-primary)]">Proposal Review</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">{proposal.decision_summary}</p>
          </div>
          <button onClick={onCancel} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            Start Over
          </button>
        </div>

        {/* Budget warning */}
        {budgetInfo?.warning && (
          <div className="mt-3 p-2 rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/30">
            <p className="text-xs text-[var(--warning)]">{budgetInfo.warning}</p>
          </div>
        )}
      </div>

      {/* Themes */}
      {proposal.themes && proposal.themes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {proposal.themes.map((theme, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 text-xs rounded-full bg-[var(--surface-2)] text-[var(--text-secondary)]"
            >
              {theme}
            </span>
          ))}
        </div>
      )}

      {/* Tasks to create */}
      {proposal.tasks_to_create.length > 0 && (
        <div className="p-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-[var(--electric-cyan)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Tasks ({selectedTaskIds.size}/{proposal.tasks_to_create.length} selected)
          </h3>
          <div className="space-y-3">
            {proposal.tasks_to_create.map((task) => (
              <TaskCreateCard
                key={task.id}
                task={task}
                selected={selectedTaskIds.has(task.id)}
                expanded={expandedTask === task.id}
                onToggle={() => onToggleTask(task.id)}
                onExpand={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tasks to update */}
      {proposal.tasks_to_update.length > 0 && (
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Task Updates ({selectedUpdateIds.size}/{proposal.tasks_to_update.length} selected)
          </h3>
          <div className="space-y-2">
            {proposal.tasks_to_update.map((update) => (
              <TaskUpdateCard
                key={update.task_id}
                update={update}
                selected={selectedUpdateIds.has(update.task_id)}
                onToggle={() => onToggleUpdate(update.task_id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Questions */}
      {proposal.questions.length > 0 && (
        <div className="p-6 rounded-2xl bg-[var(--warning)]/10 border border-[var(--warning)]/30">
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
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Questions
          </h3>
          <div className="space-y-3">
            {proposal.questions.map((q) => (
              <div key={q.id} className="text-sm">
                <p className="text-[var(--text-primary)]">{q.question}</p>
                {q.context && <p className="text-[var(--text-muted)] text-xs mt-1">{q.context}</p>}
                {q.suggestions && q.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {q.suggestions.map((s, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-xs rounded bg-[var(--surface-2)] text-[var(--text-secondary)]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {proposal.warnings && proposal.warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-[var(--error)]/10 border border-[var(--error)]/30">
          <h4 className="text-sm font-medium text-[var(--error)] mb-2">Warnings</h4>
          <ul className="text-sm text-[var(--text-secondary)] space-y-1">
            {proposal.warnings.map((w, idx) => (
              <li key={idx}>• {w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* AI Reasoning */}
      {proposal.reasoning && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] flex items-center gap-1">
            <svg
              className="w-4 h-4 group-open:rotate-90 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            AI Reasoning
          </summary>
          <div className="mt-2 p-4 rounded-xl bg-[var(--surface-2)] text-sm text-[var(--text-secondary)]">
            {proposal.reasoning}
          </div>
        </details>
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
          disabled={applying || !hasSelections}
          className="flex-1 py-3 rounded-xl bg-[var(--electric-lime)] text-[var(--void)] font-semibold hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {applying ? (
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
              Creating Tasks...
            </>
          ) : (
            <>
              Create {totalSelected} Task{totalSelected !== 1 ? "s" : ""}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Task Create Card
   ═══════════════════════════════════════════════════════════════════════════ */

function TaskCreateCard({
  task,
  selected,
  expanded,
  onToggle,
  onExpand,
}: {
  task: ProposedActionItem;
  selected: boolean;
  expanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
}) {
  return (
    <div
      className={`rounded-lg border transition-colors ${
        selected
          ? "bg-[var(--electric-cyan)]/10 border-[var(--electric-cyan)]/50"
          : "bg-[var(--surface-2)] border-[var(--border-subtle)] opacity-60"
      }`}
    >
      <div className="p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-start gap-3">
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
              selected ? "bg-[var(--electric-cyan)] border-[var(--electric-cyan)]" : "border-[var(--border)]"
            }`}
          >
            {selected && (
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
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
              <span
                className="px-1.5 py-0.5 text-xs rounded bg-[var(--surface-1)] text-[var(--text-muted)]"
                title="Confidence score"
              >
                {Math.round(task.confidence * 100)}%
              </span>
            </div>

            {task.description && <p className="text-sm text-[var(--text-muted)] mb-1">{task.description}</p>}

            <p className="text-xs text-[var(--text-muted)] italic">{task.rationale}</p>

            <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)] flex-wrap">
              {task.due_date && <span>Due: {task.due_date.split("T")[0]}</span>}
              {task.estimated_minutes && <span>~{task.estimated_minutes}min</span>}
              {task.project_name && <span>Project: {task.project_name}</span>}
              {task.checklist && task.checklist.length > 0 && <span>{task.checklist.length} steps</span>}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExpand();
            }}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0"
          >
            <svg
              className={`w-5 h-5 transition-transform ${expanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-[var(--border-subtle)]">
          {/* Source excerpt */}
          {task.source_excerpt && (
            <div className="mt-3 p-3 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)]">
              <p className="text-xs text-[var(--text-muted)] mb-1">Source excerpt:</p>
              <p className="text-sm text-[var(--text-secondary)] italic">&ldquo;{task.source_excerpt}&rdquo;</p>
            </div>
          )}

          {/* Checklist */}
          {task.checklist && task.checklist.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-[var(--text-muted)] mb-2">Checklist:</p>
              <ChecklistEditor items={task.checklist} readOnly />
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {task.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-xs rounded-full bg-[var(--surface-1)] text-[var(--text-muted)]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Task Update Card
   ═══════════════════════════════════════════════════════════════════════════ */

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
  if (update.add_checklist_items && update.add_checklist_items.length > 0) {
    changes.push(`+${update.add_checklist_items.length} checklist item(s)`);
  }

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
            selected ? "bg-[var(--warning)] border-[var(--warning)]" : "border-[var(--border)]"
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
              <span key={idx} className="px-2 py-0.5 text-xs rounded bg-[var(--warning)]/20 text-[var(--warning)]">
                {change}
              </span>
            ))}
          </div>
          <p className="text-xs text-[var(--text-muted)] italic">{update.rationale}</p>
        </div>
      </div>
    </div>
  );
}
