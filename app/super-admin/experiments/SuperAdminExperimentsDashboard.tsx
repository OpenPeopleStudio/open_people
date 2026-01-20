"use client";

import { useState } from "react";
import Link from "next/link";
import type {
  ExperimentPlan,
  Experiment,
  FeatureFlag,
  Audience,
  ExperimentSubscription,
  ExperimentTier,
} from "@/types/experiments";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin Experiments Dashboard
   Manages experiments, flags, and audiences across all tenants
   ═══════════════════════════════════════════════════════════════════════════ */

type Tenant = {
  id: string;
  name: string;
  status: string;
};

type ExperimentWithTenant = Experiment & { tenant_name?: string };
type FlagWithTenant = FeatureFlag & { tenant_name?: string };
type AudienceWithTenant = Audience & { tenant_name?: string };
type SubscriptionWithTenant = ExperimentSubscription & { tenant_name?: string };

type Props = {
  tenants: Tenant[];
  experiments: ExperimentWithTenant[];
  flags: FlagWithTenant[];
  audiences: AudienceWithTenant[];
  subscriptions: SubscriptionWithTenant[];
  plans: Record<ExperimentTier, ExperimentPlan>;
};

export function SuperAdminExperimentsDashboard({
  tenants,
  experiments: initialExperiments,
  flags: initialFlags,
  audiences: initialAudiences,
  subscriptions,
  plans,
}: Props) {
  const [experiments, setExperiments] = useState(initialExperiments);
  const [flags, setFlags] = useState(initialFlags);
  const [audiences] = useState(initialAudiences);
  const [activeTab, setActiveTab] = useState<"experiments" | "flags" | "audiences" | "subscriptions">("experiments");
  const [selectedTenant, setSelectedTenant] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Experiment form state
  const [showExpModal, setShowExpModal] = useState(false);
  const [expForm, setExpForm] = useState({
    tenant_id: "",
    name: "",
    key: "",
    description: "",
    type: "ab_test" as const,
    rolloutPercentage: 100,
  });
  const [savingExp, setSavingExp] = useState(false);

  // Flag form state
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagForm, setFlagForm] = useState({
    tenant_id: "",
    name: "",
    key: "",
    description: "",
    enabled: false,
    rolloutPercentage: 100,
  });
  const [savingFlag, setSavingFlag] = useState(false);

  // Filter data based on selected tenant and search query
  const filteredExperiments = experiments.filter((exp) => {
    const matchesTenant = selectedTenant === "all" || exp.tenant_id === selectedTenant;
    const matchesSearch =
      searchQuery === "" ||
      exp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.key.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTenant && matchesSearch;
  });

  const filteredFlags = flags.filter((flag) => {
    const matchesTenant = selectedTenant === "all" || flag.tenant_id === selectedTenant;
    const matchesSearch =
      searchQuery === "" ||
      flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.key.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTenant && matchesSearch;
  });

  const filteredAudiences = audiences.filter((audience) => {
    const matchesTenant = selectedTenant === "all" || audience.tenant_id === selectedTenant;
    const matchesSearch =
      searchQuery === "" ||
      audience.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTenant && matchesSearch;
  });

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesTenant = selectedTenant === "all" || sub.tenant_id === selectedTenant;
    return matchesTenant;
  });

  const handleCreateExperiment = async () => {
    if (!expForm.tenant_id) {
      alert("Please select a tenant");
      return;
    }
    setSavingExp(true);
    try {
      const res = await fetch("/api/super-admin/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...expForm,
          rollout_percentage: expForm.rolloutPercentage,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const tenant = tenants.find((t) => t.id === expForm.tenant_id);
        setExperiments((prev) => [
          { ...data.experiment, tenant_name: tenant?.name },
          ...prev,
        ]);
        setShowExpModal(false);
        setExpForm({
          tenant_id: "",
          name: "",
          key: "",
          description: "",
          type: "ab_test",
          rolloutPercentage: 100,
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
    if (!flagForm.tenant_id) {
      alert("Please select a tenant");
      return;
    }
    setSavingFlag(true);
    try {
      const res = await fetch("/api/super-admin/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...flagForm,
          rollout_percentage: flagForm.rolloutPercentage,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const tenant = tenants.find((t) => t.id === flagForm.tenant_id);
        setFlags((prev) => [
          { ...data.flag, tenant_name: tenant?.name },
          ...prev,
        ]);
        setShowFlagModal(false);
        setFlagForm({
          tenant_id: "",
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

  const handleToggleFlag = async (flagId: string, tenantId: string, enabled: boolean) => {
    try {
      const res = await fetch("/api/super-admin/flags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: flagId, tenant_id: tenantId, enabled }),
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

  const handleUpdateExpStatus = async (expId: string, tenantId: string, status: string) => {
    try {
      const res = await fetch("/api/super-admin/experiments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: expId, tenant_id: tenantId, status }),
      });

      if (res.ok) {
        setExperiments((prev) =>
          prev.map((e) =>
            e.id === expId ? { ...e, status: status as Experiment["status"] } : e
          )
        );
      }
    } catch (error) {
      console.error("Update experiment error:", error);
    }
  };

  const handleDeleteExperiment = async (expId: string, tenantId: string) => {
    if (!confirm("Are you sure you want to delete this experiment?")) return;
    
    try {
      const res = await fetch(`/api/super-admin/experiments?id=${expId}&tenant_id=${tenantId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setExperiments((prev) => prev.filter((e) => e.id !== expId));
      }
    } catch (error) {
      console.error("Delete experiment error:", error);
    }
  };

  const handleDeleteFlag = async (flagId: string, tenantId: string) => {
    if (!confirm("Are you sure you want to delete this flag?")) return;
    
    try {
      const res = await fetch(`/api/super-admin/flags?id=${flagId}&tenant_id=${tenantId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setFlags((prev) => prev.filter((f) => f.id !== flagId));
      }
    } catch (error) {
      console.error("Delete flag error:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--surface-1)]">
          {[
            { id: "experiments" as const, label: "Experiments" },
            { id: "flags" as const, label: "Feature Flags" },
            { id: "audiences" as const, label: "Audiences" },
            { id: "subscriptions" as const, label: "Subscriptions" },
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

        {/* Search & Tenant Filter */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)] w-48"
          />
          <select
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
            className="px-4 py-2 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
          >
            <option value="all">All Tenants</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Experiments Tab */}
      {activeTab === "experiments" && (
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              A/B Tests & Experiments ({filteredExperiments.length})
            </h2>
            <button
              onClick={() => setShowExpModal(true)}
              className="btn-primary text-sm"
            >
              Create Experiment
            </button>
          </div>

          {filteredExperiments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--text-muted)]">No experiments found</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                {selectedTenant !== "all" ? "Try selecting a different tenant" : "Create your first experiment"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExperiments.map((exp) => (
                <div
                  key={exp.id}
                  className="p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {exp.name}
                        </p>
                        <Link
                          href={`/super-admin/tenants/${exp.tenant_id}`}
                          className="text-xs px-2 py-0.5 rounded bg-[var(--surface-3)] text-[var(--text-muted)] hover:text-[var(--electric-lime)]"
                        >
                          {exp.tenant_name || "Unknown"}
                        </Link>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {exp.key} · {exp.variants?.length || 0} variants · {exp.rollout_percentage}% rollout
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          exp.status === "running"
                            ? "bg-[var(--success)]/10 text-[var(--success)]"
                            : exp.status === "draft"
                            ? "bg-[var(--warning)]/10 text-[var(--warning)]"
                            : exp.status === "paused"
                            ? "bg-[var(--electric-cyan)]/10 text-[var(--electric-cyan)]"
                            : "bg-[var(--text-muted)]/10 text-[var(--text-muted)]"
                        }`}
                      >
                        {exp.status}
                      </span>
                      {exp.status === "draft" && (
                        <button
                          onClick={() => handleUpdateExpStatus(exp.id, exp.tenant_id, "running")}
                          className="px-3 py-1 rounded text-xs bg-[var(--electric-lime)] text-[var(--void)] hover:opacity-80"
                        >
                          Start
                        </button>
                      )}
                      {exp.status === "running" && (
                        <button
                          onClick={() => handleUpdateExpStatus(exp.id, exp.tenant_id, "paused")}
                          className="px-3 py-1 rounded text-xs bg-[var(--warning)]/20 text-[var(--warning)] hover:opacity-80"
                        >
                          Pause
                        </button>
                      )}
                      {exp.status === "paused" && (
                        <button
                          onClick={() => handleUpdateExpStatus(exp.id, exp.tenant_id, "running")}
                          className="px-3 py-1 rounded text-xs bg-[var(--success)]/20 text-[var(--success)] hover:opacity-80"
                        >
                          Resume
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteExperiment(exp.id, exp.tenant_id)}
                        className="px-2 py-1 rounded text-xs text-[var(--error)] hover:bg-[var(--error)]/10"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
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
              Feature Flags ({filteredFlags.length})
            </h2>
            <button
              onClick={() => setShowFlagModal(true)}
              className="btn-primary text-sm"
            >
              Create Flag
            </button>
          </div>

          {filteredFlags.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--text-muted)]">No flags found</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                {selectedTenant !== "all" ? "Try selecting a different tenant" : "Create your first feature flag"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFlags.map((flag) => (
                <div
                  key={flag.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {flag.name}
                      </p>
                      <Link
                        href={`/super-admin/tenants/${flag.tenant_id}`}
                        className="text-xs px-2 py-0.5 rounded bg-[var(--surface-3)] text-[var(--text-muted)] hover:text-[var(--electric-lime)]"
                      >
                        {flag.tenant_name || "Unknown"}
                      </Link>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {flag.key} · {flag.rollout_percentage}% rollout
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={flag.enabled}
                        onChange={(e) => handleToggleFlag(flag.id, flag.tenant_id, e.target.checked)}
                        className="w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--electric-lime)] focus:ring-[var(--electric-lime)]"
                      />
                      <span className="text-sm text-[var(--text-secondary)]">
                        {flag.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </label>
                    <button
                      onClick={() => handleDeleteFlag(flag.id, flag.tenant_id)}
                      className="px-2 py-1 rounded text-xs text-[var(--error)] hover:bg-[var(--error)]/10"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
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
            Audiences & Targeting ({filteredAudiences.length})
          </h2>
          
          {filteredAudiences.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--text-muted)]">No audiences found</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Audiences are created by tenants for experiment targeting
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAudiences.map((audience) => (
                <div
                  key={audience.id}
                  className="p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {audience.name}
                        </p>
                        <Link
                          href={`/super-admin/tenants/${audience.tenant_id}`}
                          className="text-xs px-2 py-0.5 rounded bg-[var(--surface-3)] text-[var(--text-muted)] hover:text-[var(--electric-lime)]"
                        >
                          {audience.tenant_name || "Unknown"}
                        </Link>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {audience.rules?.length || 0} rule{(audience.rules?.length || 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeTab === "subscriptions" && (
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            Experiment Subscriptions ({filteredSubscriptions.length})
          </h2>
          
          {filteredSubscriptions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--text-muted)]">No subscriptions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSubscriptions.map((sub) => {
                const plan = plans[sub.tier];
                return (
                  <div
                    key={sub.id}
                    className="p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/super-admin/tenants/${sub.tenant_id}`}
                            className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--electric-lime)]"
                          >
                            {sub.tenant_name || "Unknown Tenant"}
                          </Link>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              sub.status === "active"
                                ? "bg-[var(--success)]/10 text-[var(--success)]"
                                : sub.status === "trialing"
                                ? "bg-[var(--warning)]/10 text-[var(--warning)]"
                                : "bg-[var(--error)]/10 text-[var(--error)]"
                            }`}
                          >
                            {sub.status}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                          Created {new Date(sub.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-[var(--electric-lime)]">
                          {plan?.name || sub.tier} Plan
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {plan?.price === 0 ? "Free" : `$${plan?.price}/mo`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
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
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Tenant *
                </label>
                <select
                  value={expForm.tenant_id}
                  onChange={(e) => setExpForm((p) => ({ ...p, tenant_id: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                >
                  <option value="">Select a tenant...</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Name *
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
                    Key *
                  </label>
                  <input
                    type="text"
                    value={expForm.key}
                    onChange={(e) => setExpForm((p) => ({ ...p, key: e.target.value }))}
                    placeholder="e.g., homepage_hero_test"
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Description
                </label>
                <textarea
                  value={expForm.description}
                  onChange={(e) => setExpForm((p) => ({ ...p, description: e.target.value }))}
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
                      rolloutPercentage: parseInt(e.target.value) || 0,
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
                disabled={!expForm.tenant_id || !expForm.name || !expForm.key || savingExp}
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
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Tenant *
                </label>
                <select
                  value={flagForm.tenant_id}
                  onChange={(e) => setFlagForm((p) => ({ ...p, tenant_id: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                >
                  <option value="">Select a tenant...</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Name *
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
                    Key *
                  </label>
                  <input
                    type="text"
                    value={flagForm.key}
                    onChange={(e) => setFlagForm((p) => ({ ...p, key: e.target.value }))}
                    placeholder="e.g., new_checkout_flow"
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-2)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={flagForm.enabled}
                  onChange={(e) => setFlagForm((p) => ({ ...p, enabled: e.target.checked }))}
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
                disabled={!flagForm.tenant_id || !flagForm.name || !flagForm.key || savingFlag}
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
