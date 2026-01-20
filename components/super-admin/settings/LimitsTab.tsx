"use client";

import { LimitSettings } from "@/types/platform-settings";
import { SettingsTabWrapper, NumberInput } from "./SettingsTabWrapper";

/* ═══════════════════════════════════════════════════════════════════════════
   Limits Settings Tab
   Platform quotas and rate limiting configuration
   ═══════════════════════════════════════════════════════════════════════════ */

type Props = {
  settings: LimitSettings;
  onChange: (settings: LimitSettings) => void;
};

export function LimitsTab({ settings, onChange }: Props) {
  const update = <K extends keyof LimitSettings>(
    key: K,
    value: LimitSettings[K]
  ) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <SettingsTabWrapper
      title="Platform Limits"
      description="Configure quotas and rate limits for the platform"
    >
      <div className="space-y-8">
        {/* Tenant Limits */}
        <div>
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">
            Tenant Limits
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="Max Tenants per Account"
              value={settings.maxTenantsPerAccount}
              onChange={(v) => update("maxTenantsPerAccount", v)}
              min={1}
              max={100}
              description="Maximum number of tenants a single account can own"
            />
            <NumberInput
              label="Max Users per Tenant"
              value={settings.maxUsersPerTenant}
              onChange={(v) => update("maxUsersPerTenant", v)}
              min={1}
              max={10000}
              description="Maximum team members per tenant"
            />
          </div>
        </div>

        {/* Free Plan Limits */}
        <div>
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">
            Free Plan Limits
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="Storage (GB)"
              value={settings.maxStorageGbFree}
              onChange={(v) => update("maxStorageGbFree", v)}
              min={0}
              max={100}
              description="Storage quota for free tier"
            />
            <NumberInput
              label="AI Calls per Month"
              value={settings.maxAiCallsFree}
              onChange={(v) => update("maxAiCallsFree", v)}
              min={0}
              max={10000}
              description="Monthly AI API calls for free tier"
            />
          </div>
        </div>

        {/* Rate Limits */}
        <div>
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">
            Rate Limits
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="API Rate Limit (req/min)"
              value={settings.apiRateLimitPerMinute}
              onChange={(v) => update("apiRateLimitPerMinute", v)}
              min={1}
              max={1000}
              description="Maximum API requests per minute"
            />
            <NumberInput
              label="Max File Upload (MB)"
              value={settings.maxFileUploadMb}
              onChange={(v) => update("maxFileUploadMb", v)}
              min={1}
              max={500}
              description="Maximum file upload size"
            />
          </div>
        </div>

        {/* Webhook Limits */}
        <div>
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">
            Webhook Configuration
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="Max Webhook Retries"
              value={settings.maxWebhookRetries}
              onChange={(v) => update("maxWebhookRetries", v)}
              min={0}
              max={10}
              description="Number of retry attempts for failed webhooks"
            />
          </div>
        </div>
      </div>
    </SettingsTabWrapper>
  );
}
