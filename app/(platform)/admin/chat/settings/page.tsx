"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════════════════════════
   AI Provider Settings - Tenant Admin
   Configure AI model preferences
   ═══════════════════════════════════════════════════════════════════════════ */

interface AISettings {
  default_model: string;
  temperature: number;
  max_tokens: number;
  stream_responses: boolean;
}

export default function AISettingsPage() {
  const [settings, setSettings] = useState<AISettings>({
    default_model: "gpt-4o",
    temperature: 0.7,
    max_tokens: 4096,
    stream_responses: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    loadSettings();
  }, []);
  
  async function loadSettings() {
    try {
      const res = await fetch("/api/ai/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  }
  
  async function saveSettings() {
    setSaving(true);
    try {
      await fetch("/api/ai/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  }
  
  const models = [
    { id: "gpt-4o", name: "GPT-4o", description: "Latest multimodal model" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Fast and efficient" },
    { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", description: "Balanced performance" },
    { id: "claude-3-5-haiku", name: "Claude 3.5 Haiku", description: "Quick responses" },
  ];
  
  if (loading) {
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
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/chat"
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            AI Settings
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Configure AI model and response preferences
          </p>
        </div>
      </div>
      
      {/* Settings Form */}
      <div className="space-y-8">
        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
            Default Model
          </label>
          <div className="grid grid-cols-2 gap-3">
            {models.map(model => (
              <button
                key={model.id}
                onClick={() => setSettings(s => ({ ...s, default_model: model.id }))}
                className={`p-4 rounded-xl border text-left transition-colors ${
                  settings.default_model === model.id
                    ? "border-[var(--electric-lime)] bg-[var(--electric-lime)]/10"
                    : "border-[var(--border-subtle)] bg-[var(--surface-1)] hover:border-[var(--border)]"
                }`}
              >
                <p className="font-medium text-[var(--text-primary)]">{model.name}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{model.description}</p>
              </button>
            ))}
          </div>
        </div>
        
        {/* Temperature */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Temperature
            </label>
            <span className="text-sm text-[var(--text-muted)]">{settings.temperature}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.temperature}
            onChange={(e) => setSettings(s => ({ ...s, temperature: parseFloat(e.target.value) }))}
            className="w-full accent-[var(--electric-lime)]"
          />
          <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
            <span>Precise</span>
            <span>Creative</span>
          </div>
        </div>
        
        {/* Max Tokens */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
            Max Response Length
          </label>
          <select
            value={settings.max_tokens}
            onChange={(e) => setSettings(s => ({ ...s, max_tokens: parseInt(e.target.value) }))}
            className="w-full px-4 py-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
          >
            <option value="1024">Short (1024 tokens)</option>
            <option value="2048">Medium (2048 tokens)</option>
            <option value="4096">Long (4096 tokens)</option>
            <option value="8192">Extended (8192 tokens)</option>
          </select>
        </div>
        
        {/* Stream Responses */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <div>
            <p className="font-medium text-[var(--text-primary)]">Stream Responses</p>
            <p className="text-sm text-[var(--text-muted)]">Show responses as they generate</p>
          </div>
          <button
            onClick={() => setSettings(s => ({ ...s, stream_responses: !s.stream_responses }))}
            className={`w-12 h-7 rounded-full transition-colors ${
              settings.stream_responses ? "bg-[var(--electric-lime)]" : "bg-[var(--border)]"
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
              settings.stream_responses ? "translate-x-6" : "translate-x-1"
            }`} />
          </button>
        </div>
        
        {/* Save Button */}
        <div className="pt-4">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-3 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
