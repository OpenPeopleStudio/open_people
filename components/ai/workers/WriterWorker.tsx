"use client";

import { useState } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   Writer Worker - Content & Copy Generation
   Beta scaffold - generates drafts, emails, and marketing copy
   ═══════════════════════════════════════════════════════════════════════════ */

type ContentType = "email" | "landing" | "social" | "blog" | "custom";

const CONTENT_TYPES: { id: ContentType; label: string; description: string }[] = [
  { id: "email", label: "Email", description: "Marketing emails, newsletters, outreach" },
  { id: "landing", label: "Landing Page", description: "Headlines, copy, CTAs" },
  { id: "social", label: "Social Post", description: "Twitter, LinkedIn, Instagram" },
  { id: "blog", label: "Blog Post", description: "Articles, tutorials, guides" },
  { id: "custom", label: "Custom", description: "Any other type of content" },
];

const TONE_OPTIONS = [
  "Professional",
  "Friendly",
  "Casual",
  "Formal",
  "Playful",
  "Urgent",
  "Empathetic",
];

export default function WriterWorker() {
  const [contentType, setContentType] = useState<ContentType>("email");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("Professional");
  const [additionalContext, setAdditionalContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!topic.trim()) return;
    
    setGenerating(true);
    setError(null);
    
    try {
      // TODO: Implement /api/ai/write endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      setError("Writer API not yet implemented. Coming soon!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate content");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#EF4444] flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Writer</h1>
              <span className="text-xs px-2 py-0.5 rounded bg-[var(--warning)]/10 text-[var(--warning)]">
                Beta
              </span>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              Draft content, emails, and marketing copy
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

      {/* Input form */}
      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Create Content
          </h2>

          <div className="space-y-5">
            {/* Content type selector */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Content Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CONTENT_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setContentType(type.id)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      contentType === type.id
                        ? "bg-[var(--electric-lime)]/10 border-[var(--electric-lime)] text-[var(--electric-lime)]"
                        : "bg-[var(--surface-2)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <div className="text-sm font-medium">{type.label}</div>
                    <div className="text-xs opacity-70 mt-0.5">{type.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Topic/Subject */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Topic / Subject
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={
                  contentType === "email"
                    ? "e.g., Welcome email for new users who just signed up"
                    : contentType === "landing"
                      ? "e.g., Landing page for our new AI writing tool"
                      : "What should this content be about?"
                }
                rows={3}
                className="w-full px-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] resize-none focus:outline-none focus:border-[var(--electric-lime)]"
              />
            </div>

            {/* Audience */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Target Audience
              </label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g., Small business owners, developers, marketers"
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
              />
            </div>

            {/* Tone selector */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Tone
              </label>
              <div className="flex flex-wrap gap-2">
                {TONE_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      tone === t
                        ? "bg-[var(--electric-lime)] text-[var(--void)]"
                        : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional context */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Additional Context (optional)
              </label>
              <textarea
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="Any specific requirements, examples, or constraints..."
                rows={2}
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] resize-none focus:outline-none focus:border-[var(--electric-lime)]"
              />
            </div>
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={generating || !topic.trim()}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#EF4444] text-white font-semibold hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Writing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Generate Content
            </>
          )}
        </button>

        {/* Info */}
        <p className="text-xs text-[var(--text-muted)] text-center">
          AI will generate multiple variants. You can save as a note or email template.
        </p>
      </div>
    </div>
  );
}
