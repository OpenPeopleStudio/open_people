"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/* ═══════════════════════════════════════════════════════════════════════════
   Danger Zone Section
   Destructive actions like vault deletion
   ═══════════════════════════════════════════════════════════════════════════ */

interface DangerZoneSectionProps {
  sessionId: string;
  vaultId: string;
}

export function DangerZoneSection({ sessionId, vaultId }: DangerZoneSectionProps) {
  void vaultId;
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  async function handleDeleteVault() {
    if (deleteConfirmText !== "DELETE MY VAULT") {
      setError("Please type the confirmation text exactly");
      return;
    }
    
    if (!password) {
      setError("Password is required");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/vault", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-vault-session": sessionId,
        },
        body: JSON.stringify({ password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete vault");
      }
      
      // Clear session storage
      sessionStorage.removeItem("vault_session_id");
      sessionStorage.removeItem("vault_encryption_key");
      sessionStorage.removeItem("vault_expires_at");
      
      // Redirect to vault page (which will show setup)
      router.push("/super-admin/vault");
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete vault");
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--error)]/20">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--error)]/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-sm font-medium text-[var(--error)]">
              Danger Zone
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Irreversible and destructive actions
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-[var(--text-muted)] transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-[var(--error)]/20">
          <div className="mt-4 p-4 rounded-lg bg-[var(--error)]/5 border border-[var(--error)]/10">
            <h4 className="text-sm font-medium text-[var(--error)] mb-2">
              Delete Vault
            </h4>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Permanently delete your vault and all its contents. This action cannot be undone.
              All encrypted files, folders, and settings will be permanently destroyed.
            </p>
            
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-sm rounded-lg bg-[var(--error)] text-white font-medium hover:brightness-110 transition-all"
              >
                Delete Vault
              </button>
            ) : (
              <div className="space-y-4">
                {error && (
                  <div className="p-2 rounded bg-[var(--error)]/10">
                    <p className="text-xs text-[var(--error)]">{error}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">
                    Type <span className="font-mono text-[var(--error)]">DELETE MY VAULT</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE MY VAULT"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--error)]"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">
                    Enter your master password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Master password"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--error)]"
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteVault}
                    disabled={loading || deleteConfirmText !== "DELETE MY VAULT" || !password}
                    className="px-4 py-2 text-sm rounded-lg bg-[var(--error)] text-white font-medium hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? "Deleting..." : "Permanently Delete"}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText("");
                      setPassword("");
                      setError(null);
                    }}
                    className="px-4 py-2 text-sm rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
