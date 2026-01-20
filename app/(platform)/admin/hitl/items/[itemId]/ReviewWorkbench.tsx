"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

/* ═══════════════════════════════════════════════════════════════════════════
   Review Workbench Component
   Side-by-side interface for HITL review with keyboard shortcuts
   ═══════════════════════════════════════════════════════════════════════════ */

type ReviewContent = {
  input: string;
  output: string;
  context?: Record<string, unknown>;
  ai_decision?: string;
  confidence?: number;
  risk_score?: number;
  risk_level?: string;
  risk_signals?: Array<{
    type: string;
    score: number;
    reason: string;
  }>;
  policy_triggers?: string[];
  kb_sources?: Array<{
    id: string;
    title: string;
    excerpt?: string;
  }>;
  user_metadata?: Record<string, unknown>;
};

type DecisionOption = {
  decision_value: string;
  display_label: string;
  keyboard_shortcut?: string;
  color?: string;
  requires_reason?: boolean;
  requires_modification?: boolean;
};

type HITLItem = {
  id: string;
  status: string;
  priority: string;
  source_type: string;
  trigger_type: string;
  trigger_details: Record<string, unknown>;
  review_content: ReviewContent;
  risk_evaluation?: {
    risk_score: number;
    risk_level: string;
    signals: Array<{ type: string; score: number; reason: string }>;
  };
  decisions?: Array<{
    id: string;
    decision: string;
    decision_reason: string | null;
    created_at: string;
    reviewer: { name: string };
  }>;
  queue?: { name: string };
  policy?: { name: string; triggers: unknown[] };
};

type Props = {
  item: HITLItem;
  decisionOptions: DecisionOption[];
  userId: string;
  userName: string | null;
  isAssigned: boolean;
};

