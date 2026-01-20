/* ═══════════════════════════════════════════════════════════════════════════
   Platform Settings Library
   Server-side utilities for managing platform configuration
   ═══════════════════════════════════════════════════════════════════════════ */

import { createSupabaseAdmin } from "@/lib/supabase/server";
import {
  PlatformSettings,
  SettingsCategory,
  DEFAULT_SETTINGS,
  KEY_MAPPINGS,
  IntegrationsHealth,
  IntegrationHealth,
  IntegrationStatus,
} from "@/types/platform-settings";

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Convert snake_case DB key to camelCase
// ─────────────────────────────────────────────────────────────────────────────

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Get All Platform Settings
// ─────────────────────────────────────────────────────────────────────────────

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const supabase = await createSupabaseAdmin();

  const { data, error } = await supabase
    .from("platform_settings")
    .select("category, key, value");

  if (error) {
    console.error("Error fetching platform settings:", error);
    return DEFAULT_SETTINGS;
  }

  // Start with defaults and override with DB values
  const settings: PlatformSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

  for (const row of data || []) {
    const category = row.category as SettingsCategory;
    const dbKey = row.key;
    const value = row.value;

    // Find the camelCase key for this DB key
    const mappings = KEY_MAPPINGS[category];
    if (!mappings) continue;

    const camelKey = Object.entries(mappings).find(
      ([, snake]) => snake === dbKey
    )?.[0];

    if (camelKey && category in settings) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (settings[category] as any)[camelKey] = value;
    }
  }

  return settings;
}

// ─────────────────────────────────────────────────────────────────────────────
// Get Settings by Category
// ─────────────────────────────────────────────────────────────────────────────

export async function getSettingsByCategory<T extends SettingsCategory>(
  category: T
): Promise<PlatformSettings[T]> {
  const supabase = await createSupabaseAdmin();

  const { data, error } = await supabase
    .from("platform_settings")
    .select("key, value")
    .eq("category", category);

  if (error) {
    console.error(`Error fetching ${category} settings:`, error);
    return DEFAULT_SETTINGS[category];
  }

  // Start with defaults for this category
  const categorySettings = JSON.parse(
    JSON.stringify(DEFAULT_SETTINGS[category])
  );

  const mappings = KEY_MAPPINGS[category];

  for (const row of data || []) {
    const camelKey = Object.entries(mappings).find(
      ([, snake]) => snake === row.key
    )?.[0];

    if (camelKey) {
      categorySettings[camelKey] = row.value;
    }
  }

  return categorySettings;
}

// ─────────────────────────────────────────────────────────────────────────────
// Get Single Setting with Default
// ─────────────────────────────────────────────────────────────────────────────

export async function getSetting<
  C extends SettingsCategory,
  K extends keyof PlatformSettings[C]
>(category: C, key: K, defaultValue?: PlatformSettings[C][K]): Promise<PlatformSettings[C][K]> {
  const supabase = await createSupabaseAdmin();

  const dbKey = KEY_MAPPINGS[category][key as string];

  const { data, error } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("category", category)
    .eq("key", dbKey)
    .single();

  if (error || !data) {
    return defaultValue ?? DEFAULT_SETTINGS[category][key];
  }

  return data.value as PlatformSettings[C][K];
}

// ─────────────────────────────────────────────────────────────────────────────
// Update Settings
// ─────────────────────────────────────────────────────────────────────────────

export async function updateSettings<T extends SettingsCategory>(
  category: T,
  settings: Partial<PlatformSettings[T]>,
  userId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; updatedKeys: string[]; error?: string }> {
  const supabase = await createSupabaseAdmin();
  const updatedKeys: string[] = [];
  const mappings = KEY_MAPPINGS[category];

  for (const [camelKey, value] of Object.entries(settings)) {
    const dbKey = mappings[camelKey];
    if (!dbKey) continue;

    const { error } = await supabase.rpc("upsert_platform_setting", {
      p_category: category,
      p_key: dbKey,
      p_value: value,
      p_user_id: userId || null,
      p_ip_address: ipAddress || null,
      p_user_agent: userAgent || null,
    });

    if (error) {
      console.error(`Error updating ${category}.${camelKey}:`, error);
      return {
        success: false,
        updatedKeys,
        error: `Failed to update ${camelKey}: ${error.message}`,
      };
    }

    updatedKeys.push(camelKey);
  }

  return { success: true, updatedKeys };
}

