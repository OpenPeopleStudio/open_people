"use client";

import { useState, useEffect } from "react";
import type { ApiKey, ApiKeyUsage } from "@/types/api-keys";
import { getProviderInfo, ENVIRONMENTS } from "@/lib/api-keys/encryption";

/* ═══════════════════════════════════════════════════════════════════════════
   Key Detail Panel
   ═══════════════════════════════════════════════════════════════════════════ */

interface KeyDetailPanelProps {
  apiKey: ApiKey;
  onUpdate: (key: ApiKey) => void;
  onDelete: (keyId: string) => void;
  onClose: () => void;
}

export function KeyDetailPanel({ apiKey, onUpdate, onDelete, onClose }: KeyDetailPanelProps) {
  const [usage, setUsage] = useState<ApiKeyUsage[]>([]);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const provider = getProviderInfo(apiKey.provider);
  const env = ENVIRONMENTS.find(e => e.id === apiKey.environment);
  
  useEffect(() => {
    loadUsage();
    setRevealedKey(null);
    setTestResult(null);
  }, [apiKey.id]);
  
  async function loadUsage() {
    try {
      const res = await fetch(`/api/keys/${apiKey.id}`);
      if (res.ok) {
        const data = await res.json();
        setUsage(data.usage || []);
      }
    } catch (err) {
      console.error("Failed to load usage:", err);
    }
  }
  
  async function handleReveal() {
    setRevealing(true);
    try {
      const res = await fetch(`/api/keys/${apiKey.id}/reveal`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setRevealedKey(data.key);
      }
    } catch (err) {
      console.error("Failed to reveal key:", err);
    } finally {
      setRevealing(false);
    }
  }
  
  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/keys/${apiKey.id}/test`, { method: "POST" });
      const data = await res.json();
      setTestResult({ valid: data.valid, message: data.message });
    } catch (err) {
      setTestResult({ valid: false, message: "Test failed" });
    } finally {
      setTesting(false);
    }
  }
  
  async function handleToggleActive() {
    try {
      const res = await fetch(`/api/keys/${apiKey.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !apiKey.is_active }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate(data.key);
      }
    } catch (err) {
      console.error("Failed to toggle key:", err);
    }
  }
  
  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/keys/${apiKey.id}`, { method: "DELETE" });
      if (res.ok) {
        onDelete(apiKey.id);
      }
    } catch (err) {
      console.error("Failed to delete key:", err);
    } finally {
      setDeleting(false);
    }
  }
  
  function handleCopy() {
    if (revealedKey) {
      navigator.clipboard.writeText(revealedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${provider.color}15` }}
          >
            {provider.icon}
          </div>
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)]">
              {apiKey.name}
            </h3>
            <p className="text-xs text-[var(--text-muted)]">{provider.name}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-[var(--surface-2)] text-[var(--text-muted)]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Key reveal section */}
        <div className="p-4 rounded-lg bg-[var(--surface-2)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
              API Key
            </span>
            {revealedKey ? (
              <button
                onClick={handleCopy}
                className="text-xs text-[var(--electric-lime)] hover:underline"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            ) : null}
          </div>
          
          {revealedKey ? (
            <code className="block text-sm font-mono text-[var(--text-primary)] break-all">
              {revealedKey}
            </code>
          ) : (
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono text-[var(--text-muted)]">
                {apiKey.key_hint || "••••••••••••••••"}
              </code>
              <button
                onClick={handleReveal}
                disabled={revealing}
                className="px-2 py-1 text-xs rounded bg-[var(--surface-1)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                {revealing ? "..." : "Reveal"}
              </button>
            </div>
          )}
        </div>
        
        {/* Test section */}
        <div>
          <button
            onClick={handleTest}
            disabled={testing}
            className="w-full py-2 rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {testing ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Testing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Test Key
              </>
            )}
          </button>
          
          {testResult && (
            <div className={`mt-2 p-3 rounded-lg ${
              testResult.valid 
                ? "bg-[var(--success)]/10 border border-[var(--success)]/20" 
                : "bg-[var(--error)]/10 border border-[var(--error)]/20"
            }`}>
              <p className={`text-sm ${testResult.valid ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
                {testResult.message}
              </p>
            </div>
          )}
        </div>
        
        {/* Details */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            Details
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-[var(--text-muted)]">Environment</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: env?.color }}
                />
                <span className="text-sm text-[var(--text-primary)]">{env?.name}</span>
              </div>
            </div>
            
            <div>
              <p className="text-xs text-[var(--text-muted)]">Status</p>
              <span className={`text-sm ${apiKey.is_active ? "text-[var(--success)]" : "text-[var(--text-muted)]"}`}>
                {apiKey.is_active ? "Active" : "Disabled"}
              </span>
            </div>
            
            {apiKey.project_name && (
              <div>
                <p className="text-xs text-[var(--text-muted)]">Project</p>
                <span className="text-sm text-[var(--text-primary)]">{apiKey.project_name}</span>
              </div>
            )}
            
            <div>
              <p className="text-xs text-[var(--text-muted)]">Uses</p>
              <span className="text-sm text-[var(--text-primary)]">{apiKey.use_count}</span>
            </div>
            
            {apiKey.last_used_at && (
              <div>
                <p className="text-xs text-[var(--text-muted)]">Last Used</p>
                <span className="text-sm text-[var(--text-primary)]">
                  {new Date(apiKey.last_used_at).toLocaleDateString()}
                </span>
              </div>
            )}
            
            {apiKey.expires_at && (
              <div>
                <p className="text-xs text-[var(--text-muted)]">Expires</p>
                <span className="text-sm text-[var(--text-primary)]">
                  {new Date(apiKey.expires_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
          
          {apiKey.description && (
            <div>
              <p className="text-xs text-[var(--text-muted)]">Description</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{apiKey.description}</p>
            </div>
          )}
        </div>
        
        {/* Recent Activity */}
        {usage.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Recent Activity
            </h4>
            <div className="space-y-2">
              {usage.slice(0, 5).map(u => (
                <div
                  key={u.id}
                  className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${u.success ? "bg-[var(--success)]" : "bg-[var(--error)]"}`} />
                    <span className="text-sm text-[var(--text-primary)]">{u.action}</span>
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">
                    {new Date(u.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div className="p-4 border-t border-[var(--border-subtle)] space-y-2">
        <button
          onClick={handleToggleActive}
          className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
            apiKey.is_active
              ? "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              : "bg-[var(--electric-lime)] text-[var(--void)]"
          }`}
        >
          {apiKey.is_active ? "Disable Key" : "Enable Key"}
        </button>
        
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-2 rounded-lg bg-[var(--error)]/10 text-[var(--error)] text-sm font-medium hover:bg-[var(--error)]/20 transition-colors"
          >
            Delete Key
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 py-2 rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)] text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 py-2 rounded-lg bg-[var(--error)] text-white text-sm font-medium disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Confirm Delete"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
