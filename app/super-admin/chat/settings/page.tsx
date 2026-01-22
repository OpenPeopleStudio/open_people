"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { AIProviderConfig, UserAISettings, AIProviderType, ProviderStatus } from "@/types/ai-providers";
import { PROVIDER_TEMPLATES } from "@/types/ai-providers";

/* ═══════════════════════════════════════════════════════════════════════════
   AI Settings Page
   Configure AI providers (OpenAI, LLM Studio, Ollama, etc.)
   ═══════════════════════════════════════════════════════════════════════════ */

export default function AISettingsPage() {
  const [settings, setSettings] = useState<UserAISettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [providerStatus, setProviderStatus] = useState<Record<string, ProviderStatus>>({});
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const res = await fetch("/api/ai/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    if (!settings) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/ai/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Settings saved successfully" });
      } else {
        setMessage({ type: "error", text: "Failed to save settings" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  }

  async function testProvider(provider: AIProviderConfig) {
    setTestingProvider(provider.id);

    try {
      const res = await fetch("/api/ai/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });

      if (res.ok) {
        const data = await res.json();
        setProviderStatus((prev) => ({
          ...prev,
          [provider.id]: data.status,
        }));

        // Update available models if found
        if (data.models && data.models.length > 0 && settings) {
          setSettings({
            ...settings,
            providers: settings.providers.map((p) =>
              p.id === provider.id ? { ...p, availableModels: data.models } : p
            ),
          });
        }
      }
    } catch (err) {
      setProviderStatus((prev) => ({
        ...prev,
        [provider.id]: { available: false, error: "Connection failed" },
      }));
    } finally {
      setTestingProvider(null);
    }
  }

  function addProvider(type: AIProviderType) {
    if (!settings) return;

    const template = PROVIDER_TEMPLATES[type];
    const newProvider: AIProviderConfig = {
      id: `${type}-${Date.now()}`,
      ...template,
      isEnabled: true,
      isDefault: settings.providers.length === 0,
    } as AIProviderConfig;

    setSettings({
      ...settings,
      providers: [...settings.providers, newProvider],
    });
    setShowAddProvider(false);
  }

  function updateProvider(id: string, updates: Partial<AIProviderConfig>) {
    if (!settings) return;

    setSettings({
      ...settings,
      providers: settings.providers.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    });
  }

  function removeProvider(id: string) {
    if (!settings) return;

    setSettings({
      ...settings,
      providers: settings.providers.filter((p) => p.id !== id),
    });
  }

  function setDefaultProvider(id: string) {
    if (!settings) return;

    setSettings({
      ...settings,
      defaultProvider: id,
      providers: settings.providers.map((p) => ({
        ...p,
        isDefault: p.id === id,
      })),
    });
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-[var(--text-muted)]">Loading settings...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-[var(--error)]">Failed to load settings</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/super-admin/chat"
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              AI Provider Settings
            </h1>
          </div>
          <p className="text-[var(--text-muted)]">
            Configure AI providers to reduce costs by using local models
          </p>
        </div>

        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-500/10 text-green-400 border border-green-500/30"
              : "bg-red-500/10 text-red-400 border border-red-500/30"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Providers List */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-[var(--text-primary)]">
            Configured Providers
          </h2>
          <button
            onClick={() => setShowAddProvider(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-1)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Provider
          </button>
        </div>

        {settings.providers.length === 0 ? (
          <div className="p-8 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] text-center">
            <p className="text-[var(--text-muted)] mb-4">
              No providers configured. Add one to get started.
            </p>
            <button
              onClick={() => setShowAddProvider(true)}
              className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium"
            >
              Add Provider
            </button>
          </div>
        ) : (
          settings.providers.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              status={providerStatus[provider.id]}
              isTesting={testingProvider === provider.id}
              onUpdate={(updates) => updateProvider(provider.id, updates)}
              onRemove={() => removeProvider(provider.id)}
              onTest={() => testProvider(provider)}
              onSetDefault={() => setDefaultProvider(provider.id)}
            />
          ))
        )}
      </div>

      {/* Global Settings */}
      <div className="p-6 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
        <h2 className="text-lg font-medium text-[var(--text-primary)] mb-4">
          Behavior Settings
        </h2>

        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-primary)]">Fallback to OpenAI</p>
              <p className="text-xs text-[var(--text-muted)]">
                If local provider fails, automatically use OpenAI
              </p>
            </div>
            <button
              onClick={() =>
                setSettings({ ...settings, fallbackToOpenAI: !settings.fallbackToOpenAI })
              }
              className={`w-10 h-6 rounded-full transition-colors ${
                settings.fallbackToOpenAI ? "bg-[var(--electric-lime)]" : "bg-[var(--border)]"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.fallbackToOpenAI ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </label>

          <label className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-primary)]">Always use OpenAI for embeddings</p>
              <p className="text-xs text-[var(--text-muted)]">
                Most local models don&apos;t support embeddings
              </p>
            </div>
            <button
              onClick={() =>
                setSettings({
                  ...settings,
                  useOpenAIForEmbeddings: !settings.useOpenAIForEmbeddings,
                })
              }
              className={`w-10 h-6 rounded-full transition-colors ${
                settings.useOpenAIForEmbeddings ? "bg-[var(--electric-lime)]" : "bg-[var(--border)]"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.useOpenAIForEmbeddings ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </label>
        </div>
      </div>

      {/* Add Provider Modal */}
      {showAddProvider && (
        <AddProviderModal
          onAdd={addProvider}
          onClose={() => setShowAddProvider(false)}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Provider Card Component
   ═══════════════════════════════════════════════════════════════════════════ */

function ProviderCard({
  provider,
  status,
  isTesting,
  onUpdate,
  onRemove,
  onTest,
  onSetDefault,
}: {
  provider: AIProviderConfig;
  status?: ProviderStatus;
  isTesting: boolean;
  onUpdate: (updates: Partial<AIProviderConfig>) => void;
  onRemove: () => void;
  onTest: () => void;
  onSetDefault: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const providerIcons: Record<AIProviderType, string> = {
    openai: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z",
    llmstudio: "M9 3v2H5v4H3V5a2 2 0 012-2h4zm6 0h4a2 2 0 012 2v4h-2V5h-4V3zm-6 18H5a2 2 0 01-2-2v-4h2v4h4v2zm6 0v-2h4v-4h2v4a2 2 0 01-2 2h-4z",
    ollama: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3a7 7 0 110 14 7 7 0 010-14z",
    custom: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4",
  };

  return (
    <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            provider.type === "openai"
              ? "bg-green-500/10"
              : provider.type === "llmstudio"
              ? "bg-blue-500/10"
              : provider.type === "ollama"
              ? "bg-purple-500/10"
              : "bg-gray-500/10"
          }`}
        >
          <svg
            className={`w-5 h-5 ${
              provider.type === "openai"
                ? "text-green-400"
                : provider.type === "llmstudio"
                ? "text-blue-400"
                : provider.type === "ollama"
                ? "text-purple-400"
                : "text-gray-400"
            }`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d={providerIcons[provider.type]} />
          </svg>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-[var(--text-primary)]">{provider.name}</h3>
            {provider.isDefault && (
              <span className="px-2 py-0.5 text-xs rounded bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]">
                Default
              </span>
            )}
            {status && (
              <span
                className={`px-2 py-0.5 text-xs rounded ${
                  status.available
                    ? "bg-green-500/10 text-green-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {status.available ? `Online (${status.latency_ms}ms)` : "Offline"}
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            {provider.baseUrl} • {provider.defaultModel}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onTest}
            disabled={isTesting}
            className="px-3 py-1.5 rounded-lg text-sm bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            {isTesting ? "Testing..." : "Test"}
          </button>

          <button
            onClick={() => onUpdate({ isEnabled: !provider.isEnabled })}
            className={`w-10 h-6 rounded-full transition-colors ${
              provider.isEnabled ? "bg-[var(--electric-lime)]" : "bg-[var(--border)]"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                provider.isEnabled ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)]"
          >
            <svg
              className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Settings */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[var(--border-subtle)] pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Name</label>
              <input
                type="text"
                value={provider.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Base URL</label>
              <input
                type="text"
                value={provider.baseUrl}
                onChange={(e) => onUpdate({ baseUrl: e.target.value })}
                placeholder="http://localhost:1234/v1"
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Default Model</label>
              <input
                type="text"
                value={provider.defaultModel}
                onChange={(e) => onUpdate({ defaultModel: e.target.value })}
                placeholder="local-model"
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">API Key (optional)</label>
              <input
                type="password"
                value={provider.apiKey || ""}
                onChange={(e) =>
                  onUpdate(e.target.value ? { apiKey: e.target.value } : {})
                }
                placeholder="Not required for local models"
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm"
              />
            </div>
          </div>

          {/* Available Models */}
          {provider.availableModels && provider.availableModels.length > 0 && (
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-2">
                Available Models ({provider.availableModels.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {provider.availableModels.map((model) => (
                  <span
                    key={model}
                    className="px-2 py-1 text-xs rounded bg-[var(--surface-2)] text-[var(--text-secondary)]"
                  >
                    {model}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Capabilities */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={provider.supportsEmbeddings}
                onChange={(e) => onUpdate({ supportsEmbeddings: e.target.checked })}
                className="rounded border-[var(--border)]"
              />
              <span className="text-[var(--text-secondary)]">Supports Embeddings</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={provider.supportsVision}
                onChange={(e) => onUpdate({ supportsVision: e.target.checked })}
                className="rounded border-[var(--border)]"
              />
              <span className="text-[var(--text-secondary)]">Supports Vision</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={provider.supportsStreaming}
                onChange={(e) => onUpdate({ supportsStreaming: e.target.checked })}
                className="rounded border-[var(--border)]"
              />
              <span className="text-[var(--text-secondary)]">Supports Streaming</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={onSetDefault}
              disabled={provider.isDefault}
              className="text-sm text-[var(--electric-lime)] hover:underline disabled:opacity-50 disabled:no-underline"
            >
              Set as Default
            </button>
            <button
              onClick={onRemove}
              className="text-sm text-red-400 hover:underline"
            >
              Remove Provider
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Add Provider Modal
   ═══════════════════════════════════════════════════════════════════════════ */

function AddProviderModal({
  onAdd,
  onClose,
}: {
  onAdd: (type: AIProviderType) => void;
  onClose: () => void;
}) {
  const providerOptions: { type: AIProviderType; name: string; description: string }[] = [
    {
      type: "llmstudio",
      name: "LM Studio",
      description: "Run local models with LM Studio's OpenAI-compatible server",
    },
    {
      type: "ollama",
      name: "Ollama",
      description: "Run local models with Ollama's lightweight runtime",
    },
    {
      type: "openai",
      name: "OpenAI",
      description: "Use OpenAI's cloud API (GPT-4, etc.)",
    },
    {
      type: "custom",
      name: "Custom",
      description: "Any OpenAI-compatible API endpoint",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md mx-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-xl">
        <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Add AI Provider
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-2">
          {providerOptions.map((option) => (
            <button
              key={option.type}
              onClick={() => onAdd(option.type)}
              className="w-full p-4 rounded-xl text-left hover:bg-[var(--surface-2)] transition-colors"
            >
              <h3 className="font-medium text-[var(--text-primary)]">{option.name}</h3>
              <p className="text-sm text-[var(--text-muted)]">{option.description}</p>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-[var(--border-subtle)]">
          <p className="text-xs text-[var(--text-muted)] text-center">
            All providers use the OpenAI-compatible API format
          </p>
        </div>
      </div>
    </div>
  );
}
