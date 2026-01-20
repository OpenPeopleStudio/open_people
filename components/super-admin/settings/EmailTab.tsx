"use client";

import { EmailSettings, EmailProvider } from "@/types/platform-settings";
import {
  SettingsTabWrapper,
  TextInput,
  NumberInput,
  SelectInput,
  TagInput,
} from "./SettingsTabWrapper";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Settings Tab
   Email provider configuration, rate limits, sender domains
   ═══════════════════════════════════════════════════════════════════════════ */

type Props = {
  settings: EmailSettings;
  onChange: (settings: EmailSettings) => void;
};

export function EmailTab({ settings, onChange }: Props) {
  const update = <K extends keyof EmailSettings>(
    key: K,
    value: EmailSettings[K]
  ) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <SettingsTabWrapper
      title="Email Configuration"
      description="Configure email delivery settings and defaults"
    >
      <div className="space-y-8">
        {/* Provider Selection */}
        <div>
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">
            Email Provider
          </h3>
          <SelectInput
            label="Default Provider"
            value={settings.defaultProvider}
            onChange={(v) => update("defaultProvider", v as EmailProvider)}
            options={[
              { value: "resend", label: "Resend" },
              { value: "sendgrid", label: "SendGrid" },
              { value: "postmark", label: "Postmark" },
              { value: "smtp", label: "Custom SMTP" },
            ]}
            description="Primary email delivery service"
          />
        </div>

        {/* Rate Limits */}
        <div>
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">
            Rate Limits
          </h3>
          <NumberInput
            label="Daily Send Limit per Tenant"
            value={settings.dailySendLimit}
            onChange={(v) => update("dailySendLimit", v)}
            min={0}
            max={100000}
            description="Maximum emails a tenant can send per day (0 = unlimited)"
          />
        </div>

        {/* Default Sender */}
        <div>
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">
            Default Sender
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <TextInput
              label="Default From Name"
              value={settings.defaultFromName}
              onChange={(v) => update("defaultFromName", v)}
              description="Default sender display name"
            />
            <TextInput
              label="Default From Email"
              type="email"
              value={settings.defaultFromEmail}
              onChange={(v) => update("defaultFromEmail", v)}
              description="Default sender email address"
            />
          </div>
        </div>

        {/* Allowed Domains */}
        <div>
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">
            Sender Domain Allowlist
          </h3>
          <TagInput
            label="Allowed Sender Domains"
            description="Domains that can be used as sender addresses"
            values={settings.allowedSenderDomains}
            onChange={(v) => update("allowedSenderDomains", v)}
            placeholder="Add domain (e.g., example.com) and press Enter"
          />
          {settings.allowedSenderDomains.length === 0 && (
            <div className="mt-2 p-3 rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/20">
              <p className="text-xs text-[var(--warning)]">
                No sender domains configured. Email sending may fail without valid sender domains.
              </p>
            </div>
          )}
        </div>
      </div>
    </SettingsTabWrapper>
  );
}
