"use client";

import { FeatureSettings } from "@/types/platform-settings";
import { SettingsTabWrapper, Toggle } from "./SettingsTabWrapper";

/* ═══════════════════════════════════════════════════════════════════════════
   Features Settings Tab
   Platform-wide feature flags and toggles
   ═══════════════════════════════════════════════════════════════════════════ */

type Props = {
  settings: FeatureSettings;
  onChange: (settings: FeatureSettings) => void;
};

const FEATURE_CONFIG = [
  {
    key: "signupsEnabled" as const,
    label: "New Signups",
    description: "Allow new users to sign up for accounts",
  },
  {
    key: "aiServicesEnabled" as const,
    label: "AI Services",
    description: "Enable AI-powered features platform-wide",
  },
  {
    key: "customDomainsEnabled" as const,
    label: "Custom Domains",
    description: "Allow tenants to use custom domains",
  },
  {
    key: "apiAccessEnabled" as const,
    label: "API Access",
    description: "Allow tenants to access the API",
  },
  {
    key: "webhooksEnabled" as const,
    label: "Webhooks",
    description: "Enable webhook functionality for tenants",
  },
  {
    key: "ssoEnabled" as const,
    label: "SSO Authentication",
    description: "Enable Single Sign-On for enterprise tenants",
  },
  {
    key: "auditLogsEnabled" as const,
    label: "Audit Logs",
    description: "Enable audit logging for tenant actions",
  },
  {
    key: "analyticsEnabled" as const,
    label: "Analytics",
    description: "Enable analytics features for tenants",
  },
];

export function FeaturesTab({ settings, onChange }: Props) {
  const update = <K extends keyof FeatureSettings>(
    key: K,
    value: FeatureSettings[K]
  ) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <SettingsTabWrapper
      title="Feature Flags"
      description="Enable or disable platform-wide features"
    >
      <div className="space-y-4">
        {FEATURE_CONFIG.map((feature) => (
          <Toggle
            key={feature.key}
            label={feature.label}
            description={feature.description}
            checked={settings[feature.key]}
            onChange={(v) => update(feature.key, v)}
          />
        ))}
      </div>
    </SettingsTabWrapper>
  );
}
