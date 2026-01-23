"use client";

import { useState, useEffect, useCallback } from "react";
import type { VaultSpace } from "@/types/vault";

/* ═══════════════════════════════════════════════════════════════════════════
   Tenant Admin Vault Page
   Encrypted vault for secure file storage
   ═══════════════════════════════════════════════════════════════════════════ */

type VaultState = 
  | { status: "loading" }
  | { status: "no_vault" }
  | { status: "locked"; vault: VaultSpace }
  | { status: "unlocked"; vault: VaultSpace; sessionId: string; encryptionKey: string };

export default function TenantVaultPage() {
  const [state, setState] = useState<VaultState>({ status: "loading" });
  const [error, setError] = useState<string | null>(null);
  
  const checkVaultStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/vault/status");
      
      if (response.status === 404) {
        setState({ status: "no_vault" });
        return;
      }
      
      if (!response.ok) {
        throw new Error("Failed to check vault status");
      }
      
      const data = await response.json();
      
      // Check for existing session in sessionStorage
      const sessionId = sessionStorage.getItem("vault_session_id");
      const encryptionKey = sessionStorage.getItem("vault_encryption_key");
      
      if (sessionId && encryptionKey) {
        // Verify session is still valid
        const verifyResponse = await fetch("/api/vault/files?limit=1", {
          headers: { "x-vault-session": sessionId },
        });
        
        if (verifyResponse.ok) {
          setState({
            status: "unlocked",
            vault: data.vault,
            sessionId,
            encryptionKey,
          });
          return;
        }
        
        // Session invalid, clear it
        sessionStorage.removeItem("vault_session_id");
        sessionStorage.removeItem("vault_encryption_key");
      }
      
      setState({ status: "locked", vault: data.vault });
      
    } catch (err) {
      console.error("Vault status error:", err);
      setError("Failed to load vault status");
    }
  }, []);

  useEffect(() => {
    checkVaultStatus();
  }, [checkVaultStatus]);
  
  if (state.status === "loading") {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-[var(--text-muted)]">
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Loading vault...</span>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-xl bg-[var(--error)]/10 border border-[var(--error)]/20 p-6 text-center">
          <p className="text-[var(--error)]">{error}</p>
          <button
            onClick={() => { setError(null); checkVaultStatus(); }}
            className="mt-4 px-4 py-2 rounded-lg bg-[var(--surface-1)] text-[var(--text-primary)] text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  if (state.status === "no_vault") {
    return <VaultSetup onComplete={() => checkVaultStatus()} />;
  }
  
  if (state.status === "locked") {
    return (
      <VaultUnlock
        onUnlock={(sessionId, encryptionKey) => {
          sessionStorage.setItem("vault_session_id", sessionId);
          sessionStorage.setItem("vault_encryption_key", encryptionKey);
          setState({
            status: "unlocked",
            vault: state.vault,
            sessionId,
            encryptionKey,
          });
        }}
      />
    );
  }
  
  return (
    <VaultDashboard
      sessionId={state.sessionId}
      onLock={() => {
        sessionStorage.removeItem("vault_session_id");
        sessionStorage.removeItem("vault_encryption_key");
        setState({ status: "locked", vault: state.vault });
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Vault Setup
   ═══════════════════════════════════════════════════════════════════════════ */

function VaultSetup({ onComplete }: { onComplete: () => void }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  async function handleCreate() {
    if (password.length < 12) {
      setError("Password must be at least 12 characters");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setCreating(true);
    setError(null);
    
    try {
      const res = await fetch("/api/vault/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to create vault");
      }
      
      // Show recovery codes
      if (data.recovery_codes) {
        alert(`Vault created! Save these recovery codes securely:\n\n${data.recovery_codes.join("\n")}\n\nYou will not see these again.`);
      }
      
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create vault");
    } finally {
      setCreating(false);
    }
  }
  
  return (
    <div className="p-8 max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--electric-lime)] to-[var(--electric-cyan)] flex items-center justify-center">
          <svg className="w-8 h-8 text-[var(--void)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Create Your Vault
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          Set up end-to-end encrypted storage for sensitive files
        </p>
      </div>
      
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/20">
            <p className="text-sm text-[var(--error)]">{error}</p>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Vault Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 12 characters"
            className="w-full px-4 py-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Enter password again"
            className="w-full px-4 py-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
          />
        </div>
        
        <div className="pt-4">
          <button
            onClick={handleCreate}
            disabled={creating || !password || !confirmPassword}
            className="w-full py-3 rounded-xl bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all disabled:opacity-50"
          >
            {creating ? "Creating Vault..." : "Create Vault"}
          </button>
        </div>
        
        <p className="text-xs text-[var(--text-muted)] text-center">
          Your password is never stored. It&apos;s used to derive an encryption key locally.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Vault Unlock
   ═══════════════════════════════════════════════════════════════════════════ */

function VaultUnlock({ 
  onUnlock 
}: { 
  onUnlock: (sessionId: string, encryptionKey: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  async function handleUnlock() {
    setUnlocking(true);
    setError(null);
    
    try {
      const res = await fetch("/api/vault/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to unlock vault");
      }
      
      onUnlock(data.session_id, data.encryption_key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlock vault");
    } finally {
      setUnlocking(false);
    }
  }
  
  return (
    <div className="p-8 max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] flex items-center justify-center">
          <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Unlock Vault
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          Enter your vault password to access your files
        </p>
      </div>
      
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/20">
            <p className="text-sm text-[var(--error)]">{error}</p>
          </div>
        )}
        
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            placeholder="Enter vault password"
            autoFocus
            className="w-full px-4 py-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
          />
        </div>
        
        <button
          onClick={handleUnlock}
          disabled={unlocking || !password}
          className="w-full py-3 rounded-xl bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all disabled:opacity-50"
        >
          {unlocking ? "Unlocking..." : "Unlock"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Vault Dashboard
   ═══════════════════════════════════════════════════════════════════════════ */

function VaultDashboard({
  sessionId,
  onLock,
}: {
  sessionId: string;
  onLock: () => void;
}) {
  const [files, setFiles] = useState<{ id: string; filename: string; size: number; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const loadFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/vault/files", {
        headers: { "x-vault-session": sessionId },
      });
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error("Failed to load files:", err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);
  
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/vault/files", {
        method: "POST",
        headers: { "x-vault-session": sessionId },
        body: formData,
      });
      
      if (res.ok) {
        loadFiles();
      }
    } catch (err) {
      console.error("Failed to upload:", err);
    } finally {
      setUploading(false);
    }
  }
  
  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
  
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Encrypted Vault
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            {files.length} files · End-to-end encrypted
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <label className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all cursor-pointer">
            {uploading ? "Uploading..." : "Upload File"}
            <input
              type="file"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
          <button
            onClick={onLock}
            className="px-4 py-2 rounded-lg bg-[var(--surface-1)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Lock Vault
          </button>
        </div>
      </div>
      
      {/* Files */}
      {loading ? (
        <div className="text-center py-12 text-[var(--text-muted)]">
          Loading files...
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--surface-1)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
            No files yet
          </h3>
          <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
            Upload files to store them securely with end-to-end encryption
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {files.map(file => (
            <div
              key={file.id}
              className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] flex items-center justify-between hover:border-[var(--border)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--electric-lime)]/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[var(--electric-lime)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    {file.filename}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {formatSize(file.size)} · {new Date(file.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
