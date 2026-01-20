"use client";

import { StorageSettings, StorageProvider } from "@/types/platform-settings";
import {
  SettingsTabWrapper,
  TextInput,
  NumberInput,
  SelectInput,
  TagInput,
} from "./SettingsTabWrapper";

/* ═══════════════════════════════════════════════════════════════════════════
   Storage Settings Tab
   Cloud storage provider configuration, file limits, retention
   ═══════════════════════════════════════════════════════════════════════════ */

type Props = {
  settings: StorageSettings;
  onChange: (settings: StorageSettings) => void;
};

export function StorageTab({ settings, onChange }: Props) {
  const update = <K extends keyof StorageSettings>(
    key: K,
    value: StorageSettings[K]
  ) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <SettingsTabWrapper
      title="Storage Configuration"
      description="Configure cloud storage settings and file handling"
    >
      <div className="space-y-8">
        {/* Provider Selection */}
        <div>
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">
            Storage Provider
          </h3>
          <SelectInput
            label="Provider"
            value={settings.provider}
            onChange={(v) => update("provider", v as StorageProvider)}
            options={[
              { value: "r2", label: "Cloudflare R2" },
              { value: "s3", label: "Amazon S3" },
              { value: "local", label: "Local Storage" },
            ]}
            description="Primary storage backend for file uploads"
          />
        </div>

        {/* File Limits */}
        <div>
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">
            File Limits
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="Max File Size (MB)"
              value={settings.maxFileSizeMb}
              onChange={(v) => update("maxFileSizeMb", v)}
              min={1}
              max={5000}
              description="Maximum size for individual file uploads"
            />
            <NumberInput
              label="Retention Period (days)"
              value={settings.retentionDays}
              onChange={(v) => update("retentionDays", v)}
              min={0}
              max={3650}
              description="Days to keep files (0 = forever)"
            />
          </div>
        </div>

        {/* Allowed Extensions */}
        <div>
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">
            Allowed File Types
          </h3>
          <TagInput
            label="Allowed Extensions"
            description="File extensions that can be uploaded (without dot)"
            values={settings.allowedExtensions}
            onChange={(v) => update("allowedExtensions", v)}
            placeholder="Add extension (e.g., pdf, jpg) and press Enter"
          />
          {settings.allowedExtensions.length === 0 && (
            <div className="mt-2 p-3 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/20">
              <p className="text-xs text-[var(--error)]">
                No file extensions allowed. Users will not be able to upload any files.
              </p>
            </div>
          )}
        </div>

        {/* Public URL */}
        <div>
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">
            Public Access
          </h3>
          <TextInput
            label="Public URL Pattern"
            value={settings.publicUrlPattern}
            onChange={(v) => update("publicUrlPattern", v)}
            placeholder="https://cdn.example.com/{bucket}/{key}"
            description="URL pattern for publicly accessible files (leave empty for signed URLs only)"
          />
        </div>
      </div>
    </SettingsTabWrapper>
  );
}
