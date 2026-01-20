"use client";

import { useState } from "react";
import type { DecisionSourceType, DecisionSource } from "@/lib/ai/prompts/opsWorker";

interface DecisionIntakeFormProps {
  onSubmit: (data: { raw_text: string; source: DecisionSource }) => Promise<void>;
  loading?: boolean;
}

const SOURCE_OPTIONS: { value: DecisionSourceType; label: string; description: string }[] = [
  { value: "manual", label: "Manual Entry", description: "Paste decisions, notes, or action items" },
  { value: "meeting_notes", label: "Meeting Notes", description: "Notes from a meeting with action items" },
  { value: "email", label: "Email", description: "Email thread with tasks or follow-ups" },
  { value: "note", label: "Note", description: "Existing note with decisions" },
  { value: "inbox", label: "Inbox Item", description: "Item from your inbox to process" },
];

export function DecisionIntakeForm({ onSubmit, loading }: DecisionIntakeFormProps) {
  const [rawText, setRawText] = useState("");
  const [sourceType, setSourceType] = useState<DecisionSourceType>("manual");
  const [sourceLabel, setSourceLabel] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rawText.trim()) return;

    await onSubmit({
      raw_text: rawText,
      source: {
        type: sourceType,
        label: sourceLabel || undefined,
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Source type selector */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          Source Type
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SOURCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSourceType(opt.value)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                sourceType === opt.value
                  ? "bg-[var(--electric-lime)]/10 border-[var(--electric-lime)] text-[var(--electric-lime)]"
                  : "bg-[var(--surface-2)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <div className="text-sm font-medium">{opt.label}</div>
              <div className="text-xs opacity-70 mt-0.5">{opt.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Source label */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
          Label (optional)
        </label>
        <input
          type="text"
          value={sourceLabel}
          onChange={(e) => setSourceLabel(e.target.value)}
          placeholder={
            sourceType === "meeting_notes"
              ? "e.g., Team sync Jan 15"
              : sourceType === "email"
                ? "e.g., Project kickoff thread"
                : "Brief description"
          }
          className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
        />
      </div>

      {/* Content input */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
          Content
        </label>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder={
            sourceType === "meeting_notes"
              ? "Paste your meeting notes here. Include attendees, discussion points, and any action items mentioned..."
              : sourceType === "email"
                ? "Paste the email content here. Include the subject, sender, and body..."
                : "Paste or type the content you want to extract tasks from..."
          }
          rows={10}
          required
          className="w-full px-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] resize-none focus:outline-none focus:border-[var(--electric-lime)] font-mono text-sm"
        />
        <p className="text-xs text-[var(--text-muted)] mt-1">
          The AI will analyze this content and extract actionable tasks with suggested due dates and priorities.
        </p>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading || !rawText.trim()}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--electric-cyan)] to-[var(--electric-lime)] text-[var(--void)] font-semibold hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
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
            Processing...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Extract Tasks
          </>
        )}
      </button>
    </form>
  );
}