export function ReviewWorkbench({
  item,
  decisionOptions,
  userId,
  userName,
  isAssigned,
}: Props) {
  const router = useRouter();
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [modifiedOutput, setModifiedOutput] = useState(item.review_content.output);
  const [aiCorrect, setAiCorrect] = useState<boolean | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewStartedAt] = useState(new Date().toISOString());

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Find matching decision option by shortcut
      const option = decisionOptions.find(
        (o) => o.keyboard_shortcut?.toLowerCase() === e.key.toLowerCase()
      );
      if (option) {
        setSelectedDecision(option.decision_value);
      }

      // Enter to submit if decision selected
      if (e.key === "Enter" && selectedDecision && !submitting) {
        handleSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [decisionOptions, selectedDecision, submitting]);

  const handleSubmit = async () => {
    if (!selectedDecision) return;

    const option = decisionOptions.find((o) => o.decision_value === selectedDecision);
    if (option?.requires_reason && !reason) {
      setError("Please provide a reason for this decision");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/hitl/items/${item.id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: selectedDecision,
          decision_reason: reason || undefined,
          modified_output: option?.requires_modification ? modifiedOutput : undefined,
          ai_was_correct: aiCorrect,
          decision_tags: tags.length > 0 ? tags : undefined,
          review_started_at: reviewStartedAt,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/admin/hitl");
        router.refresh();
      } else {
        setError(data.error || "Failed to submit decision");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (
    actionType: "create_guardrail" | "create_eval_case" | "open_incident"
  ) => {
    alert(`Action: ${actionType} - would integrate with respective system`);
  };

  const content = item.review_content;
  const riskEval = item.risk_evaluation || content;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Panel: Content Review */}
      <div className="flex-1 overflow-y-auto p-6 border-r border-[var(--border-subtle)]">
        {/* Input */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
            Input
          </h3>
          <div className="p-4 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)]">
            <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">
              {content.input}
            </p>
          </div>
        </div>

        {/* AI Output */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
            AI Output
            {content.confidence && (
              <span className="ml-2 text-xs text-[var(--text-muted)]">
                Confidence: {Math.round(content.confidence * 100)}%
              </span>
            )}
          </h3>
          <div className="p-4 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)]">
            <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">
              {content.output}
            </p>
          </div>
        </div>

        {/* Context */}
        {content.context && Object.keys(content.context).length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
              Context
            </h3>
            <div className="p-4 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)]">
              <pre className="text-xs text-[var(--text-muted)] overflow-x-auto">
                {JSON.stringify(content.context, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* KB Sources */}
        {content.kb_sources && content.kb_sources.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
              KB Sources Referenced
            </h3>
            <div className="space-y-2">
              {content.kb_sources.map((source) => (
                <div
                  key={source.id}
                  className="p-3 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)]"
                >
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {source.title}
                  </p>
                  {source.excerpt && (
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {source.excerpt}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Metadata (safe subset) */}
        {content.user_metadata && Object.keys(content.user_metadata).length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
              User Context
            </h3>
            <div className="p-4 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)]">
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(content.user_metadata).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-[var(--text-muted)]">{key}:</span>{" "}
                    <span className="text-[var(--text-primary)]">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel: Triggers, Risk, Decision */}
      <div className="w-[400px] flex flex-col overflow-y-auto bg-[var(--surface-1)]">
        {/* Risk & Triggers */}
        <div className="p-6 border-b border-[var(--border-subtle)]">
          {/* Risk Score */}
          {riskEval.risk_score !== undefined && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
                Risk Assessment
              </h3>
              <div className="flex items-center gap-3">
                <div
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    riskEval.risk_level === "critical"
                      ? "bg-[var(--error)] text-white"
                      : riskEval.risk_level === "high"
                      ? "bg-[var(--warning)] text-[var(--void)]"
                      : riskEval.risk_level === "medium"
                      ? "bg-[var(--warning)]/50 text-[var(--void)]"
                      : "bg-[var(--success)]/20 text-[var(--success)]"
                  }`}
                >
                  {riskEval.risk_level?.toUpperCase()}
                </div>
                <span className="text-sm text-[var(--text-primary)]">
                  Score: {riskEval.risk_score}/100
                </span>
              </div>
            </div>
          )}

          {/* Risk Signals */}
          {(("risk_signals" in riskEval && riskEval.risk_signals) || ("signals" in riskEval && riskEval.signals)) && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-[var(--text-muted)] mb-2">
                Risk Signals
              </h4>
              <div className="space-y-1">
                {(("risk_signals" in riskEval && riskEval.risk_signals) || ("signals" in riskEval && riskEval.signals) || []).map((signal, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs p-2 rounded bg-[var(--surface-2)]"
                  >
                    <span className="text-[var(--text-secondary)]">
                      {signal.type}
                    </span>
                    <span
                      className={
                        signal.score > 50
                          ? "text-[var(--error)]"
                          : "text-[var(--text-muted)]"
                      }
                    >
                      {signal.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Policy Triggers */}
          {content.policy_triggers && content.policy_triggers.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-[var(--text-muted)] mb-2">
                Policy Triggers
              </h4>
              <div className="flex flex-wrap gap-1">
                {content.policy_triggers.map((trigger) => (
                  <span
                    key={trigger}
                    className="px-2 py-0.5 rounded text-xs bg-[var(--warning)]/20 text-[var(--warning)]"
                  >
                    {trigger}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Decision Panel */}
        <div className="flex-1 p-6">
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
            Decision
          </h3>

          {/* Decision Options */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {decisionOptions.map((option) => (
              <button
                key={option.decision_value}
                onClick={() => setSelectedDecision(option.decision_value)}
                disabled={!isAssigned || submitting}
                className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                  selectedDecision === option.decision_value
                    ? "bg-[var(--electric-lime)] text-[var(--void)]"
                    : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                } disabled:opacity-50`}
              >
                {option.display_label}
                {option.keyboard_shortcut && (
                  <span className="ml-2 text-xs opacity-60">
                    [{option.keyboard_shortcut}]
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Modification textarea if needed */}
          {selectedDecision &&
            decisionOptions.find((o) => o.decision_value === selectedDecision)
              ?.requires_modification && (
              <div className="mb-4">
                <label className="block text-xs text-[var(--text-muted)] mb-1">
                  Modified Output
                </label>
                <textarea
                  value={modifiedOutput}
                  onChange={(e) => setModifiedOutput(e.target.value)}
                  className="w-full h-32 px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] resize-none"
                />
              </div>
            )}

          {/* Reason */}
          <div className="mb-4">
            <label className="block text-xs text-[var(--text-muted)] mb-1">
              Reason (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why this decision?"
              className="w-full h-20 px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] resize-none"
            />
          </div>

          {/* AI Correct Toggle */}
          <div className="mb-4">
            <label className="block text-xs text-[var(--text-muted)] mb-2">
              Was AI correct?
            </label>
            <div className="flex items-center gap-2">
              {[
                { value: true, label: "Yes" },
                { value: false, label: "No" },
                { value: null, label: "Unsure" },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => setAiCorrect(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    aiCorrect === opt.value
                      ? "bg-[var(--electric-lime)] text-[var(--void)]"
                      : "bg-[var(--surface-2)] text-[var(--text-secondary)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[var(--error)]/10 text-[var(--error)] text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!selectedDecision || !isAssigned || submitting}
            className="w-full py-3 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Decision [Enter]"}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="p-6 border-t border-[var(--border-subtle)]">
          <h4 className="text-xs font-medium text-[var(--text-muted)] mb-2">
            Quick Actions
          </h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleAction("create_guardrail")}
              className="px-3 py-1.5 rounded-lg bg-[var(--surface-2)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Create Guardrail Rule
            </button>
            <button
              onClick={() => handleAction("create_eval_case")}
              className="px-3 py-1.5 rounded-lg bg-[var(--surface-2)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Create Eval Test Case
            </button>
            <button
              onClick={() => handleAction("open_incident")}
              className="px-3 py-1.5 rounded-lg bg-[var(--surface-2)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Open Incident
            </button>
          </div>
        </div>

        {/* Previous Decisions */}
        {item.decisions && item.decisions.length > 0 && (
          <div className="p-6 border-t border-[var(--border-subtle)]">
            <h4 className="text-xs font-medium text-[var(--text-muted)] mb-2">
              Previous Decisions
            </h4>
            <div className="space-y-2">
              {item.decisions.map((d) => (
                <div
                  key={d.id}
                  className="p-2 rounded bg-[var(--surface-2)] text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[var(--text-primary)]">
                      {d.decision}
                    </span>
                    <span className="text-[var(--text-muted)]">
                      {d.reviewer?.name}
                    </span>
                  </div>
                  {d.decision_reason && (
                    <p className="text-[var(--text-muted)] mt-1">
                      {d.decision_reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
