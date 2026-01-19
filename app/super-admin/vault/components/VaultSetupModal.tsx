"use client";

import { useState } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   Vault Setup Modal
   First-time setup flow for creating an encrypted vault
   ═══════════════════════════════════════════════════════════════════════════ */

interface VaultSetupModalProps {
  onComplete: (vaultId: string, recoveryCodes: string[]) => void;
}

export function VaultSetupModal({ onComplete }: VaultSetupModalProps) {
  const [step, setStep] = useState<"intro" | "password" | "confirm" | "creating">("intro");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [vaultName, setVaultName] = useState("My Vault");
  const [error, setError] = useState<string | null>(null);
  
  const passwordStrength = getPasswordStrength(password);
  
  async function handleCreate() {
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 12) {
      setError("Password must be at least 12 characters");
      return;
    }
    
    setStep("creating");
    setError(null);
    
    try {
      const response = await fetch("/api/vault/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          vault_name: vaultName,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create vault");
      }
      
      const data = await response.json();
      onComplete(data.vault_id, data.recovery_codes);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create vault");
      setStep("confirm");
    }
  }
  
  // Intro step
  if (step === "intro") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--electric-lime)] to-[var(--electric-cyan)] flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[var(--void)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Create Your Encrypted Vault
            </h1>
            <p className="text-[var(--text-muted)] mt-2">
              Securely store and organize your important documents with end-to-end encryption.
            </p>
          </div>
          
          {/* Features */}
          <div className="grid gap-4 mb-8">
            {[
              {
                icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
                title: "End-to-End Encryption",
                description: "Files are encrypted before leaving your device. Only you can decrypt them.",
              },
              {
                icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
                title: "AI-Powered Organization",
                description: "Automatic categorization and data extraction from invoices, receipts, and more.",
              },
              {
                icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
                title: "Email Automation",
                description: "Automatically capture attachments from specific senders like invoices or bills.",
              },
              {
                icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z",
                title: "Cross-Device Access",
                description: "Securely unlock from any device using QR code or recovery codes.",
              },
            ].map((feature) => (
              <div key={feature.title} className="flex gap-4 p-4 rounded-lg bg-[var(--surface-2)]">
                <div className="w-10 h-10 rounded-lg bg-[var(--electric-lime)]/10 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-[var(--electric-lime)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={feature.icon} />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-primary)]">{feature.title}</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Warning */}
          <div className="p-4 rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/20 mb-6">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-[var(--warning)] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-[var(--warning)]">Important Security Notice</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Your vault password cannot be recovered. If you forget it, you will need to use a recovery code. Store your recovery codes safely offline.
                </p>
              </div>
            </div>
          </div>
          
          {/* CTA */}
          <button
            onClick={() => setStep("password")}
            className="w-full py-3 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all"
          >
            Get Started
          </button>
        </div>
      </div>
    );
  }
  
  // Password step
  if (step === "password") {
    return (
      <div className="max-w-md mx-auto">
        <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-8">
          <button
            onClick={() => setStep("intro")}
            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back
          </button>
          
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            Create Your Master Password
          </h2>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            This password will encrypt your entire vault. Choose something strong and memorable.
          </p>
          
          <div className="space-y-4">
            {/* Vault Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Vault Name
              </label>
              <input
                type="text"
                value={vaultName}
                onChange={(e) => setVaultName(e.target.value)}
                placeholder="My Vault"
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
              />
            </div>
            
            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Master Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 12 characters"
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
              />
              
              {/* Strength indicator */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full ${
                          level <= passwordStrength.level
                            ? passwordStrength.color
                            : "bg-[var(--surface-3)]"
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${passwordStrength.textColor}`}>
                    {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={() => setStep("confirm")}
            disabled={password.length < 12}
            className="w-full py-3 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }
  
  // Confirm step
  if (step === "confirm") {
    return (
      <div className="max-w-md mx-auto">
        <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-8">
          <button
            onClick={() => setStep("password")}
            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back
          </button>
          
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            Confirm Your Password
          </h2>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            Enter your master password again to confirm.
          </p>
          
          {error && (
            <div className="p-3 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/20 mb-4">
              <p className="text-sm text-[var(--error)]">{error}</p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
            />
          </div>
          
          <button
            onClick={handleCreate}
            disabled={!confirmPassword}
            className="w-full py-3 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Vault
          </button>
        </div>
      </div>
    );
  }
  
  // Creating step
  return (
    <div className="max-w-md mx-auto">
      <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[var(--electric-lime)] animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            Creating Your Vault
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Generating encryption keys and setting up your secure storage...
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Password Strength Calculator
   ═══════════════════════════════════════════════════════════════════════════ */

function getPasswordStrength(password: string): {
  level: number;
  label: string;
  color: string;
  textColor: string;
} {
  let score = 0;
  
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  if (score <= 1) {
    return { level: 1, label: "Weak", color: "bg-[var(--error)]", textColor: "text-[var(--error)]" };
  }
  if (score <= 2) {
    return { level: 2, label: "Fair", color: "bg-[var(--warning)]", textColor: "text-[var(--warning)]" };
  }
  if (score <= 3) {
    return { level: 3, label: "Good", color: "bg-[var(--electric-cyan)]", textColor: "text-[var(--electric-cyan)]" };
  }
  return { level: 4, label: "Strong", color: "bg-[var(--success)]", textColor: "text-[var(--success)]" };
}
