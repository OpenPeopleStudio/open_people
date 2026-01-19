"use client";

import { useState, useEffect } from "react";
import type { ApiKey, ApiKeyFilters } from "@/types/api-keys";
import { PROVIDERS, ENVIRONMENTS, getProviderInfo } from "@/lib/api-keys/encryption";
import { AddKeyModal } from "./components/AddKeyModal";
import { KeyCard } from "./components/KeyCard";
import { KeyDetailPanel } from "./components/KeyDetailPanel";

/* ═══════════════════════════════════════════════════════════════════════════
   API Key Management Page
   ═══════════════════════════════════════════════════════════════════════════ */

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState<ApiKeyFilters>({});
  
  useEffect(() => {
    loadKeys();
  }, [filters]);
  
  async function loadKeys() {
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
  }
  
  function handleKeyCreated(newKey: ApiKey) {
    setKeys(prev => [newKey, ...prev]);
    setShowAddModal(false);
  }
  
  function handleKeyUpdated(updatedKey: ApiKey) {
    setKeys(prev => prev.map(k => k.id === updatedKey.id ? updatedKey : k));
    setSelectedKey(updatedKey);
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
              onChange={(e) => setFilters(prev => ({ ...prev, provider: e.target.value || undefined }))}
              className="px-3 py-2 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--electric-lime)]"
            >
              <option value="">All Providers</option>
              {PROVIDERS.map(p => (
                <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
              ))}
            </select>
            
            <select
              value={filters.environment || ""}
              onChange={(e) => setFilters(prev => ({ ...prev, environment: e.target.value || undefined }))}
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
              if (envKeys.length === 0 && filters.environment && filters.environment !== env.id) return null;
              if (envKeys.length === 0 && !filters.environment) return null;
              
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
            onUpdate={handleKeyUpdated}
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
