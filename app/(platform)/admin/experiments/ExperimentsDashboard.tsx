"use client";

import { useState } from "react";
import type {
  ExperimentPlan,
  Experiment,
  FeatureFlag,
  Audience,
} from "@/types/experiments";

/* ═══════════════════════════════════════════════════════════════════════════
   Experiments Dashboard Client Component
   Manages experiments, flags, and audiences
   ═══════════════════════════════════════════════════════════════════════════ */

type Props = {
  experiments: Experiment[];
  flags: FeatureFlag[];
  audiences: Audience[];
  plan: ExperimentPlan;
};

export function ExperimentsDashboard({
  experiments: initialExperiments,
  flags: initialFlags,
  audiences: initialAudiences,
  plan,
}: Props) {
  const [experiments, setExperiments] = useState(initialExperiments);
  const [flags, setFlags] = useState(initialFlags);
  const [audiences] = useState(initialAudiences);
  const [activeTab, setActiveTab] = useState<"experiments" | "flags" | "audiences">("experiments");

  // Experiment form state
  const [showExpModal, setShowExpModal] = useState(false);
  const [expForm, setExpForm] = useState({
    name: "",
    key: "",
    description: "",
    type: "ab_test" as const,
    rolloutPercentage: 100,
    variants: [
      { name: "Control", key: "control", weight: 50, isControl: true },
      { name: "Variant A", key: "variant_a", weight: 50, isControl: false },
    ],
  });
  const [savingExp, setSavingExp] = useState(false);

  // Flag form state
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagForm, setFlagForm] = useState({
    name: "",
    key: "",
    description: "",
    enabled: false,
    rolloutPercentage: 100,
  });
  const [savingFlag, setSavingFlag] = useState(false);

  const handleCreateExperiment = async () => {
    setSavingExp(true);
    try {
      const res = await fetch("/api/experiments/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expForm),
      });

      const data = await res.json();

      if (res.ok) {
        setExperiments((prev) => [data.experiment, ...prev]);
        setShowExpModal(false);
        setExpForm({
          name: "",
          key: "",
          description: "",
          type: "ab_test",
          rolloutPercentage: 100,
          variants: [
            { name: "Control", key: "control", weight: 50, isControl: true },
            { name: "Variant A", key: "variant_a", weight: 50, isControl: false },
          ],
        });
      } else {
        alert(data.error || "Failed to create experiment");
      }
    } catch (error) {
      alert("An error occurred");
    } finally {
      setSavingExp(false);
    }
  };

  const handleCreateFlag = async () => {
    setSavingFlag(true);
    try {
      const res = await fetch("/api/experiments/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flagForm),
      });

      const data = await res.json();

      if (res.ok) {
        setFlags((prev) => [data.flag, ...prev]);
        setShowFlagModal(false);
        setFlagForm({
          name: "",
          key: "",
          description: "",
          enabled: false,
          rolloutPercentage: 100,
        });
      } else {
        alert(data.error || "Failed to create flag");
      }
    } catch (error) {
      alert("An error occurred");
    } finally {
      setSavingFlag(false);
    }
  };

  const handleToggleFlag = async (flagId: string, enabled: boolean) => {
    try {
      const res = await fetch("/api/experiments/flags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: flagId, enabled }),
      });

      if (res.ok) {
        setFlags((prev) =>
          prev.map((f) => (f.id === flagId ? { ...f, enabled } : f))
        );
      }
    } catch (error) {
      console.error("Toggle flag error:", error);
    }
  };

  const handleUpdateExpStatus = async (expId: string, status: string) => {
    try {
      const res = await fetch("/api/experiments/experiments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: expId, status }),
      });

      if (res.ok) {
        setExperiments((prev) =>
          prev.map((e) => (e.id === expId ? { ...e, status: status as Experiment["status"] } : e))
        );
      }
    } catch (error) {
      console.error("Update experiment error:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--surface-1)] w-fit">
        {[
          { id: "experiments" as const, label: "Experiments" },
          { id: "flags" as const, label: "Feature Flags" },
          { id: "audiences" as const, label: "Audiences" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-[var(--electric-lime)] text-[var(--void)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Experiments Tab */}
      {activeTab === "experiments" && (
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              A/B Tests & Experiments
            </h2>
            <button
              onClick={() => setShowExpModal(true)}
              className="btn-primary text-sm"
            >
              Create Experiment
            </button>
          </div>

          {experiments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--text-muted)]">No experiments yet</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Create your first A/B test
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {experiments.map((exp) => (
                <div
                  key={exp.id}
                  className="p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {exp.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {exp.key} · {exp.variants?.length || 0} variants ·{" "}
                        {exp.rollout_percentage}% rollout
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          exp.status === "running"
                            ? "bg-[var(--success)]/10 text-[var(--success)]"
                            : exp.status === "draft"
                            ? "bg-[var(--warning)]/10 text-[var(--warning)]"
                            : "bg-[var(--text-muted)]/10 text-[var(--text-muted)]"
                        }`}
                      >
                        {exp.status}
                      </span>
                      {exp.status === "draft" && (
                        <button
                          onClick={() => handleUpdateExpStatus(exp.id, "running")}
                          className="px-3 py-1 rounded text-xs bg-[var(--electric-lime)] text-[var(--void)] hover:opacity-80"
                        >
                          Start
                        </button>
                      )}
                      {exp.status === "running" && (
                        <button
                          onClick={() => handleUpdateExpStatus(exp.id, "paused")}
                          className="px-3 py-1 rounded text-xs bg-[var(--warning)]/20 text-[var(--warning)] hover:opacity-80"
                        >
                          Pause
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Feature Flags Tab */}
      {activeTab === "flags" && (
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Feature Flags
            </h2>
            <button
              onClick={() => setShowFlagModal(true)}
              className="btn-primary text-sm"
            >
              Create Flag
            </button>
          </div>

          {flags.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--text-muted)]">No flags yet</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Create your first feature flag
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {flags.map((flag) => (
                <div
                  key={flag.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {flag.name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {flag.key} · {flag.rollout_percentage}% rollout
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={flag.enabled}
                      onChange={(e) => handleToggleFlag(flag.id, e.target.checked)}
                      className="w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--electric-lime)] focus:ring-[var(--electric-lime)]"
                    />
                    <span className="text-sm text-[var(--text-secondary)]">
                      {flag.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audiences Tab */}
      {activeTab === "audiences" && (
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            Audiences & Targeting
          </h2>
          {!plan.audienceRules ? (
            <div className="text-center py-12">
              <p className="text-[var(--text-muted)]">
                Audience targeting is not available on your plan
              </p>
              <a href="/admin/experiments/upgrade" className="btn-primary text-sm mt-4 inline-block">
                Upgrade to enable targeting
              </a>
            </div>
          ) : audiences.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--text-muted)]">No audiences yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {audiences.map((audience) => (
                <div
                  key={audience.id}
                  className="p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]"
                >
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {audience.name}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {audience.rules.length} rule{audience.rules.length !== 1 ? "s" : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Experiment Modal */}
      {showExpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[var(--void)]/80 backdrop-blur-sm"
            onClick={() => setShowExpModal(false)}
          />
          <div className="relative bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Create Experiment
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={expForm.name}
                    onChange={(e) => setExpForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Key
                  </label>
                  <input
                    type="text"
                    value={expForm.key}
                    onChange={(e) => setExpForm((p) => ({ ...p, key: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={expForm.description}
                  onChange={(e) =>
                    setExpForm((p) => ({ ...p, description: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Rollout Percentage
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={expForm.rolloutPercentage}
                  onChange={(e) =>
                    setExpForm((p) => ({
                      ...p,
                      rolloutPercentage: parseInt(e.target.value),
                    }))
                  }
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowExpModal(false)}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateExperiment}
                disabled={!expForm.name || !expForm.key || savingExp}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {savingExp ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Flag Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[var(--void)]/80 backdrop-blur-sm"
            onClick={() => setShowFlagModal(false)}
          />
          <div className="relative bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Create Feature Flag
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={flagForm.name}
                    onChange={(e) => setFlagForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Key
                  </label>
                  <input
                    type="text"
                    value={flagForm.key}
                    onChange={(e) => setFlagForm((p) => ({ ...p, key: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-2)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={flagForm.enabled}
                  onChange={(e) =>
                    setFlagForm((p) => ({ ...p, enabled: e.target.checked }))
                  }
                  className="w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--electric-lime)] focus:ring-[var(--electric-lime)]"
                />
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Enabled by default
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Flag will be active immediately
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowFlagModal(false)}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFlag}
                disabled={!flagForm.name || !flagForm.key || savingFlag}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {savingFlag ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
