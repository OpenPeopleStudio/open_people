"use client";

import { useState } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin - Settings Page
   Platform configuration and environment settings
   ═══════════════════════════════════════════════════════════════════════════ */

type PlatformSettings = {
  general: {
    platformName: string;
    supportEmail: string;
    defaultPlan: string;
    trialDays: number;
  };
  features: {
    signupsEnabled: boolean;
    maintenanceMode: boolean;
    aiServicesEnabled: boolean;
    customDomainsEnabled: boolean;
  };
  limits: {
    maxTenantsPerAccount: number;
    maxUsersPerTenant: number;
    maxStorageGbFree: number;
    maxAiCallsFree: number;
  };
  integrations: {
    stripeConnected: boolean;
    supabaseConnected: boolean;
    openaiConnected: boolean;
    resendConnected: boolean;
  };
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<
    "general" | "features" | "limits" | "integrations" | "danger"
  >("general");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState<PlatformSettings>({
    general: {
      platformName: "OpenPeople.ai",
      supportEmail: "support@openpeople.ai",
      defaultPlan: "starter",
      trialDays: 14,
    },
    features: {
      signupsEnabled: true,
      maintenanceMode: false,
      aiServicesEnabled: true,
      customDomainsEnabled: true,
    },
    limits: {
      maxTenantsPerAccount: 5,
      maxUsersPerTenant: 100,
      maxStorageGbFree: 1,
      maxAiCallsFree: 100,
    },
    integrations: {
      stripeConnected: true,
      supabaseConnected: true,
      openaiConnected: true,
      resendConnected: false,
    },
  });

  const handleSave = async () => {
    setSaving(true);
    // In production, this would save to database
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { id: "general" as const, label: "General", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
    { id: "features" as const, label: "Features", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
    { id: "limits" as const, label: "Limits", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    { id: "integrations" as const, label: "Integrations", icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" },
    { id: "danger" as const, label: "Danger Zone", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
  ];

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
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary text-sm disabled:opacity-50"
        >
          {saving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </>
          ) : saved ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Saved!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Save Changes
            </>
          )}
        </button>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Tabs */}
        <div className="w-56 shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                  activeTab === tab.id
                    ? "bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)]"
                } ${tab.id === "danger" ? "text-[var(--error)] hover:text-[var(--error)]" : ""}`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* General Settings */}
          {activeTab === "general" && (
            <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
                General Settings
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Platform Name
                  </label>
                  <input
                    type="text"
                    value={settings.general.platformName}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        general: { ...s.general, platformName: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={settings.general.supportEmail}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        general: { ...s.general, supportEmail: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Default Plan
                    </label>
                    <select
                      value={settings.general.defaultPlan}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          general: { ...s.general, defaultPlan: e.target.value },
                        }))
                      }
                      className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                    >
                      <option value="free">Free</option>
                      <option value="starter">Starter</option>
                      <option value="pro">Pro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Trial Period (days)
                    </label>
                    <input
                      type="number"
                      value={settings.general.trialDays}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          general: { ...s.general, trialDays: parseInt(e.target.value) || 0 },
                        }))
                      }
                      className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Features */}
          {activeTab === "features" && (
            <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
                Feature Flags
              </h2>
              <div className="space-y-4">
                {[
                  { key: "signupsEnabled" as const, label: "New Signups", description: "Allow new users to sign up for accounts" },
                  { key: "maintenanceMode" as const, label: "Maintenance Mode", description: "Show maintenance page to all users" },
                  { key: "aiServicesEnabled" as const, label: "AI Services", description: "Enable AI-powered features platform-wide" },
                  { key: "customDomainsEnabled" as const, label: "Custom Domains", description: "Allow tenants to use custom domains" },
                ].map((feature) => (
                  <div
                    key={feature.key}
                    className="flex items-center justify-between p-4 rounded-lg bg-[var(--surface-2)]"
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {feature.label}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {feature.description}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setSettings((s) => ({
                          ...s,
                          features: {
                            ...s.features,
                            [feature.key]: !s.features[feature.key],
                          },
                        }))
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings.features[feature.key]
                          ? "bg-[var(--electric-lime)]"
                          : "bg-[var(--surface-3)]"
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          settings.features[feature.key] ? "translate-x-6" : ""
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Limits */}
          {activeTab === "limits" && (
            <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
                Platform Limits
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Max Tenants per Account
                  </label>
                  <input
                    type="number"
                    value={settings.limits.maxTenantsPerAccount}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        limits: { ...s.limits, maxTenantsPerAccount: parseInt(e.target.value) || 0 },
                      }))
                    }
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Max Users per Tenant
                  </label>
                  <input
                    type="number"
                    value={settings.limits.maxUsersPerTenant}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        limits: { ...s.limits, maxUsersPerTenant: parseInt(e.target.value) || 0 },
                      }))
                    }
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Free Plan Storage (GB)
                  </label>
                  <input
                    type="number"
                    value={settings.limits.maxStorageGbFree}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        limits: { ...s.limits, maxStorageGbFree: parseInt(e.target.value) || 0 },
                      }))
                    }
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Free Plan AI Calls/Month
                  </label>
                  <input
                    type="number"
                    value={settings.limits.maxAiCallsFree}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        limits: { ...s.limits, maxAiCallsFree: parseInt(e.target.value) || 0 },
                      }))
                    }
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Integrations */}
          {activeTab === "integrations" && (
            <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
                Integrations
              </h2>
              <div className="space-y-4">
                {[
                  { key: "stripeConnected" as const, name: "Stripe", description: "Payment processing", url: "https://dashboard.stripe.com" },
                  { key: "supabaseConnected" as const, name: "Supabase", description: "Database & Auth", url: "https://supabase.com/dashboard" },
                  { key: "openaiConnected" as const, name: "OpenAI", description: "AI Services", url: "https://platform.openai.com" },
                  { key: "resendConnected" as const, name: "Resend", description: "Email delivery", url: "https://resend.com/emails" },
                ].map((integration) => (
                  <div
                    key={integration.key}
                    className="flex items-center justify-between p-4 rounded-lg bg-[var(--surface-2)]"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          settings.integrations[integration.key]
                            ? "bg-[var(--success)]/10"
                            : "bg-[var(--surface-3)]"
                        }`}
                      >
                        {settings.integrations[integration.key] ? (
                          <svg
                            className="w-5 h-5 text-[var(--success)]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5 text-[var(--text-muted)]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {integration.name}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {integration.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          settings.integrations[integration.key]
                            ? "bg-[var(--success)]/10 text-[var(--success)]"
                            : "bg-[var(--surface-3)] text-[var(--text-muted)]"
                        }`}
                      >
                        {settings.integrations[integration.key] ? "Connected" : "Not connected"}
                      </span>
                      <a
                        href={integration.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                          />
                        </svg>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Danger Zone */}
          {activeTab === "danger" && (
            <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--error)]/30 p-6">
              <h2 className="text-lg font-semibold text-[var(--error)] mb-6">
                Danger Zone
              </h2>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        Clear All Cache
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        Clear all cached data across the platform. This may temporarily slow down the application.
                      </p>
                    </div>
                    <button className="px-4 py-2 rounded-lg bg-[var(--surface-3)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                      Clear Cache
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        Export All Data
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        Download a complete backup of all platform data in JSON format.
                      </p>
                    </div>
                    <button className="px-4 py-2 rounded-lg bg-[var(--surface-3)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                      Export Data
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[var(--error)]/5 border border-[var(--error)]/20">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--error)]">
                        Reset Platform
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        Delete all tenants, users, and data. This action cannot be undone.
                      </p>
                    </div>
                    <button className="px-4 py-2 rounded-lg bg-[var(--error)] text-sm font-medium text-white hover:opacity-90 transition-opacity">
                      Reset Platform
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
