"use client";

import { useState } from "react";
import type { DisagreementMetrics, QAQueueItem } from "@/lib/hitl/qa-sampling";

/* ═══════════════════════════════════════════════════════════════════════════
   QA Dashboard Client Component
   Reviewer accuracy metrics and QA review interface
   ═══════════════════════════════════════════════════════════════════════════ */

type Props = {
  metrics: DisagreementMetrics[];
  qaQueue: QAQueueItem[];
  userId: string;
};

export function QADashboard({
  metrics,
  qaQueue: initialQueue,
  userId,
}: Props) {
  const [activeTab, setActiveTab] = useState<"metrics" | "review">(
    metrics.length > 0 ? "metrics" : "review"
  );
  const [qaQueue, setQaQueue] = useState(initialQueue);
  const [currentReview, setCurrentReview] = useState<QAQueueItem | null>(null);
  const [reviewForm, setReviewForm] = useState({
    wasCorrect: true,
    feedback: "",
    correctDecision: "",
    disagreementReason: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleStartReview = (item: QAQueueItem) => {
    setCurrentReview(item);
    setReviewForm({
      wasCorrect: true,
      feedback: "",
      correctDecision: "",
      disagreementReason: "",
    });
  };

  const handleSubmitQA = async () => {
    if (!currentReview) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/hitl/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision_id: currentReview.decision_id,
          was_correct: reviewForm.wasCorrect,
          feedback: reviewForm.feedback || undefined,
          correct_decision: reviewForm.correctDecision || undefined,
          disagreement_reason: reviewForm.disagreementReason || undefined,
        }),
      });

      if (res.ok) {
        // Remove from queue
        setQaQueue((prev) =>
          prev.filter((i) => i.decision_id !== currentReview.decision_id)
        );
        setCurrentReview(null);
      }
    } catch (error) {
      console.error("Submit QA error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--surface-1)] w-fit">
        {[
          { id: "metrics" as const, label: "Reviewer Accuracy" },
          { id: "review" as const, label: `QA Queue (${qaQueue.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-[var(--electric-lime)] text-[var(--void)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Metrics Tab */}
      {activeTab === "metrics" && (
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <div className="p-4 border-b border-[var(--border-subtle)]">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">
              Reviewer Accuracy (Last 30 Days)
            </h3>
          </div>

          {metrics.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)]">
              No QA data available yet
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {metrics.map((m) => (
                <div key={m.reviewer_id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {m.reviewer_name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          m.accuracy_rate >= 95
                            ? "bg-[var(--success)]/20 text-[var(--success)]"
                            : m.accuracy_rate >= 80
                            ? "bg-[var(--warning)]/20 text-[var(--warning)]"
                            : "bg-[var(--error)]/20 text-[var(--error)]"
                        }`}
                      >
                        {m.accuracy_rate}% accuracy
                      </span>
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">
                      {m.total_correct}/{m.total_sampled} correct
                    </span>
                  </div>

                  {/* Decision breakdown */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {Object.entries(m.disagreement_by_decision).map(
                      ([decision, data]) => (
                        <span
                          key={decision}
                          className="text-xs px-2 py-1 rounded bg-[var(--surface-2)]"
                        >
                          {decision}: {data.correct}/{data.sampled}
                        </span>
                      )
                    )}
                  </div>

                  {/* Common disagreements */}
                  {m.common_disagreements.length > 0 && (
                    <div className="text-xs text-[var(--text-muted)]">
                      Common issues: {m.common_disagreements.join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Review Tab */}
      {activeTab === "review" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Queue List */}
          <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
            <div className="p-4 border-b border-[var(--border-subtle)]">
              <h3 className="text-sm font-medium text-[var(--text-primary)]">
                Decisions for QA Review
              </h3>
            </div>

            {qaQueue.length === 0 ? (
              <div className="p-8 text-center text-[var(--text-muted)]">
                No decisions pending QA review
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)] max-h-[500px] overflow-y-auto">
                {qaQueue.map((item) => (
                  <button
                    key={item.decision_id}
                    onClick={() => handleStartReview(item)}
                    className={`w-full p-4 text-left hover:bg-[var(--surface-2)]/50 transition-colors ${
                      currentReview?.decision_id === item.decision_id
                        ? "bg-[var(--electric-lime)]/10"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          item.original_decision === "approve"
                            ? "bg-[var(--success)]/20 text-[var(--success)]"
                            : item.original_decision === "reject"
                            ? "bg-[var(--error)]/20 text-[var(--error)]"
                            : "bg-[var(--warning)]/20 text-[var(--warning)]"
                        }`}
                      >
                        {item.original_decision}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {item.sampling_reason}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-primary)] line-clamp-2">
                      {(item.review_content as { input?: string })?.input?.slice(0, 100)}...
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* QA Review Panel */}
          <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
            {currentReview ? (
              <div className="p-6">
                <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">
                  Review Decision
                </h3>

                {/* Original content */}
                <div className="mb-4">
                  <label className="block text-xs text-[var(--text-muted)] mb-1">
                    Input
                  </label>
                  <div className="p-3 rounded-lg bg-[var(--surface-2)] text-sm text-[var(--text-primary)] max-h-24 overflow-y-auto">
                    {(currentReview.review_content as { input?: string })?.input}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs text-[var(--text-muted)] mb-1">
                    Output
                  </label>
                  <div className="p-3 rounded-lg bg-[var(--surface-2)] text-sm text-[var(--text-primary)] max-h-24 overflow-y-auto">
                    {(currentReview.review_content as { output?: string })?.output}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs text-[var(--text-muted)] mb-1">
                    Original Decision
                  </label>
                  <span
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      currentReview.original_decision === "approve"
                        ? "bg-[var(--success)]/20 text-[var(--success)]"
                        : currentReview.original_decision === "reject"
                        ? "bg-[var(--error)]/20 text-[var(--error)]"
                        : "bg-[var(--warning)]/20 text-[var(--warning)]"
                    }`}
                  >
                    {currentReview.original_decision}
                  </span>
                </div>

                {/* Was correct toggle */}
                <div className="mb-4">
                  <label className="block text-xs text-[var(--text-muted)] mb-2">
                    Was this decision correct?
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setReviewForm((p) => ({ ...p, wasCorrect: true }))
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        reviewForm.wasCorrect
                          ? "bg-[var(--success)] text-white"
                          : "bg-[var(--surface-2)] text-[var(--text-secondary)]"
                      }`}
                    >
                      Yes, Correct
                    </button>
                    <button
                      onClick={() =>
                        setReviewForm((p) => ({ ...p, wasCorrect: false }))
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        !reviewForm.wasCorrect
                          ? "bg-[var(--error)] text-white"
                          : "bg-[var(--surface-2)] text-[var(--text-secondary)]"
                      }`}
                    >
                      No, Incorrect
                    </button>
                  </div>
                </div>

                {/* If incorrect, what should it be */}
                {!reviewForm.wasCorrect && (
                  <>
                    <div className="mb-4">
                      <label className="block text-xs text-[var(--text-muted)] mb-1">
                        What should the decision have been?
                      </label>
                      <select
                        value={reviewForm.correctDecision}
                        onChange={(e) =>
                          setReviewForm((p) => ({
                            ...p,
                            correctDecision: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)]"
                      >
                        <option value="">Select...</option>
                        <option value="approve">Approve</option>
                        <option value="reject">Reject</option>
                        <option value="modify">Modify</option>
                        <option value="escalate_further">Escalate</option>
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="block text-xs text-[var(--text-muted)] mb-1">
                        Why was it incorrect?
                      </label>
                      <textarea
                        value={reviewForm.disagreementReason}
                        onChange={(e) =>
                          setReviewForm((p) => ({
                            ...p,
                            disagreementReason: e.target.value,
                          }))
                        }
                        className="w-full h-20 px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] resize-none"
                        placeholder="Explain the disagreement..."
                      />
                    </div>
                  </>
                )}

                {/* Feedback */}
                <div className="mb-4">
                  <label className="block text-xs text-[var(--text-muted)] mb-1">
                    Additional Feedback (optional)
                  </label>
                  <textarea
                    value={reviewForm.feedback}
                    onChange={(e) =>
                      setReviewForm((p) => ({ ...p, feedback: e.target.value }))
                    }
                    className="w-full h-16 px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] resize-none"
                    placeholder="Any other comments..."
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmitQA}
                  disabled={submitting}
                  className="w-full py-3 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit QA Review"}
                </button>
              </div>
            ) : (
              <div className="p-12 text-center text-[var(--text-muted)]">
                Select a decision from the queue to review
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
