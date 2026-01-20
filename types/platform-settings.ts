/* ═══════════════════════════════════════════════════════════════════════════
   Platform Settings Types
   Type definitions for super admin platform configuration
   ═══════════════════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────────────────────
// General Settings
// ─────────────────────────────────────────────────────────────────────────────

export type GeneralSettings = {
  platformName: string;
  supportEmail: string;
  defaultPlan: "free" | "starter" | "pro" | "enterprise";
  trialDays: number;
  rootDomain: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Feature Settings
// ─────────────────────────────────────────────────────────────────────────────

export type FeatureSettings = {
  signupsEnabled: boolean;
  aiServicesEnabled: boolean;
  customDomainsEnabled: boolean;
  apiAccessEnabled: boolean;
  webhooksEnabled: boolean;
  ssoEnabled: boolean;
  auditLogsEnabled: boolean;
  analyticsEnabled: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// Limit Settings
// ─────────────────────────────────────────────────────────────────────────────

export type LimitSettings = {
  maxTenantsPerAccount: number;
  maxUsersPerTenant: number;
  maxStorageGbFree: number;
  maxAiCallsFree: number;
  apiRateLimitPerMinute: number;
  maxFileUploadMb: number;
  maxWebhookRetries: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Security Settings
// ─────────────────────────────────────────────────────────────────────────────

export type SecuritySettings = {
  minPasswordLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  sessionTimeoutMinutes: number;
  maxFailedLoginAttempts: number;
  enforce2faAdmins: boolean;
  allowedIpRanges: string[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Email Settings
// ─────────────────────────────────────────────────────────────────────────────

export type EmailProvider = "resend" | "sendgrid" | "smtp" | "postmark";

export type EmailSettings = {
  defaultProvider: EmailProvider;
  dailySendLimit: number;
  defaultFromName: string;
  defaultFromEmail: string;
  allowedSenderDomains: string[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Storage Settings
// ─────────────────────────────────────────────────────────────────────────────

export type StorageProvider = "r2" | "s3" | "local";

export type StorageSettings = {
  provider: StorageProvider;
  maxFileSizeMb: number;
  allowedExtensions: string[];
  retentionDays: number;
  publicUrlPattern: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Maintenance Settings
// ─────────────────────────────────────────────────────────────────────────────

export type MaintenanceSettings = {
  enabled: boolean;
  message: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  bypassEmails: string[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Integration Health
// ─────────────────────────────────────────────────────────────────────────────

export type IntegrationStatus = "connected" | "degraded" | "disconnected" | "unknown";

export type IntegrationHealth = {
  name: string;
  status: IntegrationStatus;
  lastChecked: string | null;
  responseTimeMs: number | null;
  error: string | null;
  dashboardUrl: string;
};

export type IntegrationsHealth = {
  supabase: IntegrationHealth;
  stripe: IntegrationHealth;
  openai: IntegrationHealth;
  resend: IntegrationHealth;
  storage: IntegrationHealth;
};

// ─────────────────────────────────────────────────────────────────────────────
// Combined Platform Settings
// ─────────────────────────────────────────────────────────────────────────────

export type PlatformSettings = {
  general: GeneralSettings;
  features: FeatureSettings;
  limits: LimitSettings;
  security: SecuritySettings;
  email: EmailSettings;
  storage: StorageSettings;
  maintenance: MaintenanceSettings;
};

// ─────────────────────────────────────────────────────────────────────────────
// Settings Categories
// ─────────────────────────────────────────────────────────────────────────────

export type SettingsCategory = keyof PlatformSettings;

export const SETTINGS_CATEGORIES: SettingsCategory[] = [
  "general",
  "features",
  "limits",
  "security",
  "email",
  "storage",
  "maintenance",
];

// ─────────────────────────────────────────────────────────────────────────────
// Default Settings
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS: PlatformSettings = {
  general: {
    platformName: "OpenPeople.ai",
    supportEmail: "support@openpeople.ai",
    defaultPlan: "starter",
    trialDays: 14,
    rootDomain: "openpeople.ai",
  },
  features: {
    signupsEnabled: true,
    aiServicesEnabled: true,
    customDomainsEnabled: true,
    apiAccessEnabled: true,
    webhooksEnabled: true,
    ssoEnabled: false,
    auditLogsEnabled: true,
    analyticsEnabled: true,
  },
  limits: {
    maxTenantsPerAccount: 5,
    maxUsersPerTenant: 100,
    maxStorageGbFree: 1,
    maxAiCallsFree: 100,
    apiRateLimitPerMinute: 60,
    maxFileUploadMb: 50,
    maxWebhookRetries: 3,
  },
  security: {
    minPasswordLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    sessionTimeoutMinutes: 1440,
    maxFailedLoginAttempts: 5,
    enforce2faAdmins: false,
    allowedIpRanges: [],
  },
  email: {
    defaultProvider: "resend",
    dailySendLimit: 1000,
    defaultFromName: "OpenPeople",
    defaultFromEmail: "noreply@openpeople.ai",
    allowedSenderDomains: ["openpeople.ai"],
  },
  storage: {
    provider: "r2",
    maxFileSizeMb: 50,
    allowedExtensions: [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "pdf",
      "doc",
      "docx",
      "xls",
      "xlsx",
      "csv",
      "txt",
      "zip",
    ],
    retentionDays: 365,
    publicUrlPattern: "",
  },
  maintenance: {
    enabled: false,
    message:
      "We are currently performing scheduled maintenance. Please check back soon.",
    scheduledStart: null,
    scheduledEnd: null,
    bypassEmails: [],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Database Key Mapping
// ─────────────────────────────────────────────────────────────────────────────

// Maps TypeScript camelCase keys to database snake_case keys
export const KEY_MAPPINGS: Record<SettingsCategory, Record<string, string>> = {
  general: {
    platformName: "platform_name",
    supportEmail: "support_email",
    defaultPlan: "default_plan",
    trialDays: "trial_days",
    rootDomain: "root_domain",
  },
  features: {
    signupsEnabled: "signups_enabled",
    aiServicesEnabled: "ai_services_enabled",
    customDomainsEnabled: "custom_domains_enabled",
    apiAccessEnabled: "api_access_enabled",
    webhooksEnabled: "webhooks_enabled",
    ssoEnabled: "sso_enabled",
    auditLogsEnabled: "audit_logs_enabled",
    analyticsEnabled: "analytics_enabled",
  },
  limits: {
    maxTenantsPerAccount: "max_tenants_per_account",
    maxUsersPerTenant: "max_users_per_tenant",
    maxStorageGbFree: "max_storage_gb_free",
    maxAiCallsFree: "max_ai_calls_free",
    apiRateLimitPerMinute: "api_rate_limit_per_minute",
    maxFileUploadMb: "max_file_upload_mb",
    maxWebhookRetries: "max_webhook_retries",
  },
  security: {
    minPasswordLength: "min_password_length",
    requireUppercase: "require_uppercase",
    requireLowercase: "require_lowercase",
    requireNumbers: "require_numbers",
    requireSpecialChars: "require_special_chars",
    sessionTimeoutMinutes: "session_timeout_minutes",
    maxFailedLoginAttempts: "max_failed_login_attempts",
    enforce2faAdmins: "enforce_2fa_admins",
    allowedIpRanges: "allowed_ip_ranges",
  },
  email: {
    defaultProvider: "default_provider",
    dailySendLimit: "daily_send_limit",
    defaultFromName: "default_from_name",
    defaultFromEmail: "default_from_email",
    allowedSenderDomains: "allowed_sender_domains",
  },
  storage: {
    provider: "provider",
    maxFileSizeMb: "max_file_size_mb",
    allowedExtensions: "allowed_extensions",
    retentionDays: "retention_days",
    publicUrlPattern: "public_url_pattern",
  },
  maintenance: {
    enabled: "enabled",
    message: "message",
    scheduledStart: "scheduled_start",
    scheduledEnd: "scheduled_end",
    bypassEmails: "bypass_emails",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Audit Log Types
// ─────────────────────────────────────────────────────────────────────────────

export type SettingsAuditLog = {
  id: string;
  settingId: string | null;
  category: SettingsCategory;
  key: string;
  oldValue: unknown;
  newValue: unknown;
  changedBy: string | null;
  changedAt: string;
  ipAddress: string | null;
  userAgent: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// API Request/Response Types
// ─────────────────────────────────────────────────────────────────────────────

export type GetSettingsResponse = {
  settings: PlatformSettings;
  lastUpdated: string | null;
};

export type UpdateSettingsRequest = {
  category: SettingsCategory;
  settings: Partial<PlatformSettings[SettingsCategory]>;
};

export type UpdateSettingsResponse = {
  success: boolean;
  category: SettingsCategory;
  updatedKeys: string[];
};

export type HealthCheckResponse = {
  integrations: IntegrationsHealth;
  checkedAt: string;
};
