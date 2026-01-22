"use client";

import { useState } from "react";
import type { ApiKey, CreateApiKeyRequest } from "@/types/api-keys";
import { PROVIDERS, ENVIRONMENTS } from "@/lib/api-keys/encryption";

/* ═══════════════════════════════════════════════════════════════════════════
   Add Key Modal
   ═══════════════════════════════════════════════════════════════════════════ */

interface AddKeyModalProps {
  onClose: () => void;
  onCreated: (key: ApiKey) => void;
}

export function AddKeyModal({ onClose, onCreated }: AddKeyModalProps) {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("openai");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [environment, setEnvironment] = useState<"development" | "staging" | "production">("development");
  const [projectName, setProjectName] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<{ key: ApiKey; plainKey: string } | null>(null);
  const [copied, setCopied] = useState(false);
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!name.trim() || !key.trim()) {
      setError("Name and key are required");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const body: CreateApiKeyRequest = {
        name: name.trim(),
        provider,
        key: key.trim(),
        environment,
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(projectName.trim() ? { project_name: projectName.trim() } : {}),
      };
      
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to create key");
      }
      
      setCreatedKey({ key: data.key, plainKey: data.plain_key });
      onCreated(data.key);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create key");
    } finally {
      setLoading(false);
    }
  }
  
  function handleCopy() {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey.plainKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }
  
  // Success view
  if (createdKey) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-md mx-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-xl">
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Key Created Successfully
            </h2>
            
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Make sure to copy your key now. You won&apos;t be able to see it again.
            </p>
            
            <div className="p-4 rounded-lg bg-[var(--surface-2)] mb-4">
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono text-[var(--text-primary)] break-all text-left">
                  {showKey ? createdKey.plainKey : "•".repeat(Math.min(40, createdKey.plainKey.length))}
                </code>
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 rounded hover:bg-[var(--surface-1)] text-[var(--text-muted)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    {showKey ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                className="flex-1 py-2.5 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Key
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Form view
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md mx-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-xl">
        <div className="p-6 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Add API Key
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/20">
              <p className="text-sm text-[var(--error)]">{error}</p>
            </div>
          )}
          
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Production OpenAI Key"
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
            />
          </div>
          
          {/* Provider */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Provider
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PROVIDERS.slice(0, 8).map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProvider(p.id)}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    provider === p.id
                      ? "border-[var(--electric-lime)] bg-[var(--electric-lime)]/5"
                      : "border-[var(--border-subtle)] hover:border-[var(--border)]"
                  }`}
                >
                  <span className="text-lg">{p.icon}</span>
                  <p className="text-xs text-[var(--text-muted)] mt-1 truncate">{p.name}</p>
                </button>
              ))}
            </div>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full mt-2 px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--electric-lime)]"
            >
              {PROVIDERS.map(p => (
                <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
              ))}
            </select>
          </div>
          
          {/* Key */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-4 py-2.5 pr-10 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono text-sm focus:outline-none focus:border-[var(--electric-lime)]"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  {showKey ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  )}
                </svg>
              </button>
            </div>
          </div>
          
          {/* Environment */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Environment
            </label>
            <div className="flex gap-2">
              {ENVIRONMENTS.map(env => (
                <button
                  key={env.id}
                  type="button"
                  onClick={() => setEnvironment(env.id as typeof environment)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                    environment === env.id
                      ? "border-[var(--electric-lime)] bg-[var(--electric-lime)]/5 text-[var(--text-primary)]"
                      : "border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border)]"
                  }`}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: env.color }}
                  />
                  {env.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Optional fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Project (optional)
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., open_people"
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--electric-lime)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Description (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notes..."
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--electric-lime)]"
              />
            </div>
          </div>
        </form>
        
        <div className="p-6 border-t border-[var(--border-subtle)] flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !name.trim() || !key.trim()}
            className="flex-1 py-2.5 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Key"}
          </button>
        </div>
      </div>
    </div>
  );
}