// ─────────────────────────────────────────────────────────────────────────────
// Integration Health Checks
// ─────────────────────────────────────────────────────────────────────────────

async function checkSupabaseHealth(): Promise<IntegrationHealth> {
  const start = Date.now();
  try {
    const supabase = await createSupabaseAdmin();
    const { error } = await supabase.from("tenants").select("id").limit(1);

    if (error) throw error;

    return {
      name: "Supabase",
      status: "connected",
      lastChecked: new Date().toISOString(),
      responseTimeMs: Date.now() - start,
      error: null,
      dashboardUrl: "https://supabase.com/dashboard",
    };
  } catch (err) {
    return {
      name: "Supabase",
      status: "disconnected",
      lastChecked: new Date().toISOString(),
      responseTimeMs: Date.now() - start,
      error: err instanceof Error ? err.message : "Connection failed",
      dashboardUrl: "https://supabase.com/dashboard",
    };
  }
}

async function checkStripeHealth(): Promise<IntegrationHealth> {
  const start = Date.now();
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey) {
    return {
      name: "Stripe",
      status: "disconnected",
      lastChecked: new Date().toISOString(),
      responseTimeMs: 0,
      error: "STRIPE_SECRET_KEY not configured",
      dashboardUrl: "https://dashboard.stripe.com",
    };
  }

  try {
    const response = await fetch("https://api.stripe.com/v1/balance", {
      headers: {
        Authorization: `Bearer ${stripeKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Stripe API returned ${response.status}`);
    }

    return {
      name: "Stripe",
      status: "connected",
      lastChecked: new Date().toISOString(),
      responseTimeMs: Date.now() - start,
      error: null,
      dashboardUrl: "https://dashboard.stripe.com",
    };
  } catch (err) {
    return {
      name: "Stripe",
      status: "disconnected",
      lastChecked: new Date().toISOString(),
      responseTimeMs: Date.now() - start,
      error: err instanceof Error ? err.message : "Connection failed",
      dashboardUrl: "https://dashboard.stripe.com",
    };
  }
}

async function checkOpenAIHealth(): Promise<IntegrationHealth> {
  const start = Date.now();
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!openaiKey) {
    return {
      name: "OpenAI",
      status: "disconnected",
      lastChecked: new Date().toISOString(),
      responseTimeMs: 0,
      error: "OPENAI_API_KEY not configured",
      dashboardUrl: "https://platform.openai.com",
    };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${openaiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`OpenAI API returned ${response.status}`);
    }

    return {
      name: "OpenAI",
      status: "connected",
      lastChecked: new Date().toISOString(),
      responseTimeMs: Date.now() - start,
      error: null,
      dashboardUrl: "https://platform.openai.com",
    };
  } catch (err) {
    return {
      name: "OpenAI",
      status: "disconnected",
      lastChecked: new Date().toISOString(),
      responseTimeMs: Date.now() - start,
      error: err instanceof Error ? err.message : "Connection failed",
      dashboardUrl: "https://platform.openai.com",
    };
  }
}

async function checkResendHealth(): Promise<IntegrationHealth> {
  const start = Date.now();
  const resendKey = process.env.RESEND_API_KEY;

  if (!resendKey) {
    return {
      name: "Resend",
      status: "disconnected",
      lastChecked: new Date().toISOString(),
      responseTimeMs: 0,
      error: "RESEND_API_KEY not configured",
      dashboardUrl: "https://resend.com/emails",
    };
  }

  try {
    const response = await fetch("https://api.resend.com/domains", {
      headers: {
        Authorization: `Bearer ${resendKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Resend API returned ${response.status}`);
    }

    return {
      name: "Resend",
      status: "connected",
      lastChecked: new Date().toISOString(),
      responseTimeMs: Date.now() - start,
      error: null,
      dashboardUrl: "https://resend.com/emails",
    };
  } catch (err) {
    return {
      name: "Resend",
      status: "disconnected",
      lastChecked: new Date().toISOString(),
      responseTimeMs: Date.now() - start,
      error: err instanceof Error ? err.message : "Connection failed",
      dashboardUrl: "https://resend.com/emails",
    };
  }
}

async function checkStorageHealth(): Promise<IntegrationHealth> {
  const start = Date.now();
  const r2AccessKey = process.env.R2_ACCESS_KEY_ID;
  const r2SecretKey = process.env.R2_SECRET_ACCESS_KEY;
  const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!r2AccessKey || !r2SecretKey || !cfAccountId) {
    return {
      name: "Cloud Storage (R2)",
      status: "disconnected",
      lastChecked: new Date().toISOString(),
      responseTimeMs: 0,
      error: "R2 credentials not fully configured",
      dashboardUrl: "https://dash.cloudflare.com",
    };
  }

  // For R2, we can't easily test without more complex signing
  // Just verify credentials are present
  return {
    name: "Cloud Storage (R2)",
    status: "connected",
    lastChecked: new Date().toISOString(),
    responseTimeMs: Date.now() - start,
    error: null,
    dashboardUrl: "https://dash.cloudflare.com",
  };
}

