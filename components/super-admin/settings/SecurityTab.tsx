"use client";

import { SecuritySettings } from "@/types/platform-settings";
import {
  SettingsTabWrapper,
  NumberInput,
  Toggle,
  TagInput,
} from "./SettingsTabWrapper";

/* ═══════════════════════════════════════════════════════════════════════════
   Security Settings Tab
   Password policies, session management, 2FA, IP restrictions
   ═══════════════════════════════════════════════════════════════════════════ */

type Props = {
  settings: SecuritySettings;
  onChange: (settings: SecuritySettings) => void;
};

export function SecurityTab({ settings, onChange }: Props) {
  const update = <K extends keyof SecuritySettings>(
    key: K,
    value: SecuritySettings[K]
  ) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <SettingsTabWrapper
      title="Security Settings"
      description="Configure password policies, session management, and access controls"
    >
      <div className="space-y-8">
        {/* Password Policy */}
        <div>
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">
            Password Policy
          </h3>
          <div className="space-y-4">
            <NumberInput
              label="Minimum Password Length"
              value={settings.minPasswordLength}
              onChange={(v) => update("minPasswordLength", v)}
              min={6}
              max={32}
              description="Minimum characters required (6-32)"
            />
            <div className="grid grid-cols-2 gap-4">
              <Toggle
                label="Require Uppercase"
                description="At least one uppercase letter"
                checked={settings.requireUppercase}
                onChange={(v) => update("requireUppercase", v)}
              />
              <Toggle
                label="Require Lowercase"
                description="At least one lowercase letter"
                checked={settings.requireLowercase}
                onChange={(v) => update("requireLowercase", v)}
              />
              <Toggle
                label="Require Numbers"
                description="At least one numeric digit"
                checked={settings.requireNumbers}
                onChange={(v) => update("requireNumbers", v)}
              />
              <Toggle
                label="Require Special Characters"
                description="At least one special character (!@#$...)"
                checked={settings.requireSpecialChars}
                onChange={(v) => update("requireSpecialChars", v)}
              />
            </div>
          </div>
        </div>

        {/* Session Management */}
        <div>
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">
            Session Management
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="Session Timeout (minutes)"
              value={settings.sessionTimeoutMinutes}
              onChange={(v) => update("sessionTimeoutMinutes", v)}
              min={5}
              max={43200}
              description="Auto-logout after inactivity (1440 = 24 hours)"
            />
            <NumberInput
              label="Max Failed Login Attempts"
              value={settings.maxFailedLoginAttempts}
              onChange={(v) => update("maxFailedLoginAttempts", v)}
              min={1}
              max={20}
              description="Account lockout threshold"
            />
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div>
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">
            Two-Factor Authentication
          </h3>
          <Toggle
            label="Enforce 2FA for Admins"
            description="Require two-factor authentication for all admin users"
            checked={settings.enforce2faAdmins}
            onChange={(v) => update("enforce2faAdmins", v)}
          />
        </div>

        {/* IP Restrictions */}
        <div>
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">
            IP Restrictions
          </h3>
          <TagInput
            label="Allowed IP Ranges"
            description="CIDR notation (e.g., 192.168.1.0/24). Leave empty to allow all IPs."
            values={settings.allowedIpRanges}
            onChange={(v) => update("allowedIpRanges", v)}
            placeholder="Add IP range (CIDR format) and press Enter"
          />
          {settings.allowedIpRanges.length === 0 && (
            <div className="mt-2 p-3 rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/20">
              <p className="text-xs text-[var(--warning)]">
                No IP restrictions configured. All IP addresses can access the platform.
              </p>
            </div>
          )}
        </div>
      </div>
    </SettingsTabWrapper>
  );
}
