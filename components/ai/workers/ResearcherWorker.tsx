"use client";

import { useState } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   Researcher Worker - Briefs & Knowledge Capture
   Beta scaffold - generates research briefs and saves to knowledge base
   ═══════════════════════════════════════════════════════════════════════════ */

export default function ResearcherWorker() {
  const [question, setQuestion] = useState("");
  const [sources, setSources] = useState<string[]>(["internal"]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Placeholder for future implementation
  async function handleGenerate() {
    if (!question.trim()) return;
    
    setGenerating(true);
    setError(null);
    
    try {
      // TODO: Implement /api/ai/research endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      setError("Research API not yet implemented. Coming soon!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate research");
    } finally {
      setGenerating(false);
    }
  }

  function toggleSource(source: string) {
    setSources(prev =>
      prev.includes(source)
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[var(--electric-cyan)] flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Researcher</h1>
              <span className="text-xs px-2 py-0.5 rounded bg-[var(--warning)]/10 text-[var(--warning)]">
                Beta
              </span>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              Generate briefs and capture knowledge from questions
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
            Research Question
          </h2>

          <div className="space-y-5">
            {/* Question input */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                What do you want to research?
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., What are the best practices for authentication in Next.js apps?"
                rows={4}
                className="w-full px-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] resize-none focus:outline-none focus:border-[var(--electric-lime)]"
              />
            </div>

            {/* Source selector */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Sources to search
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "internal", label: "Your Knowledge Base" },
                  { id: "notes", label: "Notes" },
                  { id: "tasks", label: "Tasks & Projects" },
                  { id: "web", label: "Web Search", disabled: true },
                ].map((source) => (
                  <button
                    key={source.id}
                    onClick={() => !source.disabled && toggleSource(source.id)}
                    disabled={source.disabled}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      sources.includes(source.id)
                        ? "bg-[var(--electric-lime)] text-[var(--void)]"
                        : source.disabled
                          ? "bg-[var(--surface-2)] text-[var(--text-muted)] opacity-50 cursor-not-allowed"
                          : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {source.label}
                    {source.disabled && " (coming)"}
                  </button>
                ))}
              </div>
            </div>

            {/* Output format */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Output format
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "brief", label: "Research Brief", description: "Executive summary + key points" },
                  { id: "full", label: "Full Report", description: "Detailed analysis + citations" },
                ].map((format) => (
                  <button
                    key={format.id}
                    className="p-3 rounded-lg border text-left transition-colors bg-[var(--electric-lime)]/10 border-[var(--electric-lime)] text-[var(--electric-lime)]"
                  >
                    <div className="text-sm font-medium">{format.label}</div>
                    <div className="text-xs opacity-70 mt-0.5">{format.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={generating || !question.trim()}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[var(--electric-cyan)] text-white font-semibold hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Researching...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Generate Research Brief
            </>
          )}
        </button>

        {/* Info */}
        <p className="text-xs text-[var(--text-muted)] text-center">
          The AI will search your knowledge base and generate a structured brief.
          Results can be saved to your knowledge base or converted to tasks.
        </p>
      </div>
    </div>
  );
}
