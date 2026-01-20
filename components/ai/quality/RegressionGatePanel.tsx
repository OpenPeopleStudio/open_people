"use client";

import { useState, useEffect } from "react";

interface RegressionGate {
  id: string;
  name: string;
  description: string | null;
  scope_type: string;
  scope_id: string | null;
  requirements: {
    min_quality_score?: number;
    max_low_quality_rate?: number;
    min_sample_count?: number;
    min_benchmark_pass_rate?: number;
  };
  on_failure: string;
  is_active: boolean;
}

export function RegressionGatePanel() {
  const [gates, setGates] = useState<RegressionGate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchGates();
  }, []);

  async function fetchGates() {
    try {
      const res = await fetch("/api/ai/quality/gates");
      if (!res.ok) throw new Error("Failed to fetch gates");
      const data = await res.json();
      setGates(data.gates || []);
    } catch (err) {
      console.error("Error fetching gates:", err);
    } finally {
      setLoading(false);
    }
  }

  async function createGate(gate: Partial<RegressionGate>) {
    try {
      const res = await fetch("/api/ai/quality/gates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gate),
      });
      if (!res.ok) throw new Error("Failed to create gate");
      await fetchGates();
      setShowCreate(false);
    } catch (err) {
      console.error("Error creating gate:", err);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-[var(--text-muted)]">
        Loading regression gates...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)]">
            Regression Gates
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            Quality gates that must pass before deployments
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-3 py-1.5 text-sm bg-[var(--electric-lime)] text-[var(--void)] rounded-lg hover:opacity-90 transition-opacity"
        >
          {showCreate ? "Cancel" : "Add Gate"}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <CreateGateForm onSubmit={createGate} onCancel={() => setShowCreate(false)} />
      )}

      {/* Gates list */}
      {gates.length === 0 ? (
        <div className="p-6 text-center text-[var(--text-muted)] bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)]">
          <p>No regression gates configured.</p>
          <p className="text-sm mt-1">
            Add gates to ensure quality before deployments.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {gates.map((gate) => (
            <div
              key={gate.id}
              className="p-4 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)]"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-[var(--text-primary)]">
                      {gate.name}
                    </h4>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        gate.on_failure === "block"
                          ? "bg-[var(--error)]/10 text-[var(--error)]"
                          : gate.on_failure === "warn"
                            ? "bg-[var(--warning)]/10 text-[var(--warning)]"
                            : "bg-[var(--info)]/10 text-[var(--info)]"
                      }`}
                    >
                      {gate.on_failure}
                    </span>
                  </div>
                  {gate.description && (
                    <p className="text-sm text-[var(--text-muted)] mt-0.5">
                      {gate.description}
                    </p>
                  )}
                </div>
                <span className="text-xs text-[var(--text-muted)]">
                  {gate.scope_type}
                  {gate.scope_id && `: ${gate.scope_id}`}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {gate.requirements.min_quality_score && (
                  <span className="px-2 py-1 bg-[var(--surface-2)] rounded text-xs text-[var(--text-secondary)]">
                    Min Quality: {gate.requirements.min_quality_score}
                  </span>
                )}
                {gate.requirements.max_low_quality_rate && (
                  <span className="px-2 py-1 bg-[var(--surface-2)] rounded text-xs text-[var(--text-secondary)]">
                    Max Low Quality:{" "}
                    {(gate.requirements.max_low_quality_rate * 100).toFixed(0)}%
                  </span>
                )}
                {gate.requirements.min_sample_count && (
                  <span className="px-2 py-1 bg-[var(--surface-2)] rounded text-xs text-[var(--text-secondary)]">
                    Min Samples: {gate.requirements.min_sample_count}
                  </span>
                )}
                {gate.requirements.min_benchmark_pass_rate && (
                  <span className="px-2 py-1 bg-[var(--surface-2)] rounded text-xs text-[var(--text-secondary)]">
                    Benchmark Pass:{" "}
                    {(gate.requirements.min_benchmark_pass_rate * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateGateForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (gate: Partial<RegressionGate>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [scopeType, setScopeType] = useState("global");
  const [scopeId, setScopeId] = useState("");
  const [minQualityScore, setMinQualityScore] = useState("0.7");
  const [maxLowQualityRate, setMaxLowQualityRate] = useState("0.1");
  const [minSampleCount, setMinSampleCount] = useState("100");
  const [onFailure, setOnFailure] = useState("block");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      name,
      scope_type: scopeType,
      scope_id: scopeId || undefined,
      requirements: {
        min_quality_score: parseFloat(minQualityScore),
        max_low_quality_rate: parseFloat(maxLowQualityRate),
        min_sample_count: parseInt(minSampleCount, 10),
      },
      on_failure: onFailure,
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
            Gate Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
            placeholder="Production Quality Gate"
          />
        </div>
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-1">
            On Failure
          </label>
          <select
            value={onFailure}
            onChange={(e) => setOnFailure(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
          >
            <option value="block">Block</option>
            <option value="warn">Warn</option>
            <option value="notify">Notify Only</option>
          </select>
        </div>
      </div>

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
            <option value="global">Global</option>
            <option value="application">Application</option>
            <option value="model">Model</option>
            <option value="prompt">Prompt</option>
          </select>
        </div>
        {scopeType !== "global" && (
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-1">
              Scope ID
            </label>
            <input
              type="text"
              value={scopeId}
              onChange={(e) => setScopeId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
              placeholder="e.g., my-app or gpt-4"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-1">
            Min Quality Score
          </label>
          <input
            type="number"
            step="0.05"
            min="0"
            max="1"
            value={minQualityScore}
            onChange={(e) => setMinQualityScore(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
          />
        </div>
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-1">
            Max Low Quality Rate
          </label>
          <input
            type="number"
            step="0.05"
            min="0"
            max="1"
            value={maxLowQualityRate}
            onChange={(e) => setMaxLowQualityRate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
          />
        </div>
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-1">
            Min Sample Count
          </label>
          <input
            type="number"
            min="1"
            value={minSampleCount}
            onChange={(e) => setMinSampleCount(e.target.value)}
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
          disabled={!name}
          className="px-4 py-2 text-sm bg-[var(--electric-lime)] text-[var(--void)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Create Gate
        </button>
      </div>
    </form>
  );
}
