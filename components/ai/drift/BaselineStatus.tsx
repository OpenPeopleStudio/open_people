"use client";

import { useState, useEffect, type FormEvent } from "react";

interface AutoBaselineConfig {
  id: string;
  scope_type: string;
  scope_id?: string;
  collection_duration_hours: number;
  min_samples: number;
  trigger_on: string;
  is_active: boolean;
}

export function BaselineStatus() {
  const [configs, setConfigs] = useState<AutoBaselineConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/drift/baselines/auto");
      if (res.ok) {
        const data = await res.json();
        setConfigs(data.configs || []);
      }
    } catch (err) {
      console.error("Error fetching baseline data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function createConfig(config: Partial<AutoBaselineConfig>) {
    try {
      const res = await fetch("/api/ai/drift/baselines/auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        await fetchData();
        setShowCreate(false);
      }
    } catch (err) {
      console.error("Error creating config:", err);
    }
  }

  async function triggerBaseline(scopeType: string, scopeId?: string) {
    try {
      const res = await fetch("/api/ai/drift/baselines/auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "trigger",
          trigger_type: "manual",
          [`${scopeType}_id`]: scopeId,
        }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error("Error triggering baseline:", err);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-[var(--text-muted)]">
        Loading baseline status...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)]">
            Auto-Baseline
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            Automatically collect baselines after prompt/model approvals
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-3 py-1.5 text-sm bg-[var(--electric-lime)] text-[var(--void)] rounded-lg hover:opacity-90 transition-opacity"
        >
          {showCreate ? "Cancel" : "Add Config"}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <CreateConfigForm
          onSubmit={createConfig}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Configs list */}
      {configs.length === 0 ? (
        <div className="p-6 text-center text-[var(--text-muted)] bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)]">
          <p>No auto-baseline configs configured.</p>
          <p className="text-sm mt-1">
            Set up auto-baseline to collect drift baselines after approvals.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {configs.map((config) => (
            <div
              key={config.id}
              className="p-4 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)]"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-[var(--text-primary)]">
                      {config.scope_type.charAt(0).toUpperCase() +
                        config.scope_type.slice(1)}
                      {config.scope_id && `: ${config.scope_id}`}
                    </h4>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        config.is_active
                          ? "bg-[var(--success)]/10 text-[var(--success)]"
                          : "bg-[var(--text-muted)]/10 text-[var(--text-muted)]"
                      }`}
                    >
                      {config.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    triggerBaseline(config.scope_type, config.scope_id)
                  }
                  className="text-xs px-2 py-1 text-[var(--electric-lime)] hover:bg-[var(--electric-lime)]/10 rounded transition-colors"
                >
                  Trigger Manual
                </button>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-[var(--text-muted)]">Trigger: </span>
                  <span className="text-[var(--text-primary)]">
                    On {config.trigger_on}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Duration: </span>
                  <span className="text-[var(--text-primary)]">
                    {config.collection_duration_hours}h
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Min Samples: </span>
                  <span className="text-[var(--text-primary)]">
                    {config.min_samples}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* How it works */}
      <div className="p-4 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)]">
        <h4 className="font-medium text-[var(--text-primary)] mb-2">
          How Auto-Baseline Works
        </h4>
        <ol className="list-decimal list-inside space-y-1 text-sm text-[var(--text-muted)]">
          <li>
            When a prompt version is approved for deployment, baseline collection
            starts automatically
          </li>
          <li>
            The system collects output samples over the configured duration (e.g.,
            24 hours)
          </li>
          <li>
            Once enough samples are collected, a baseline is created with quality
            and behavior metrics
          </li>
          <li>
            Future outputs are compared against this baseline to detect drift
          </li>
        </ol>
      </div>
    </div>
  );
}

function CreateConfigForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (config: Partial<AutoBaselineConfig>) => void;
  onCancel: () => void;
}) {
  const [scopeType, setScopeType] = useState("prompt");
  const [scopeId, setScopeId] = useState("");
  const [triggerOn, setTriggerOn] = useState("approval");
  const [durationHours, setDurationHours] = useState("24");
  const [minSamples, setMinSamples] = useState("100");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit({
      scope_type: scopeType,
      trigger_on: triggerOn,
      collection_duration_hours: parseInt(durationHours, 10),
      min_samples: parseInt(minSamples, 10),
      ...(scopeId ? { scope_id: scopeId } : {}),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-1">
            Scope Type
          </label>
          <select
            value={scopeType}
            onChange={(e) => setScopeType(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
          >
            <option value="prompt">Prompt</option>
            <option value="model">Model</option>
            <option value="application">Application</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-1">
            Scope ID (optional)
          </label>
          <input
            type="text"
            value={scopeId}
            onChange={(e) => setScopeId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
            placeholder="Leave empty for all"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-1">
            Trigger On
          </label>
          <select
            value={triggerOn}
            onChange={(e) => setTriggerOn(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
          >
            <option value="approval">Approval</option>
            <option value="deploy">Deploy</option>
            <option value="manual">Manual Only</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-1">
            Duration (hours)
          </label>
          <input
            type="number"
            min="1"
            value={durationHours}
            onChange={(e) => setDurationHours(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
          />
        </div>
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-1">
            Min Samples
          </label>
          <input
            type="number"
            min="10"
            value={minSamples}
            onChange={(e) => setMinSamples(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm bg-[var(--electric-lime)] text-[var(--void)] rounded-lg hover:opacity-90 transition-opacity"
        >
          Create Config
        </button>
      </div>
    </form>
  );
}
