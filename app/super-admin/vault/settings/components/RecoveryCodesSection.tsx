"use client";

import { useState } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   Recovery Codes Section
   View and regenerate recovery codes
   ═══════════════════════════════════════════════════════════════════════════ */

interface RecoveryCodesSectionProps {
  sessionId: string;
  remainingCodes: number;
  onRegenerated: (count: number) => void;
}

export function RecoveryCodesSection({ 
  sessionId, 
  remainingCodes, 
  onRegenerated 
}: RecoveryCodesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCodes, setNewCodes] = useState<string[] | null>(null);
  
  async function handleRegenerate() {
    if (!password) {
      setError("Password is required");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/vault/recovery-codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vault-session": sessionId,
        },
        body: JSON.stringify({ password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to regenerate codes");
      }
      
      setNewCodes(data.recovery_codes);
      setShowRegenerateConfirm(false);
      setPassword("");
      onRegenerated(data.recovery_codes.length);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate codes");
    } finally {
      setLoading(false);
    }
  }
  
  function handleDownloadCodes() {
    if (!newCodes) return;
    
    const content = [
      "VAULT RECOVERY CODES",
      "==================",
      "",
      "Keep these codes in a safe place. Each code can only be used once.",
      "",
      ...newCodes.map((code, i) => `${i + 1}. ${code}`),
      "",
      `Generated: ${new Date().toISOString()}`,
    ].join("\n");
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vault-recovery-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  return (
    <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--surface-2)] flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">
              Recovery Codes
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              {remainingCodes} codes remaining · Use if you forget your password
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {remainingCodes < 3 && (
            <span className="px-2 py-1 text-xs rounded bg-[var(--warning)]/10 text-[var(--warning)]">
              Low
            </span>
          )}
          <svg
            className={`w-5 h-5 text-[var(--text-muted)] transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-[var(--border-subtle)]">
          {/* New codes display */}
          {newCodes && (
            <div className="mt-4 p-4 rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/20">
              <h4 className="text-sm font-medium text-[var(--success)] mb-2">
                New Recovery Codes
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mb-3">
                Save these codes securely. You won&apos;t see them again.
              </p>
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {newCodes.map((code, i) => (
                  <div key={i} className="p-2 bg-[var(--surface-1)] rounded text-[var(--text-primary)]">
                    {code}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => navigator.clipboard.writeText(newCodes.join("\n"))}
                  className="px-3 py-1.5 text-xs rounded bg-[var(--surface-1)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Copy All
                </button>
                <button
                  onClick={handleDownloadCodes}
                  className="px-3 py-1.5 text-xs rounded bg-[var(--surface-1)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Download
                </button>
              </div>
            </div>
          )}
          
          {!newCodes && (
            <div className="mt-4">
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Recovery codes let you access your vault if you forget your master password.
                Each code can only be used once. When you use a code, you&apos;ll be prompted to set a new password.
              </p>
              
              {/* Status */}
              <div className="p-3 rounded-lg bg-[var(--surface-2)] mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-muted)]">Remaining codes</span>
                  <span className={`text-sm font-medium ${
                    remainingCodes < 3 
                      ? "text-[var(--warning)]" 
                      : "text-[var(--text-primary)]"
                  }`}>
                    {remainingCodes} of 10
                  </span>
                </div>
                <div className="mt-2 h-2 bg-[var(--surface-1)] rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      remainingCodes < 3 
                        ? "bg-[var(--warning)]" 
                        : "bg-[var(--electric-lime)]"
                    }`}
                    style={{ width: `${(remainingCodes / 10) * 100}%` }}
                  />
                </div>
              </div>
              
              {!showRegenerateConfirm ? (
                <button
                  onClick={() => setShowRegenerateConfirm(true)}
                  className="px-4 py-2 text-sm rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-colors"
                >
                  Regenerate Recovery Codes
                </button>
              ) : (
                <div className="p-4 rounded-lg bg-[var(--surface-2)]">
                  <p className="text-sm text-[var(--warning)] mb-3">
                    This will invalidate all existing recovery codes. Enter your password to confirm.
                  </p>
                  
                  {error && (
                    <div className="p-2 rounded bg-[var(--error)]/10 mb-3">
                      <p className="text-xs text-[var(--error)]">{error}</p>
                    </div>
                  )}
                  
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your master password"
                    className="w-full px-3 py-2 mb-3 text-sm rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                  />
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleRegenerate}
                      disabled={loading || !password}
                      className="px-3 py-1.5 text-sm rounded-lg bg-[var(--warning)] text-[var(--void)] font-medium hover:brightness-110 disabled:opacity-50"
                    >
                      {loading ? "Regenerating..." : "Regenerate"}
                    </button>
                    <button
                      onClick={() => { setShowRegenerateConfirm(false); setPassword(""); setError(null); }}
                      className="px-3 py-1.5 text-sm rounded-lg bg-[var(--surface-1)] text-[var(--text-secondary)]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
