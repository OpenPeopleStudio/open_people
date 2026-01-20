"use client";

import { GeneralSettings } from "@/types/platform-settings";
import {
  SettingsTabWrapper,
  TextInput,
  NumberInput,
  SelectInput,
} from "./SettingsTabWrapper";

/* ═══════════════════════════════════════════════════════════════════════════
   General Settings Tab
   Platform name, support email, default plan, trial period, root domain
   ═══════════════════════════════════════════════════════════════════════════ */

type Props = {
  settings: GeneralSettings;
  onChange: (settings: GeneralSettings) => void;
};

export function GeneralTab({ settings, onChange }: Props) {
  const update = <K extends keyof GeneralSettings>(
    key: K,
    value: GeneralSettings[K]
  ) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <SettingsTabWrapper
      title="General Settings"
      description="Core platform configuration and branding"
    >
      <div className="space-y-6">
        <TextInput
          label="Platform Name"
          value={settings.platformName}
          onChange={(v) => update("platformName", v)}
          description="The name displayed throughout the platform"
        />

        <TextInput
          label="Support Email"
          type="email"
          value={settings.supportEmail}
          onChange={(v) => update("supportEmail", v)}
          description="Contact email for support inquiries"
        />

        <TextInput
          label="Root Domain"
          value={settings.rootDomain}
          onChange={(v) => update("rootDomain", v)}
          description="Primary domain for the platform"
        />

        <div className="grid grid-cols-2 gap-4">
          <SelectInput
            label="Default Plan"
            value={settings.defaultPlan}
            onChange={(v) =>
              update("defaultPlan", v as GeneralSettings["defaultPlan"])
            }
            options={[
              { value: "free", label: "Free" },
              { value: "starter", label: "Starter" },
              { value: "pro", label: "Pro" },
              { value: "enterprise", label: "Enterprise" },
            ]}
            description="Default plan for new tenants"
          />

          <NumberInput
            label="Trial Period (days)"
            value={settings.trialDays}
            onChange={(v) => update("trialDays", v)}
            min={0}
            max={90}
            description="Days in trial before billing starts"
          />
        </div>
      </div>
    </SettingsTabWrapper>
  );
}
