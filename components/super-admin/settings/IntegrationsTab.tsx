"use client";

import { useState } from "react";
import {
  IntegrationsHealth,
  IntegrationHealth,
  IntegrationStatus,
} from "@/types/platform-settings";
import { SettingsTabWrapper } from "./SettingsTabWrapper";

/* ═══════════════════════════════════════════════════════════════════════════
   Integrations Tab
   Real-time health checks and connection status for external services
   ═══════════════════════════════════════════════════════════════════════════ */

type Props = {
  integrations: IntegrationsHealth | null;
  environment: Record<string, { configured: boolean; masked: string }> | null;
  onRefresh: () => void;
  loading: boolean;
};

function StatusBadge({ status }: { status: IntegrationStatus }) {
  const config = {
    connected: {
      bg: "bg-[var(--success)]/10",
      text: "text-[var(--success)]",
      label: "Connected",
    },
    degraded: {
      bg: "bg-[var(--warning)]/10",
      text: "text-[var(--warning)]",
      label: "Degraded",
    },
    disconnected: {
      bg: "bg-[var(--error)]/10",
      text: "text-[var(--error)]",
      label: "Disconnected",
    },
    unknown: {
      bg: "bg-[var(--surface-3)]",
      text: "text-[var(--text-muted)]",
      label: "Unknown",
    },
  };

  const c = config[status];

  return (
    <span className={`text-xs px-2 py-1 rounded ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

function IntegrationCard({ integration }: { integration: IntegrationHealth }) {
  const statusIcon =
    integration.status === "connected" ? (
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
        className="w-5 h-5 text-[var(--error)]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    );

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--surface-2)]">
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            integration.status === "connected"
              ? "bg-[var(--success)]/10"
              : "bg-[var(--surface-3)]"
          }`}
        >
          {statusIcon}
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {integration.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {integration.responseTimeMs !== null && (
              <span className="text-xs text-[var(--text-muted)]">
                {integration.responseTimeMs}ms
              </span>
            )}
            {integration.lastChecked && (
              <span className="text-xs text-[var(--text-muted)]">
                Checked {new Date(integration.lastChecked).toLocaleTimeString()}
              </span>
            )}
          </div>
          {integration.error && (
            <p className="text-xs text-[var(--error)] mt-1">
              {integration.error}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge status={integration.status} />
        <a
          href={integration.dashboardUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-colors"
          title="Open dashboard"
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
  );
}

function EnvVarStatus({
  envVars,
}: {
  envVars: Record<string, { configured: boolean; masked: string }>;
}) {
  const groups = {
    Supabase: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    Stripe: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
    OpenAI: ["OPENAI_API_KEY"],
    Email: ["RESEND_API_KEY"],
    Storage: [
      "CLOUDFLARE_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET_NAME",
    ],
    Domain: ["NEXT_PUBLIC_ROOT_DOMAIN", "SUPER_ADMIN_DOMAIN"],
    Encryption: ["API_KEYS_ENCRYPTION_KEY", "EMAIL_ENCRYPTION_KEY"],
  };

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([group, keys]) => (
        <div key={group}>
          <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
            {group}
          </h4>
          <div className="space-y-2">
            {keys.map((key) => {
              const status = envVars[key];
              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)]"
                >
                  <code className="text-xs text-[var(--text-secondary)]">
                    {key}
                  </code>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs ${
                        status?.configured
                          ? "text-[var(--text-muted)]"
                          : "text-[var(--error)]"
                      }`}
                    >
                      {status?.masked || "Not configured"}
                    </span>
                    {status?.configured ? (
                      <svg
                        className="w-4 h-4 text-[var(--success)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 text-[var(--error)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function IntegrationsTab({
  integrations,
  environment,
  onRefresh,
  loading,
}: Props) {
  const [showEnvVars, setShowEnvVars] = useState(false);

  return (
    <SettingsTabWrapper
      title="Integrations"
      description="Connection status and health checks for external services"
    >
      <div className="space-y-6">
        {/* Refresh Button */}
        <div className="flex justify-end">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-2)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-colors disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {loading ? "Checking..." : "Refresh Health"}
          </button>
        </div>

        {/* Integration Cards */}
        {integrations ? (
          <div className="space-y-4">
            <IntegrationCard integration={integrations.supabase} />
            <IntegrationCard integration={integrations.stripe} />
            <IntegrationCard integration={integrations.openai} />
            <IntegrationCard integration={integrations.resend} />
            <IntegrationCard integration={integrations.storage} />
          </div>
        ) : (
          <div className="p-8 text-center text-[var(--text-muted)]">
            <p>Click Refresh Health to check integration status</p>
          </div>
        )}

        {/* Environment Variables Toggle */}
        <div className="pt-4 border-t border-[var(--border-subtle)]">
          <button
            onClick={() => setShowEnvVars(!showEnvVars)}
            className="flex items-center justify-between w-full p-4 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Environment Variables
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                View configured environment variables (read-only)
              </p>
            </div>
            <svg
              className={`w-5 h-5 text-[var(--text-muted)] transition-transform ${
                showEnvVars ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showEnvVars && environment && (
            <div className="mt-4">
              <EnvVarStatus envVars={environment} />
            </div>
          )}
        </div>
      </div>
    </SettingsTabWrapper>
  );
}
