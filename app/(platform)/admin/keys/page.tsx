"use client";

import { useState, useEffect, useCallback } from "react";
import type { ApiKey, ApiKeyFilters } from "@/types/api-keys";
import { PROVIDERS, ENVIRONMENTS, getProviderInfo } from "@/lib/api-keys/encryption";
import type { ProviderId, EnvironmentId } from "@/lib/api-keys/encryption";

/* ═══════════════════════════════════════════════════════════════════════════
   API Keys Page - Tenant Admin
   ═══════════════════════════════════════════════════════════════════════════ */

export default function TenantKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState<ApiKeyFilters>({});
  
  const loadKeys = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (filters.provider) params.set("provider", filters.provider);
      if (filters.environment) params.set("environment", filters.environment);
      if (filters.search) params.set("search", filters.search);
      
      const res = await fetch(`/api/keys?${params.toString()}`);
      
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch (err) {
      console.error("Failed to load keys:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);
  
  useEffect(() => {
    loadKeys();
  }, [loadKeys]);
  
  function handleKeyCreated(newKey: ApiKey) {
    setKeys(prev => [newKey, ...prev]);
    setShowAddModal(false);
  }
  
  function handleKeyDeleted(keyId: string) {
    setKeys(prev => prev.filter(k => k.id !== keyId));
    if (selectedKey?.id === keyId) {
      setSelectedKey(null);
    }
  }
  
  // Group keys by environment
  const keysByEnv = keys.reduce((acc, key) => {
    const env = key.environment || "development";
    if (!acc[env]) acc[env] = [];
    acc[env].push(key);
    return acc;
  }, {} as Record<string, ApiKey[]>);
  
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                API Keys
              </h1>
              <p className="text-sm text-[var(--text-muted)]">
                Securely store and manage API keys for your projects
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Key
            </button>
          </div>
          
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search keys..."
                value={filters.search || ""}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--electric-lime)]"
              />
            </div>
            
            <select
              value={filters.provider || ""}
              onChange={(e) => {
                const value = e.target.value;
                setFilters((prev) => {
                  if (!value) {
                    const { provider: removedProvider, ...rest } = prev;
                    void removedProvider;
                    return rest;
                  }
                  return { ...prev, provider: value };
                });
              }}
              className="px-3 py-2 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--electric-lime)]"
            >
              <option value="">All Providers</option>
              {PROVIDERS.map(p => (
                <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
              ))}
            </select>
            
            <select
              value={filters.environment || ""}
              onChange={(e) => {
                const value = e.target.value;
                setFilters((prev) => {
                  if (!value) {
                    const { environment: removedEnvironment, ...rest } = prev;
                    void removedEnvironment;
                    return rest;
                  }
                  return { ...prev, environment: value };
                });
              }}
              className="px-3 py-2 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--electric-lime)]"
            >
              <option value="">All Environments</option>
              {ENVIRONMENTS.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Keys List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3 text-[var(--text-muted)]">
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Loading keys...</span>
            </div>
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--surface-1)] flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
              No API keys yet
            </h3>
            <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto mb-6">
              Add your first API key to securely store credentials for OpenAI, Cloudflare, Stripe, and more.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all"
            >
              Add First Key
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {ENVIRONMENTS.map(env => {
              const envKeys = keysByEnv[env.id] || [];
              if (envKeys.length === 0) return null;
              
              return (
                <div key={env.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: env.color }}
                    />
                    <h2 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                      {env.name}
                    </h2>
                    <span className="text-xs text-[var(--text-muted)]">
                      ({envKeys.length})
                    </span>
                  </div>
                  <div className="grid gap-3">
                    {envKeys.map(key => (
                      <KeyCard
                        key={key.id}
                        apiKey={key}
                        selected={selectedKey?.id === key.id}
                        onSelect={() => setSelectedKey(key)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Detail Panel */}
      {selectedKey && (
        <div className="w-96 border-l border-[var(--border-subtle)] bg-[var(--surface-1)] overflow-y-auto">
          <KeyDetailPanel
            apiKey={selectedKey}
            onDelete={handleKeyDeleted}
            onClose={() => setSelectedKey(null)}
          />
        </div>
      )}
      
      {/* Add Modal */}
      {showAddModal && (
        <AddKeyModal
          onClose={() => setShowAddModal(false)}
          onCreated={handleKeyCreated}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Key Card
   ═══════════════════════════════════════════════════════════════════════════ */

function KeyCard({ 
  apiKey, 
  selected, 
  onSelect 
}: { 
  apiKey: ApiKey; 
  selected: boolean; 
  onSelect: () => void;
}) {
  const provider = getProviderInfo(apiKey.provider);
  
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border transition-colors ${
        selected
          ? "border-[var(--electric-lime)] bg-[var(--electric-lime)]/5"
          : "border-[var(--border-subtle)] bg-[var(--surface-1)] hover:border-[var(--border)]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[var(--surface-2)] flex items-center justify-center text-xl">
          {provider?.icon || "🔑"}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[var(--text-primary)] truncate">
            {apiKey.name}
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            {provider?.name || apiKey.provider} · {apiKey.key_hint || "••••"}
          </p>
        </div>
        {apiKey.is_active ? (
          <span className="px-2 py-0.5 text-xs rounded bg-[var(--success)]/10 text-[var(--success)]">
            Active
          </span>
        ) : (
          <span className="px-2 py-0.5 text-xs rounded bg-[var(--text-muted)]/10 text-[var(--text-muted)]">
            Inactive
          </span>
        )}
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Key Detail Panel
   ═══════════════════════════════════════════════════════════════════════════ */

function KeyDetailPanel({
  apiKey,
  onDelete,
  onClose,
}: {
  apiKey: ApiKey;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [revealing, setRevealing] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  const provider = getProviderInfo(apiKey.provider);
  
  async function handleReveal() {
    setRevealing(true);
    try {
      const res = await fetch(`/api/keys/${apiKey.id}/reveal`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setRevealedKey(data.key);
        // Auto-hide after 30 seconds
        setTimeout(() => setRevealedKey(null), 30000);
      }
    } catch (err) {
      console.error("Failed to reveal key:", err);
    } finally {
      setRevealing(false);
    }
  }
  
  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this API key?")) return;
    
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
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Key Details
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-[var(--surface-2)] text-[var(--text-muted)]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="space-y-6">
        {/* Provider */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--surface-2)]">
          <div className="w-12 h-12 rounded-lg bg-[var(--surface-1)] flex items-center justify-center text-2xl">
            {provider?.icon || "🔑"}
          </div>
          <div>
            <h3 className="font-medium text-[var(--text-primary)]">{apiKey.name}</h3>
            <p className="text-sm text-[var(--text-muted)]">{provider?.name || apiKey.provider}</p>
          </div>
        </div>
        
        {/* Key Value */}
        <div>
          <label className="block text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">
            API Key
          </label>
          {revealedKey ? (
            <div className="p-3 rounded-lg bg-[var(--surface-2)] font-mono text-sm break-all">
              {revealedKey}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 rounded-lg bg-[var(--surface-2)] font-mono text-sm">
                {apiKey.key_hint || "••••••••••••"}
              </div>
              <button
                onClick={handleReveal}
                disabled={revealing}
                className="px-3 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] text-sm font-medium hover:brightness-110 disabled:opacity-50"
              >
                {revealing ? "..." : "Reveal"}
              </button>
            </div>
          )}
        </div>
        
        {/* Meta */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-muted)]">Environment</span>
            <span className="text-[var(--text-primary)] capitalize">{apiKey.environment}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-muted)]">Status</span>
            <span className={apiKey.is_active ? "text-[var(--success)]" : "text-[var(--text-muted)]"}>
              {apiKey.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-muted)]">Created</span>
            <span className="text-[var(--text-primary)]">
              {new Date(apiKey.created_at).toLocaleDateString()}
            </span>
          </div>
          {apiKey.last_used_at && (
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Last Used</span>
              <span className="text-[var(--text-primary)]">
                {new Date(apiKey.last_used_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
        
        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="w-full py-2.5 rounded-lg border border-[var(--error)]/20 text-[var(--error)] text-sm hover:bg-[var(--error)]/10 transition-colors disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete Key"}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Add Key Modal
   ═══════════════════════════════════════════════════════════════════════════ */

function AddKeyModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (key: ApiKey) => void;
}) {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState<ProviderId>(PROVIDERS[0].id);
  const [environment, setEnvironment] = useState<EnvironmentId>("development");
  const [key, setKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !key.trim()) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          provider,
          environment,
          key_value: key.trim(),
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to create key");
      }
      
      onCreated(data.key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create key");
    } finally {
      setSaving(false);
    }
  }
  
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
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Production OpenAI"
              className="w-full px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Provider
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as ProviderId)}
                className="w-full px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
              >
                {PROVIDERS.map(p => (
                  <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Environment
              </label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as EnvironmentId)}
                className="w-full px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
              >
                {ENVIRONMENTS.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              API Key
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--electric-lime)]"
              required
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !key.trim() || saving}
              className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add Key"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
