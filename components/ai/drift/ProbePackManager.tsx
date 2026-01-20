"use client";

import { useState, useEffect } from "react";

interface ProbePack {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  is_system: boolean;
  probes: Array<{
    name: string;
    probe_input: string;
    category?: string;
  }>;
  recommended_frequency: string;
  recommended_threshold: number;
  install_count: number;
}

interface ProbePackInstall {
  id: string;
  pack_id: string;
  frequency_override?: string;
  threshold_override?: number;
  is_active: boolean;
  installed_at: string;
  pack: ProbePack;
}

export function ProbePackManager() {
  const [availablePacks, setAvailablePacks] = useState<ProbePack[]>([]);
  const [installedPacks, setInstalledPacks] = useState<ProbePackInstall[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"available" | "installed">("installed");

  useEffect(() => {
    fetchPacks();
  }, []);

  async function fetchPacks() {
    setLoading(true);
    try {
      const [availableRes, installedRes] = await Promise.all([
        fetch("/api/ai/drift/probes/packs"),
        fetch("/api/ai/drift/probes/packs?installed=true"),
      ]);

      if (availableRes.ok) {
        const data = await availableRes.json();
        setAvailablePacks(data.packs || []);
      }

      if (installedRes.ok) {
        const data = await installedRes.json();
        setInstalledPacks(data.packs || []);
      }
    } catch (err) {
      console.error("Error fetching packs:", err);
    } finally {
      setLoading(false);
    }
  }

  async function installPack(packId: string) {
    try {
      const res = await fetch("/api/ai/drift/probes/packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack_id: packId }),
      });

      if (res.ok) {
        await fetchPacks();
        setView("installed");
      }
    } catch (err) {
      console.error("Error installing pack:", err);
    }
  }

  const categoryColors: Record<string, string> = {
    customer_support: "bg-blue-500/10 text-blue-500",
    legal: "bg-purple-500/10 text-purple-500",
    medical: "bg-red-500/10 text-red-500",
    security: "bg-orange-500/10 text-orange-500",
    general: "bg-green-500/10 text-green-500",
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-[var(--text-muted)]">
        Loading probe packs...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex items-center gap-2 p-1 bg-[var(--surface-1)] rounded-lg w-fit">
        <button
          onClick={() => setView("installed")}
          className={`px-4 py-2 rounded-md text-sm transition-colors ${
            view === "installed"
              ? "bg-[var(--electric-lime)] text-[var(--void)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          Installed ({installedPacks.length})
        </button>
        <button
          onClick={() => setView("available")}
          className={`px-4 py-2 rounded-md text-sm transition-colors ${
            view === "available"
              ? "bg-[var(--electric-lime)] text-[var(--void)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          Available ({availablePacks.length})
        </button>
      </div>

      {/* Installed packs */}
      {view === "installed" && (
        <div className="space-y-3">
          {installedPacks.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)] bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)]">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-[var(--text-muted)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286z"
                />
              </svg>
              <p className="font-medium text-[var(--text-primary)]">
                No probe packs installed
              </p>
              <p className="text-sm mt-1">
                Install probe packs to monitor AI behavior and detect drift.
              </p>
              <button
                onClick={() => setView("available")}
                className="mt-4 px-4 py-2 text-sm bg-[var(--electric-lime)] text-[var(--void)] rounded-lg"
              >
                Browse Available Packs
              </button>
            </div>
          ) : (
            installedPacks.map((install) => (
              <div
                key={install.id}
                className="p-4 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-[var(--text-primary)]">
                        {install.pack.name}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          categoryColors[install.pack.category] ||
                          "bg-gray-500/10 text-gray-500"
                        }`}
                      >
                        {install.pack.category}
                      </span>
                      {install.is_active && (
                        <span className="px-2 py-0.5 rounded text-xs bg-[var(--success)]/10 text-[var(--success)]">
                          Active
                        </span>
                      )}
                    </div>
                    {install.pack.description && (
                      <p className="text-sm text-[var(--text-muted)] mt-1">
                        {install.pack.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-[var(--text-muted)]">Probes: </span>
                    <span className="text-[var(--text-primary)]">
                      {install.pack.probes.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">Frequency: </span>
                    <span className="text-[var(--text-primary)]">
                      {install.frequency_override ||
                        install.pack.recommended_frequency}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">Threshold: </span>
                    <span className="text-[var(--text-primary)]">
                      {(
                        (install.threshold_override ||
                          install.pack.recommended_threshold) * 100
                      ).toFixed(0)}
                      %
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">Installed: </span>
                    <span className="text-[var(--text-primary)]">
                      {new Date(install.installed_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Available packs */}
      {view === "available" && (
        <div className="space-y-3">
          {availablePacks.map((pack) => {
            const isInstalled = installedPacks.some(
              (i) => i.pack_id === pack.id
            );
            return (
              <div
                key={pack.id}
                className="p-4 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-[var(--text-primary)]">
                        {pack.name}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          categoryColors[pack.category] ||
                          "bg-gray-500/10 text-gray-500"
                        }`}
                      >
                        {pack.category}
                      </span>
                      {pack.is_system && (
                        <span className="px-2 py-0.5 rounded text-xs bg-[var(--info)]/10 text-[var(--info)]">
                          System
                        </span>
                      )}
                    </div>
                    {pack.description && (
                      <p className="text-sm text-[var(--text-muted)] mt-1">
                        {pack.description}
                      </p>
                    )}
                  </div>
                  {isInstalled ? (
                    <span className="px-3 py-1.5 text-sm bg-[var(--surface-2)] text-[var(--text-muted)] rounded-lg">
                      Installed
                    </span>
                  ) : (
                    <button
                      onClick={() => installPack(pack.id)}
                      className="px-3 py-1.5 text-sm bg-[var(--electric-lime)] text-[var(--void)] rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Install
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm mb-3">
                  <div>
                    <span className="text-[var(--text-muted)]">Probes: </span>
                    <span className="text-[var(--text-primary)]">
                      {pack.probes.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">Frequency: </span>
                    <span className="text-[var(--text-primary)]">
                      {pack.recommended_frequency}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">Threshold: </span>
                    <span className="text-[var(--text-primary)]">
                      {(pack.recommended_threshold * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">Installs: </span>
                    <span className="text-[var(--text-primary)]">
                      {pack.install_count}
                    </span>
                  </div>
                </div>

                {/* Probe list preview */}
                <div className="flex flex-wrap gap-1">
                  {pack.probes.slice(0, 5).map((probe) => (
                    <span
                      key={probe.name}
                      className="px-2 py-0.5 bg-[var(--surface-2)] rounded text-xs text-[var(--text-muted)]"
                    >
                      {probe.name}
                    </span>
                  ))}
                  {pack.probes.length > 5 && (
                    <span className="px-2 py-0.5 text-xs text-[var(--text-muted)]">
                      +{pack.probes.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
