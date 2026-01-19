"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { VaultSuggestion } from "@/types/vault";

/* ═══════════════════════════════════════════════════════════════════════════
   Vault Suggestions Page
   AI-powered organization suggestions
   ═══════════════════════════════════════════════════════════════════════════ */

export default function VaultSuggestionsPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<VaultSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  
  useEffect(() => {
    const sid = sessionStorage.getItem("vault_session_id");
    if (!sid) {
      router.push("/super-admin/vault");
      return;
    }
    setSessionId(sid);
    loadSuggestions(sid);
  }, [router]);
  
  async function loadSuggestions(sid: string) {
    try {
      setLoading(true);
      const res = await fetch("/api/vault/suggestions", {
        headers: { "x-vault-session": sid },
      });
      
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (err) {
      console.error("Failed to load suggestions:", err);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleGenerateSuggestions() {
    if (!sessionId) return;
    
    setGenerating(true);
    try {
      const res = await fetch("/api/vault/suggestions", {
        method: "POST",
        headers: { "x-vault-session": sessionId },
      });
      
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (err) {
      console.error("Failed to generate suggestions:", err);
    } finally {
      setGenerating(false);
    }
  }
  
  async function handleAction(suggestionId: string, action: "accept" | "dismiss") {
    if (!sessionId) return;
    
    setProcessing(suggestionId);
    try {
      const res = await fetch("/api/vault/suggestions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-vault-session": sessionId,
        },
        body: JSON.stringify({ suggestion_id: suggestionId, action }),
      });
      
      if (res.ok) {
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      }
    } catch (err) {
      console.error("Failed to process suggestion:", err);
    } finally {
      setProcessing(null);
    }
  }
  
  if (loading || !sessionId) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-[var(--text-muted)]">
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Loading suggestions...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/super-admin/vault"
            className="p-1.5 rounded-lg hover:bg-[var(--surface-1)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              AI Suggestions
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Smart recommendations to organize your vault
            </p>
          </div>
          <button
            onClick={handleGenerateSuggestions}
            disabled={generating}
            className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {generating ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                </svg>
                Generate Suggestions
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Suggestions List */}
      {suggestions.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--surface-1)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
            No suggestions yet
          </h3>
          <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto mb-6">
            Click &quot;Generate Suggestions&quot; to analyze your files and get AI-powered recommendations for organizing your vault.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.map(suggestion => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              processing={processing === suggestion.id}
              onAccept={() => handleAction(suggestion.id, "accept")}
              onDismiss={() => handleAction(suggestion.id, "dismiss")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Suggestion Card Component
   ═══════════════════════════════════════════════════════════════════════════ */

interface SuggestionCardProps {
  suggestion: VaultSuggestion;
  processing: boolean;
  onAccept: () => void;
  onDismiss: () => void;
}

function SuggestionCard({ suggestion, processing, onAccept, onDismiss }: SuggestionCardProps) {
  const { icon, color, label } = getSuggestionTypeInfo(suggestion.type);
  
  return (
    <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
          {icon}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 text-xs rounded font-medium ${color}`}>
              {label}
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              {suggestion.confidence != null
                ? `${Math.round(suggestion.confidence * 100)}% confidence`
                : "Confidence unknown"}
            </span>
          </div>
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-1">
            {suggestion.title}
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            {suggestion.description}
          </p>
          
          {/* Affected files count */}
          {suggestion.file_ids && suggestion.file_ids.length > 0 && (
            <p className="text-xs text-[var(--text-muted)] mt-2">
              Affects {suggestion.file_ids.length} file{suggestion.file_ids.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onDismiss}
            disabled={processing}
            className="px-3 py-1.5 text-sm rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-colors disabled:opacity-50"
          >
            Dismiss
          </button>
          <button
            onClick={onAccept}
            disabled={processing}
            className="px-3 py-1.5 text-sm rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all disabled:opacity-50"
          >
            {processing ? "..." : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}

function getSuggestionTypeInfo(type: string): { icon: React.ReactNode; color: string; label: string } {
  switch (type) {
    case "duplicate":
      return {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
          </svg>
        ),
        color: "bg-[var(--warning)]/10 text-[var(--warning)]",
        label: "Duplicate",
      };
    case "consolidate":
      return {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
        ),
        color: "bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]",
        label: "Consolidate",
      };
    case "organize":
      return {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
          </svg>
        ),
        color: "bg-blue-500/10 text-blue-500",
        label: "Organize",
      };
    case "rename":
      return {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        ),
        color: "bg-purple-500/10 text-purple-500",
        label: "Rename",
      };
    case "archive":
      return {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
        ),
        color: "bg-gray-500/10 text-gray-400",
        label: "Archive",
      };
    default:
      return {
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        ),
        color: "bg-[var(--surface-2)] text-[var(--text-muted)]",
        label: "Suggestion",
      };
  }
}