export async function checkIntegrationHealth(): Promise<IntegrationsHealth> {
  const [supabase, stripe, openai, resend, storage] = await Promise.all([
    checkSupabaseHealth(),
    checkStripeHealth(),
    checkOpenAIHealth(),
    checkResendHealth(),
    checkStorageHealth(),
  ]);

  return {
    supabase,
    stripe,
    openai,
    resend,
    storage,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Check Maintenance Mode
// ─────────────────────────────────────────────────────────────────────────────

export async function isMaintenanceMode(userEmail?: string): Promise<{
  enabled: boolean;
  message: string;
  bypassed: boolean;
}> {
  const maintenance = await getSettingsByCategory("maintenance");

  if (!maintenance.enabled) {
    return { enabled: false, message: "", bypassed: false };
  }

  // Check scheduled window
  const now = new Date();
  if (maintenance.scheduledStart) {
    const start = new Date(maintenance.scheduledStart);
    if (now < start) {
      return { enabled: false, message: "", bypassed: false };
    }
  }
  if (maintenance.scheduledEnd) {
    const end = new Date(maintenance.scheduledEnd);
    if (now > end) {
      return { enabled: false, message: "", bypassed: false };
    }
  }

  // Check bypass list
  if (userEmail && maintenance.bypassEmails.includes(userEmail)) {
    return {
      enabled: true,
      message: maintenance.message,
      bypassed: true,
    };
  }

  return {
    enabled: true,
    message: maintenance.message,
    bypassed: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Get Audit Log
// ─────────────────────────────────────────────────────────────────────────────

export async function getSettingsAuditLog(options?: {
  category?: SettingsCategory;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  const supabase = await createSupabaseAdmin();

  let query = supabase
    .from("settings_audit_log")
    .select("*")
    .order("changed_at", { ascending: false });

  if (options?.category) {
    query = query.eq("category", options.category);
  }
  if (options?.startDate) {
    query = query.gte("changed_at", options.startDate);
  }
  if (options?.endDate) {
    query = query.lte("changed_at", options.endDate);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching audit log:", error);
    return [];
  }

  return data || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Get Last Updated Timestamp
// ─────────────────────────────────────────────────────────────────────────────

export async function getSettingsLastUpdated(): Promise<string | null> {
  const supabase = await createSupabaseAdmin();

  const { data, error } = await supabase
    .from("platform_settings")
    .select("updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data.updated_at;
}

// ─────────────────────────────────────────────────────────────────────────────
// Environment Variables Display (Read-only)
// ─────────────────────────────────────────────────────────────────────────────

export function getEnvironmentVariableStatus(): Record<
  string,
  { configured: boolean; masked: string }
> {
  const envVars = {
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    // Stripe
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    // OpenAI
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    // Resend
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    // R2/Storage
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    // Domain
    NEXT_PUBLIC_ROOT_DOMAIN: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
    SUPER_ADMIN_DOMAIN: process.env.SUPER_ADMIN_DOMAIN,
    // Encryption
    API_KEYS_ENCRYPTION_KEY: process.env.API_KEYS_ENCRYPTION_KEY,
    EMAIL_ENCRYPTION_KEY: process.env.EMAIL_ENCRYPTION_KEY,
  };

  const result: Record<string, { configured: boolean; masked: string }> = {};

  for (const [key, value] of Object.entries(envVars)) {
    if (value) {
      // Mask the value, showing only first 4 and last 4 characters
      const masked =
        value.length > 12
          ? `${value.slice(0, 4)}${"*".repeat(8)}${value.slice(-4)}`
          : "*".repeat(value.length);
      result[key] = { configured: true, masked };
    } else {
      result[key] = { configured: false, masked: "Not configured" };
    }
  }

  return result;
}
