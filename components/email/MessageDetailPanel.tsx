"use client";

import { useEffect, useState } from "react";
import type { EmailMessage, EmailSuggestion } from "@/types/email";

type Props = {
  message: EmailMessage;
  onClose: () => void;
  onReply: (message: EmailMessage) => void;
  onStar: (message: EmailMessage) => void;
  onDelete: (message: EmailMessage) => void;
  canViewAdminPanels?: boolean;
};

export function MessageDetailPanel({
  message,
  onClose,
  onReply,
  onStar,
  onDelete,
  canViewAdminPanels = false,
}: Props) {
  const [showRawHeaders, setShowRawHeaders] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiIntent, setAiIntent] = useState<string | null>(null);
  const [aiSentiment, setAiSentiment] = useState<string | null>(null);
  const [aiPriorityScore, setAiPriorityScore] = useState<number | null>(null);
  const [aiProcessedAt, setAiProcessedAt] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<EmailSuggestion[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    setShowAiPanel(false);
    setAiSummary(null);
    setAiIntent(null);
    setAiSentiment(null);
    setAiPriorityScore(null);
    setAiProcessedAt(null);
    setAiSuggestions([]);
    setAiError(null);
  }, [message.id]);

  const fetchAiData = async () => {
    if (!canViewAdminPanels || !message.thread_id) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch(`/api/email/workspace/suggestions/${message.thread_id}`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setAiError(data?.error || "Failed to load AI data");
        return;
      }
      const data = await res.json();
      setAiSummary(data?.thread?.ai_summary || null);
      setAiIntent(data?.thread?.ai_intent || null);
      setAiSentiment(data?.thread?.ai_sentiment || null);
      setAiPriorityScore(typeof data?.thread?.ai_priority_score === "number" ? data.thread.ai_priority_score : null);
      setAiProcessedAt(data?.thread?.ai_processed_at || null);
      setAiSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Failed to load AI data");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (canViewAdminPanels && showAiPanel) {
      void fetchAiData();
    }
  }, [canViewAdminPanels, showAiPanel, message.thread_id]);

  const runAiReadability = async () => {
    if (!message.id) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/email/workspace/ai/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_id: message.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setAiError(data?.error || "Failed to queue AI processing");
        return;
      }
      await fetchAiData();
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Failed to queue AI processing");
    } finally {
      setAiLoading(false);
    }
  };

  const markSuggestionUsed = async (suggestionId: string) => {
    if (!message.thread_id) return;
    try {
      const res = await fetch(`/api/email/workspace/suggestions/${message.thread_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestion_id: suggestionId }),
      });
      if (res.ok) {
        setAiSuggestions((prev) =>
          prev.map((s) => (s.id === suggestionId ? { ...s, used_at: new Date().toISOString() } : s))
        );
      }
    } catch {
      // Ignore; UI should remain usable even if marking fails.
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString();
  };

  const formatAddresses = (addresses?: { email: string; name?: string }[]) => {
    if (!addresses || addresses.length === 0) return "";
    return addresses.map(a => a.name ? `${a.name} <${a.email}>` : a.email).join(", ");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            aria-label="Close message"
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex items-center gap-1">
          {canViewAdminPanels && (
          <button
            onClick={() => setShowAiPanel((prev) => !prev)}
            aria-label={showAiPanel ? "Collapse AI panel" : "Expand AI panel"}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--electric-lime)] hover:bg-[var(--surface-1)] transition-colors"
            title={showAiPanel ? "Hide AI panel" : "Show AI panel"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18 10.5l.354 1.237a2.25 2.25 0 001.409 1.409L21 13.5l-1.237.354a2.25 2.25 0 00-1.409 1.409L18 16.5l-.354-1.237a2.25 2.25 0 00-1.409-1.409L15 13.5l1.237-.354a2.25 2.25 0 001.409-1.409L18 10.5z" />
            </svg>
          </button>
          )}
          <button
            onClick={() => onReply(message)}
            aria-label="Reply to message"
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)] transition-colors"
            title="Reply"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
          </button>
          
          <button
            onClick={() => onStar(message)}
            aria-label={message.is_starred ? "Unstar message" : "Star message"}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)] transition-colors"
            title={message.is_starred ? "Unstar" : "Star"}
          >
            <svg
              className={`w-5 h-5 ${message.is_starred ? "fill-[var(--warning)] text-[var(--warning)]" : ""}`}
              fill={message.is_starred ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </button>
          
          <button
            onClick={() => onDelete(message)}
            aria-label="Delete message"
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--surface-1)] transition-colors"
            title="Delete"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_280px] gap-6">
          <div>
            {/* Subject */}
            <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
              {message.subject || "(No subject)"}
            </h1>

            {/* Sender Info */}
            <div className="flex items-start gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--electric-lime)] to-[var(--electric-cyan)] flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-[var(--void)]">
                  {(message.from_name || message.from_address).charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {message.from_name || message.from_address}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {message.from_address}
                    </p>
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">
                    {formatDate(message.received_at || message.sent_at)}
                  </span>
                </div>
                
                {/* Recipients */}
                <div className="mt-2 text-xs text-[var(--text-muted)]">
                  <p>
                    <span className="text-[var(--text-secondary)]">To:</span>{" "}
                    {formatAddresses(message.to_addresses)}
                  </p>
                  {message.cc_addresses && message.cc_addresses.length > 0 && (
                    <p>
                      <span className="text-[var(--text-secondary)]">Cc:</span>{" "}
                      {formatAddresses(message.cc_addresses)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Attachments */}
            {message.has_attachments && message.attachments && message.attachments.length > 0 && (
              <div className="mb-6 p-3 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)]">
                <p className="text-xs text-[var(--text-muted)] mb-2">
                  {message.attachments.length} attachment{message.attachments.length > 1 ? "s" : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  {message.attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--surface-2)] text-sm"
                    >
                      <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                      </svg>
                      <span className="text-[var(--text-secondary)]">{att.filename}</span>
                      {att.size && (
                        <span className="text-xs text-[var(--text-muted)]">
                          ({formatFileSize(att.size)})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Body */}
            <div className="prose prose-invert max-w-none">
              {message.body_html ? (
                <div
                  className="email-body text-sm text-[var(--text-secondary)]"
                  dangerouslySetInnerHTML={{ __html: message.body_html }}
                />
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-[var(--text-secondary)] font-sans">
                  {message.body_text || "No content"}
                </pre>
              )}
            </div>

            {/* Debug: Raw Headers */}
            {canViewAdminPanels && message.raw_headers && (
              <div className="mt-8">
                <button
                  onClick={() => setShowRawHeaders(!showRawHeaders)}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  {showRawHeaders ? "Hide" : "Show"} raw headers
                </button>
                {showRawHeaders && (
                  <pre className="mt-2 p-3 rounded-lg bg-[var(--surface-1)] text-xs text-[var(--text-muted)] overflow-x-auto">
                    {JSON.stringify(message.raw_headers, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* AI Panel */}
          {canViewAdminPanels && (
            <div className="lg:sticky lg:top-4 h-fit">
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">AI Summary</p>
                  <button
                    onClick={() => setShowAiPanel((prev) => !prev)}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {showAiPanel ? "Collapse" : "Expand"}
                  </button>
                </div>
                {showAiPanel ? (
                  <div className="mt-3 space-y-4">
                  <div className="rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--surface-2)] p-3">
                    <p className="text-xs text-[var(--text-muted)]">Summary</p>
                    {aiLoading ? (
                      <p className="mt-2 text-sm text-[var(--text-muted)]">Loading AI summary…</p>
                    ) : aiSummary ? (
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">{aiSummary}</p>
                    ) : (
                      <p className="mt-2 text-sm text-[var(--text-muted)]">
                        No AI summary yet. Run readability to generate one.
                      </p>
                    )}
                    {aiError && (
                      <p className="mt-2 text-xs text-[var(--error)]">{aiError}</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-[var(--text-muted)]">
                      {aiIntent && (
                        <span className="px-2 py-1 rounded-full border border-[var(--border-subtle)]">
                          Intent: {aiIntent}
                        </span>
                      )}
                      {aiSentiment && (
                        <span className="px-2 py-1 rounded-full border border-[var(--border-subtle)]">
                          Sentiment: {aiSentiment}
                        </span>
                      )}
                      {typeof aiPriorityScore === "number" && (
                        <span className="px-2 py-1 rounded-full border border-[var(--border-subtle)]">
                          Priority: {aiPriorityScore.toFixed(2)}
                        </span>
                      )}
                      {aiProcessedAt && (
                        <span className="px-2 py-1 rounded-full border border-[var(--border-subtle)]">
                          Processed: {new Date(aiProcessedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                    {!aiSummary && (
                      <button
                        onClick={runAiReadability}
                        disabled={aiLoading}
                        className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                      >
                        Run AI readability
                      </button>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Suggested actions</p>
                    <div className="mt-2 grid gap-2">
                      {aiSuggestions.length === 0 && (
                        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3 text-xs text-[var(--text-muted)]">
                          No suggestions yet.
                        </div>
                      )}
                      {aiSuggestions.map((suggestion) => (
                        <div
                          key={suggestion.id}
                          className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3"
                        >
                          <p className="text-xs text-[var(--text-muted)]">Suggested reply</p>
                          <p className="mt-2 text-sm text-[var(--text-secondary)] line-clamp-4">
                            {suggestion.body_text || "No suggestion text"}
                          </p>
                          <div className="mt-3 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                            <span>
                              Confidence {typeof suggestion.confidence_score === "number"
                                ? suggestion.confidence_score.toFixed(2)
                                : "–"}
                            </span>
                            <button
                              onClick={() => markSuggestionUsed(suggestion.id)}
                              disabled={Boolean(suggestion.used_at)}
                              className="px-2 py-1 rounded-md border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-60"
                            >
                              {suggestion.used_at ? "Used" : "Mark used"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-[var(--text-muted)]">
                    Expand for summary, suggested actions, and confidence details.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reply Footer */}
      <div className="p-4 border-t border-[var(--border-subtle)]">
        <button
          onClick={() => onReply(message)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--surface-1)] text-[var(--text-secondary)] text-sm hover:bg-[var(--surface-2)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
          Reply
        </button>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
