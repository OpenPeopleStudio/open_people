"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PasswordChangeSection } from "./components/PasswordChangeSection";
import { RecoveryCodesSection } from "./components/RecoveryCodesSection";
import { SessionsSection } from "./components/SessionsSection";
import { DangerZoneSection } from "./components/DangerZoneSection";
import type { VaultSpace, VaultSession } from "@/types/vault";

/* ═══════════════════════════════════════════════════════════════════════════
   Vault Settings Page
   Security settings, password management, and recovery options
   ═══════════════════════════════════════════════════════════════════════════ */

export default function VaultSettingsPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [vault, setVault] = useState<VaultSpace | null>(null);
  const [sessions, setSessions] = useState<VaultSession[]>([]);
  const [recoveryCodesCount, setRecoveryCodesCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const sid = sessionStorage.getItem("vault_session_id");
    if (!sid) {
      router.push("/super-admin/vault");
      return;
    }
    setSessionId(sid);
    loadData(sid);
  }, [router]);
  
  async function loadData(sid: string) {
    try {
      setLoading(true);
      
      // Fetch vault info
      const vaultRes = await fetch("/api/vault/status");
      if (vaultRes.ok) {
        const data = await vaultRes.json();
        setVault(data.vault);
      }
      
      // Fetch sessions
      const sessionsRes = await fetch("/api/vault/sessions", {
        headers: { "x-vault-session": sid },
      });
      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setSessions(data.sessions || []);
      }
      
      // Fetch recovery codes count
      const codesRes = await fetch("/api/vault/recovery-codes", {
        headers: { "x-vault-session": sid },
      });
      if (codesRes.ok) {
        const data = await codesRes.json();
        setRecoveryCodesCount(data.remaining_codes || 0);
      }
      
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  }
  
  function handlePasswordChanged() {
    // Reload sessions since they were invalidated
    if (sessionId) {
      loadData(sessionId);
    }
  }
  
  function handleRecoveryCodesRegenerated(count: number) {
    setRecoveryCodesCount(count);
  }
  
  function handleSessionRevoked(sessionIdToRevoke: string) {
    setSessions(prev => prev.filter(s => s.id !== sessionIdToRevoke));
  }
  
  if (loading || !sessionId) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-[var(--text-muted)]">
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => router.push("/super-admin/vault")}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-1)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Vault Settings
          </h1>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Manage your vault security, password, and recovery options.
        </p>
      </div>
      
      {/* Security Overview */}
      <div className="mb-8 p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--success)]/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">
              Encryption Status
            </h3>
            <p className="text-sm text-[var(--text-muted)]">
              Your vault is protected with AES-256-GCM encryption
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-[var(--text-muted)]">Active Sessions:</span>
              <span className="ml-2 text-[var(--text-primary)] font-medium">
                {sessions.filter(s => s.is_active).length}
              </span>
            </div>
            <div>
              <span className="text-[var(--text-muted)]">Recovery Codes:</span>
              <span className={`ml-2 font-medium ${recoveryCodesCount < 3 ? "text-[var(--warning)]" : "text-[var(--text-primary)]"}`}>
                {recoveryCodesCount} remaining
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Settings Sections */}
      <div className="space-y-6">
        <PasswordChangeSection
          sessionId={sessionId}
          onPasswordChanged={handlePasswordChanged}
        />
        
        <RecoveryCodesSection
          sessionId={sessionId}
          remainingCodes={recoveryCodesCount}
          onRegenerated={handleRecoveryCodesRegenerated}
        />
        
        <SessionsSection
          sessionId={sessionId}
          currentSessionId={sessionId}
          sessions={sessions}
          onSessionRevoked={handleSessionRevoked}
        />
        
        <DangerZoneSection
          sessionId={sessionId}
          vaultId={vault?.id || ""}
        />
      </div>
    </div>
  );
}
