"use client";

import { useState } from "react";
import { validatePasswordStrength, generateStrongPassword } from "@/lib/vault/client-crypto";

/* ═══════════════════════════════════════════════════════════════════════════
   Password Change Section
   ═══════════════════════════════════════════════════════════════════════════ */

interface PasswordChangeSectionProps {
  sessionId: string;
  onPasswordChanged: () => void;
}

export function PasswordChangeSection({ sessionId, onPasswordChanged }: PasswordChangeSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [regenerateRecoveryCodes, setRegenerateRecoveryCodes] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newRecoveryCodes, setNewRecoveryCodes] = useState<string[] | null>(null);
  
  const passwordStrength = validatePasswordStrength(newPassword);
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    
    if (!passwordStrength.valid) {
      setError("Please choose a stronger password");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/vault/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vault-session": sessionId,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          regenerate_recovery_codes: regenerateRecoveryCodes,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to change password");
      }
      
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      if (data.recovery_codes) {
        setNewRecoveryCodes(data.recovery_codes);
      }
      
      onPasswordChanged();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setLoading(false);
    }
  }
  
  function handleGeneratePassword() {
    const generated = generateStrongPassword(20);
    setNewPassword(generated);
    setConfirmPassword(generated);
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">
              Change Master Password
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Update your vault encryption password
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
        <div className="px-4 pb-4 border-t border-[var(--border-subtle)]">
          {/* New recovery codes display */}
          {newRecoveryCodes && (
            <div className="mt-4 p-4 rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/20">
              <h4 className="text-sm font-medium text-[var(--success)] mb-2">
                New Recovery Codes Generated
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mb-3">
                Save these codes in a secure location. You won&apos;t see them again.
              </p>
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {newRecoveryCodes.map((code, i) => (
                  <div key={i} className="p-2 bg-[var(--surface-1)] rounded text-[var(--text-primary)]">
                    {code}
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(newRecoveryCodes.join("\n"));
                }}
                className="mt-3 px-3 py-1.5 text-xs rounded bg-[var(--surface-1)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Copy All
              </button>
            </div>
          )}
          
          {success && !newRecoveryCodes && (
            <div className="mt-4 p-3 rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/20">
              <p className="text-sm text-[var(--success)]">
                Password changed successfully. All other sessions have been logged out.
              </p>
            </div>
          )}
          
          {!success && (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/20">
                  <p className="text-sm text-[var(--error)]">{error}</p>
                </div>
              )}
              
              {/* Current password */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      {showCurrentPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      )}
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* New password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">
                    New Password
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-xs text-[var(--electric-lime)] hover:underline"
                  >
                    Generate strong password
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      {showNewPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      )}
                    </svg>
                  </button>
                </div>
                
                {/* Password strength */}
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full ${
                            level <= passwordStrength.score
                              ? passwordStrength.score <= 2
                                ? "bg-[var(--error)]"
                                : passwordStrength.score <= 3
                                ? "bg-[var(--warning)]"
                                : "bg-[var(--success)]"
                              : "bg-[var(--surface-3)]"
                          }`}
                        />
                      ))}
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <ul className="text-xs text-[var(--text-muted)] space-y-0.5">
                        {passwordStrength.feedback.map((fb, i) => (
                          <li key={i}>• {fb}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              
              {/* Confirm password */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-xs text-[var(--error)] mt-1">Passwords do not match</p>
                )}
              </div>
              
              {/* Regenerate recovery codes option */}
              <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-2)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={regenerateRecoveryCodes}
                  onChange={(e) => setRegenerateRecoveryCodes(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--electric-lime)] focus:ring-[var(--electric-lime)]"
                />
                <div>
                  <span className="text-sm text-[var(--text-primary)]">
                    Regenerate recovery codes
                  </span>
                  <p className="text-xs text-[var(--text-muted)]">
                    Invalidate existing codes and generate new ones
                  </p>
                </div>
              </label>
              
              {/* Warning */}
              <div className="p-3 rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/20">
                <p className="text-xs text-[var(--warning)]">
                  Changing your password will log you out of all other devices.
                </p>
              </div>
              
              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                className="w-full py-2.5 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Changing Password..." : "Change Password"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
