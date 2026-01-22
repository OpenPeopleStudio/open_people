"use client";

import { useState } from "react";
import { MaintenanceSettings } from "@/types/platform-settings";
import {
  SettingsTabWrapper,
  TextInput,
  Toggle,
  TagInput,
} from "./SettingsTabWrapper";

/* ═══════════════════════════════════════════════════════════════════════════
   Danger Zone Tab
   Maintenance mode, cache clearing, data export, platform reset
   ═══════════════════════════════════════════════════════════════════════════ */

type Props = {
  maintenance: MaintenanceSettings;
  onMaintenanceChange: (settings: MaintenanceSettings) => void;
  onClearCache: () => void;
  onExportData: () => void;
  onExportAuditLog: () => void;
  onResetPlatform: () => void;
  clearingCache: boolean;
  exportingData: boolean;
  exportingAuditLog: boolean;
};

function ConfirmDialog({
  open,
  title,
  message,
  confirmText,
  confirmPhrase,
  onConfirm,
  onCancel,
  variant = "danger",
}: {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  confirmPhrase?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning";
}) {
  const [inputValue, setInputValue] = useState("");

  if (!open) return null;

  const canConfirm = confirmPhrase
    ? inputValue === confirmPhrase
    : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />
      <div className="relative bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
        <h3
          className={`text-lg font-semibold mb-2 ${
            variant === "danger"
              ? "text-[var(--error)]"
              : "text-[var(--warning)]"
          }`}
        >
          {title}
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mb-4">{message}</p>

        {confirmPhrase && (
          <div className="mb-4">
            <p className="text-sm text-[var(--text-muted)] mb-2">
              Type <code className="px-1 py-0.5 rounded bg-[var(--surface-3)] text-[var(--error)]">{confirmPhrase}</code> to confirm:
            </p>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--error)]"
              placeholder={confirmPhrase}
            />
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              setInputValue("");
            }}
            disabled={!canConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-50 ${
              variant === "danger"
                ? "bg-[var(--error)] hover:opacity-90"
                : "bg-[var(--warning)] hover:opacity-90"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function DangerAction({
  title,
  description,
  buttonText,
  onClick,
  loading,
  variant = "default",
}: {
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
  loading?: boolean;
  variant?: "default" | "danger";
}) {
  return (
    <div
      className={`p-4 rounded-lg border ${
        variant === "danger"
          ? "bg-[var(--error)]/5 border-[var(--error)]/20"
          : "bg-[var(--surface-2)] border-[var(--border-subtle)]"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className={`text-sm font-medium ${
              variant === "danger"
                ? "text-[var(--error)]"
                : "text-[var(--text-primary)]"
            }`}
          >
            {title}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>
        </div>
        <button
          onClick={onClick}
          disabled={loading}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
            variant === "danger"
              ? "bg-[var(--error)] text-white hover:opacity-90"
              : "bg-[var(--surface-3)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          {loading ? (
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
              Processing...
            </span>
          ) : (
            buttonText
          )}
        </button>
      </div>
    </div>
  );
}

export function DangerZoneTab({
  maintenance,
  onMaintenanceChange,
  onClearCache,
  onExportData,
  onExportAuditLog,
  onResetPlatform,
  clearingCache,
  exportingData,
  exportingAuditLog,
}: Props) {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: "cache" | "export" | "audit" | "reset";
  }>({ open: false, action: "cache" });

  const updateMaintenance = <K extends keyof MaintenanceSettings>(
    key: K,
    value: MaintenanceSettings[K]
  ) => {
    onMaintenanceChange({ ...maintenance, [key]: value });
  };

  const handleConfirm = () => {
    switch (confirmDialog.action) {
      case "cache":
        onClearCache();
        break;
      case "export":
        onExportData();
        break;
      case "audit":
        onExportAuditLog();
        break;
      case "reset":
        onResetPlatform();
        break;
    }
    setConfirmDialog({ open: false, action: "cache" });
  };

  const dialogConfig = {
    cache: {
      title: "Clear All Cache",
      message:
        "This will clear all cached data across the platform. This may temporarily slow down the application while caches are rebuilt.",
      confirmText: "Clear Cache",
      variant: "warning" as const,
    },
    export: {
      title: "Export All Data",
      message:
        "This will generate a complete backup of all platform data in JSON format. This may take several minutes for large datasets.",
      confirmText: "Start Export",
      variant: "warning" as const,
    },
    audit: {
      title: "Export Audit Log",
      message:
        "This will export the complete settings audit log as a JSON file.",
      confirmText: "Export Log",
      variant: "warning" as const,
    },
    reset: {
      title: "Reset Platform",
      message:
        "This will permanently delete all tenants, users, and data. This action cannot be undone. All data will be lost forever.",
      confirmText: "Reset Platform",
      confirmPhrase: "RESET-PLATFORM",
      variant: "danger" as const,
    },
  };

  const currentDialog = dialogConfig[confirmDialog.action];

  return (
    <>
      <SettingsTabWrapper
        title="Danger Zone"
        description="Critical platform operations - proceed with caution"
        variant="danger"
      >
        <div className="space-y-8">
          {/* Maintenance Mode */}
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">
              Maintenance Mode
            </h3>
            <div className="space-y-4">
              <Toggle
                label="Enable Maintenance Mode"
                description="Show maintenance page to all users"
                checked={maintenance.enabled}
                onChange={(v) => updateMaintenance("enabled", v)}
              />

              {maintenance.enabled && (
                <>
                  <div className="p-3 rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/20">
                    <p className="text-xs text-[var(--warning)]">
                      Maintenance mode is active. Users will see the maintenance message.
                    </p>
                  </div>

                  <TextInput
                    label="Maintenance Message"
                    value={maintenance.message}
                    onChange={(v) => updateMaintenance("message", v)}
                    description="Message displayed to users during maintenance"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                        Scheduled Start
                      </label>
                      <input
                        type="datetime-local"
                        value={maintenance.scheduledStart || ""}
                        onChange={(e) =>
                          updateMaintenance(
                            "scheduledStart",
                            e.target.value || null
                          )
                        }
                        className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                      />
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        Optional - leave empty for immediate
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                        Scheduled End
                      </label>
                      <input
                        type="datetime-local"
                        value={maintenance.scheduledEnd || ""}
                        onChange={(e) =>
                          updateMaintenance(
                            "scheduledEnd",
                            e.target.value || null
                          )
                        }
                        className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                      />
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        Optional - leave empty for indefinite
                      </p>
                    </div>
                  </div>

                  <TagInput
                    label="Bypass Emails"
                    description="Email addresses that can bypass maintenance mode"
                    values={maintenance.bypassEmails}
                    onChange={(v) => updateMaintenance("bypassEmails", v)}
                    placeholder="Add email and press Enter"
                  />
                </>
              )}
            </div>
          </div>

          {/* Dangerous Actions */}
          <div className="pt-4 border-t border-[var(--border-subtle)]">
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">
              Platform Actions
            </h3>
            <div className="space-y-4">
              <DangerAction
                title="Clear All Cache"
                description="Clear all cached data across the platform. May temporarily slow down the application."
                buttonText="Clear Cache"
                onClick={() =>
                  setConfirmDialog({ open: true, action: "cache" })
                }
                loading={clearingCache}
              />

              <DangerAction
                title="Export All Data"
                description="Download a complete backup of all platform data in JSON format."
                buttonText="Export Data"
                onClick={() =>
                  setConfirmDialog({ open: true, action: "export" })
                }
                loading={exportingData}
              />

              <DangerAction
                title="Export Audit Log"
                description="Download the complete settings audit log for compliance and review."
                buttonText="Export Log"
                onClick={() =>
                  setConfirmDialog({ open: true, action: "audit" })
                }
                loading={exportingAuditLog}
              />

              <DangerAction
                title="Reset Platform"
                description="Delete all tenants, users, and data. This action cannot be undone."
                buttonText="Reset Platform"
                onClick={() =>
                  setConfirmDialog({ open: true, action: "reset" })
                }
                variant="danger"
              />
            </div>
          </div>
        </div>
      </SettingsTabWrapper>

      <ConfirmDialog
        open={confirmDialog.open}
        title={currentDialog.title}
        message={currentDialog.message}
        confirmText={currentDialog.confirmText}
        {...(confirmDialog.action === "reset"
          ? { confirmPhrase: "RESET-PLATFORM" }
          : {})}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmDialog({ open: false, action: "cache" })}
        variant={currentDialog.variant}
      />
    </>
  );
}
