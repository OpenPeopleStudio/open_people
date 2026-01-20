"use client";

import { useState, useEffect, useCallback } from "react";
import {
  PlatformSettings,
  SettingsCategory,
  DEFAULT_SETTINGS,
  IntegrationsHealth,
} from "@/types/platform-settings";
import {
  GeneralTab,
  FeaturesTab,
  LimitsTab,
  SecurityTab,
  EmailTab,
  StorageTab,
  IntegrationsTab,
  DangerZoneTab,
} from "@/components/super-admin/settings";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin - Settings Page
   Platform configuration with database persistence
   ═══════════════════════════════════════════════════════════════════════════ */

type TabId =
  | "general"
  | "features"
  | "limits"
  | "security"
  | "email"
  | "storage"
  | "integrations"
  | "danger";

const TABS: { id: TabId; label: string; icon: string }[] = [
  {
    id: "general",
    label: "General",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  },
  {
    id: "features",
    label: "Features",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
  {
    id: "limits",
    label: "Limits",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
  {
    id: "security",
    label: "Security",
    icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  },
  {
    id: "email",
    label: "Email",
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  },
  {
    id: "storage",
    label: "Storage",
    icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4",
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
  },
  {
    id: "danger",
    label: "Danger Zone",
    icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);
  const [originalSettings, setOriginalSettings] =
    useState<PlatformSettings>(DEFAULT_SETTINGS);

  // Integration health state
  const [integrations, setIntegrations] = useState<IntegrationsHealth | null>(
    null
  );
  const [environment, setEnvironment] = useState<Record<
    string,
    { configured: boolean; masked: string }
  > | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // Danger zone action states
  const [clearingCache, setClearingCache] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [exportingAuditLog, setExportingAuditLog] = useState(false);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/super-admin/settings");
      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }
      const data = await response.json();
      setSettings(data.settings);
      setOriginalSettings(data.settings);
      setError(null);
    } catch (err) {
      console.error("Error fetching settings:", err);
      setError("Failed to load settings. Using defaults.");
    } finally {
      setLoading(false);
    }
  };

  // Check for changes
  useEffect(() => {
    const changed =
      JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(changed);
  }, [settings, originalSettings]);

  // Update settings for a category
  const updateCategory = useCallback(
    <T extends SettingsCategory>(
      category: T,
      newSettings: PlatformSettings[T]
    ) => {
      setSettings((prev) => ({
        ...prev,
        [category]: newSettings,
      }));
    },
    []
  );

  // Save changes
  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Find which categories have changed
      const changedCategories: SettingsCategory[] = [];
      for (const category of Object.keys(settings) as SettingsCategory[]) {
        if (
          JSON.stringify(settings[category]) !==
          JSON.stringify(originalSettings[category])
        ) {
          changedCategories.push(category);
        }
      }

      // Save each changed category
      for (const category of changedCategories) {
        const response = await fetch("/api/super-admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category,
            settings: settings[category],
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || `Failed to save ${category} settings`);
        }
      }

      setOriginalSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Fetch integration health
  const fetchHealth = async () => {
    setHealthLoading(true);
    try {
      const response = await fetch("/api/super-admin/settings/health");
      if (!response.ok) {
        throw new Error("Failed to fetch health status");
      }
      const data = await response.json();
      setIntegrations(data.integrations);
      setEnvironment(data.environment);
    } catch (err) {
      console.error("Error fetching health:", err);
    } finally {
      setHealthLoading(false);
    }
  };

  // Danger zone actions (placeholders - implement as needed)
  const handleClearCache = async () => {
    setClearingCache(true);
    // TODO: Implement cache clearing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setClearingCache(false);
  };

  const handleExportData = async () => {
    setExportingData(true);
    // TODO: Implement data export
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setExportingData(false);
  };

  const handleExportAuditLog = async () => {
    setExportingAuditLog(true);
    // TODO: Implement audit log export
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setExportingAuditLog(false);
  };

  const handleResetPlatform = async () => {
    // TODO: Implement platform reset (with extreme caution)
    console.warn("Platform reset requested - not implemented for safety");
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6 animate-spin text-[var(--electric-lime)]"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-[var(--text-muted)]">Loading settings...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Settings
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Platform configuration and environment settings
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-xs text-[var(--warning)]">
              Unsaved changes
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="btn-primary text-sm disabled:opacity-50"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Saving...
              </span>
            ) : saved ? (
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Saved!
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Save Changes
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/20">
          <p className="text-sm text-[var(--error)]">{error}</p>
        </div>
      )}

      <div className="flex gap-8">
        {/* Sidebar Tabs */}
        <div className="w-56 shrink-0">
          <nav className="space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                  activeTab === tab.id
                    ? tab.id === "danger"
                      ? "bg-[var(--error)]/10 text-[var(--error)]"
                      : "bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]"
                    : tab.id === "danger"
                    ? "text-[var(--error)] hover:bg-[var(--error)]/5"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)]"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={tab.icon}
                  />
                </svg>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === "general" && (
            <GeneralTab
              settings={settings.general}
              onChange={(s) => updateCategory("general", s)}
            />
          )}

          {activeTab === "features" && (
            <FeaturesTab
              settings={settings.features}
              onChange={(s) => updateCategory("features", s)}
            />
          )}

          {activeTab === "limits" && (
            <LimitsTab
              settings={settings.limits}
              onChange={(s) => updateCategory("limits", s)}
            />
          )}

          {activeTab === "security" && (
            <SecurityTab
              settings={settings.security}
              onChange={(s) => updateCategory("security", s)}
            />
          )}

          {activeTab === "email" && (
            <EmailTab
              settings={settings.email}
              onChange={(s) => updateCategory("email", s)}
            />
          )}

          {activeTab === "storage" && (
            <StorageTab
              settings={settings.storage}
              onChange={(s) => updateCategory("storage", s)}
            />
          )}

          {activeTab === "integrations" && (
            <IntegrationsTab
              integrations={integrations}
              environment={environment}
              onRefresh={fetchHealth}
              loading={healthLoading}
            />
          )}

          {activeTab === "danger" && (
            <DangerZoneTab
              maintenance={settings.maintenance}
              onMaintenanceChange={(s) => updateCategory("maintenance", s)}
              onClearCache={handleClearCache}
              onExportData={handleExportData}
              onExportAuditLog={handleExportAuditLog}
              onResetPlatform={handleResetPlatform}
              clearingCache={clearingCache}
              exportingData={exportingData}
              exportingAuditLog={exportingAuditLog}
            />
          )}
        </div>
      </div>
    </div>
  );
}
