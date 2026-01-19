"use client";

import { useState } from "react";
import type { VaultSpace } from "@/types/vault";

/* ═══════════════════════════════════════════════════════════════════════════
   Vault Unlock Modal
   Password entry and QR code unlock options
   ═══════════════════════════════════════════════════════════════════════════ */

interface VaultUnlockModalProps {
  vault: VaultSpace;
  onUnlock: (sessionId: string, encryptionKey: string, vault: VaultSpace) => void;
}

export function VaultUnlockModal({ vault, onUnlock }: VaultUnlockModalProps) {
  const [mode, setMode] = useState<"password" | "qr" | "recovery">("password");
  const [password, setPassword] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // QR code state
  const [qrSession, setQrSession] = useState<{
    sessionId: string;
    qrData: string;
    expiresAt: Date;
  } | null>(null);
  const [qrPolling, setQrPolling] = useState(false);
  
  async function handlePasswordUnlock() {
    if (!password) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/vault/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          device_name: getDeviceName(),
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to unlock vault");
      }
      
      onUnlock(data.session_id, data.encryption_key, vault);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlock vault");
    } finally {
      setLoading(false);
    }
  }
  
  async function initiateQRUnlock() {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/vault/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_name: getDeviceName(),
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to create QR request");
      }
      
      setQrSession({
        sessionId: data.session_id,
        qrData: data.qr_data,
        expiresAt: new Date(data.expires_at),
      });
      
      // Start polling for approval
      setQrPolling(true);
      pollQRStatus(data.session_id);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate QR unlock");
    } finally {
      setLoading(false);
    }
  }
  
  async function pollQRStatus(sessionId: string) {
    try {
      const response = await fetch(`/api/vault/qr?session_id=${sessionId}`);
      const data = await response.json();
      
      if (data.status === "approved") {
        // QR approved, now unlock
        setQrPolling(false);
        // In a real implementation, the approval would include the encryption key
        // For now, we'd need to handle this differently
        setError("QR approved! Please enter your password to complete unlock.");
        setMode("password");
        return;
      }
      
      if (data.status === "expired") {
        setQrPolling(false);
        setQrSession(null);
        setError("QR code expired. Please try again.");
        return;
      }
      
      // Still pending, continue polling
      if (qrPolling) {
        setTimeout(() => pollQRStatus(sessionId), 2000);
      }
      
    } catch (err) {
      console.error("QR polling error:", err);
      setQrPolling(false);
    }
  }
  
  async function handleRecoveryUnlock() {
    if (!recoveryCode) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/vault/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: recoveryCode,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Invalid recovery code");
      }
      
      // Recovery successful - user needs to set new password
      setError("Recovery successful! Please set a new master password.");
      // In a real implementation, redirect to password reset flow
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to use recovery code");
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="max-w-md mx-auto">
      <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[var(--electric-lime)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Unlock {vault.name}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Enter your master password to access your vault
          </p>
        </div>
        
        {/* Mode tabs */}
        <div className="flex gap-1 p-1 bg-[var(--surface-2)] rounded-lg mb-6">
          {[
            { id: "password", label: "Password", icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" },
            { id: "qr", label: "QR Code", icon: "M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" },
            { id: "recovery", label: "Recovery", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id as typeof mode)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                mode === tab.id
                  ? "bg-[var(--surface-1)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
              </svg>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
        
        {error && (
          <div className="p-3 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/20 mb-4">
            <p className="text-sm text-[var(--error)]">{error}</p>
          </div>
        )}
        
        {/* Password mode */}
        {mode === "password" && (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Master Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePasswordUnlock()}
                placeholder="Enter your master password"
                autoFocus
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
              />
            </div>
            
            <button
              onClick={handlePasswordUnlock}
              disabled={!password || loading}
              className="w-full py-3 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Unlocking...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  Unlock Vault
                </>
              )}
            </button>
          </div>
        )}
        
        {/* QR mode */}
        {mode === "qr" && (
          <div>
            {!qrSession ? (
              <div className="text-center">
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  Scan a QR code from a device where your vault is already unlocked to grant access to this device.
                </p>
                <button
                  onClick={initiateQRUnlock}
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {loading ? "Generating..." : "Generate QR Code"}
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg inline-block mb-4">
                  {/* QR Code placeholder - would use a QR library in production */}
                  <div className="w-48 h-48 bg-[var(--surface-2)] rounded flex items-center justify-center">
                    <span className="text-xs text-[var(--text-muted)] text-center px-4">
                      QR Code<br />
                      (Use qrcode library to render)
                    </span>
                  </div>
                </div>
                <p className="text-sm text-[var(--text-muted)] mb-2">
                  Scan this code with your authenticated device
                </p>
                {qrPolling && (
                  <p className="text-xs text-[var(--electric-lime)] flex items-center justify-center gap-2">
                    <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Waiting for approval...
                  </p>
                )}
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  Expires: {qrSession.expiresAt.toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Recovery mode */}
        {mode === "recovery" && (
          <div>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Enter one of your recovery codes to regain access to your vault. Each code can only be used once.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Recovery Code
              </label>
              <input
                type="text"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XXXX"
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)] font-mono"
              />
            </div>
            
            <button
              onClick={handleRecoveryUnlock}
              disabled={!recoveryCode || loading}
              className="w-full py-3 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Use Recovery Code"}
            </button>
            
            <p className="text-xs text-[var(--text-muted)] mt-4 text-center">
              Using a recovery code will invalidate it. You will be prompted to set a new master password.
            </p>
          </div>
        )}
        
        {/* Stats */}
        <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
          <div className="flex justify-between text-xs text-[var(--text-muted)]">
            <span>{vault.total_files} files</span>
            <span>{formatBytes(vault.total_size_bytes)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════════ */

function getDeviceName(): string {
  const ua = navigator.userAgent;
  
  if (ua.includes("Mac")) return "Mac";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("iPhone")) return "iPhone";
  if (ua.includes("iPad")) return "iPad";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("Linux")) return "Linux";
  
  return "Unknown Device";
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
