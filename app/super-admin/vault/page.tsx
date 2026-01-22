"use client";

import { useState, useEffect } from "react";
import { VaultSetupModal } from "./components/VaultSetupModal";
import { VaultUnlockModal } from "./components/VaultUnlockModal";
import { VaultDashboard } from "./components/VaultDashboard";
import type { VaultSpace } from "@/types/vault";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin Vault Page
   Main entry point for the encrypted vault feature
   ═══════════════════════════════════════════════════════════════════════════ */

type VaultState = 
  | { status: "loading" }
  | { status: "no_vault" }
  | { status: "locked"; vault: VaultSpace }
  | { status: "unlocked"; vault: VaultSpace; sessionId: string; encryptionKey: string };

export default function VaultPage() {
  const [state, setState] = useState<VaultState>({ status: "loading" });
  const [error, setError] = useState<string | null>(null);
  
  // Check vault status on mount
  useEffect(() => {
    checkVaultStatus();
  }, []);
  
  async function checkVaultStatus() {
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
  }
  
  async function handleSetupComplete(_vaultId: string, recoveryCodes: string[]) {
    // Show recovery codes modal/download
    alert(`Vault created! Save these recovery codes securely:\n\n${recoveryCodes.join("\n")}\n\nYou will not see these again.`);
    
    // Reload to get vault status
    await checkVaultStatus();
  }
  
  async function handleUnlock(sessionId: string, encryptionKey: string, vault: VaultSpace) {
    // Store in session storage (cleared on tab close)
    sessionStorage.setItem("vault_session_id", sessionId);
    sessionStorage.setItem("vault_encryption_key", encryptionKey);
    
    setState({
      status: "unlocked",
      vault,
      sessionId,
      encryptionKey,
    });
  }
  
  async function handleLock() {
    if (state.status !== "unlocked") return;
    
    try {
      await fetch("/api/vault/unlock", {
        method: "DELETE",
        headers: { "x-vault-session": state.sessionId },
      });
    } catch (err) {
      console.error("Lock error:", err);
    }
    
    // Clear session storage
    sessionStorage.removeItem("vault_session_id");
    sessionStorage.removeItem("vault_encryption_key");
    
    setState({ status: "locked", vault: state.vault });
  }
  
  // Render based on state
  if (state.status === "loading") {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-[var(--text-muted)]">
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
    return (
      <div className="p-8">
        <VaultSetupModal onComplete={handleSetupComplete} />
      </div>
    );
  }
  
  if (state.status === "locked") {
    return (
      <div className="p-8">
        <VaultUnlockModal 
          vault={state.vault} 
          onUnlock={handleUnlock}
        />
      </div>
    );
  }
  
  // Unlocked state
  return (
    <VaultDashboard
      vault={state.vault}
      sessionId={state.sessionId}
      encryptionKey={state.encryptionKey}
      onLock={handleLock}
    />
  );
}
