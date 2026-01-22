/* ═══════════════════════════════════════════════════════════════════════════
   Device-Bound Plugin Authentication
   Short-lived tokens bound to device fingerprints for enterprise-safe plugins
   ═══════════════════════════════════════════════════════════════════════════ */

import { createSupabaseAdmin } from "@/lib/supabase/server";
import crypto from "crypto";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type DevicePlatform = "browser" | "desktop" | "mobile" | "cli" | "unknown";

export type DeviceAttestation = {
  platform: DevicePlatform;
  fingerprint_hash: string;
  user_agent?: string;
  os_version?: string;
  app_version?: string;
  created_at: string;
};

export type PluginToken = {
  token: string;
  token_prefix: string; // For identification (e.g., "op_pt_abc...")
  device_id: string;
  tenant_id: string;
  user_id: string;
  expires_at: string;
  attestation?: DeviceAttestation;
  scopes?: string[];
};

export type PluginTokenRequest = {
  tenant_id: string;
  user_id: string;
  device_fingerprint: string;
  platform: DevicePlatform;
  user_agent?: string;
  ttl_minutes?: number; // Default: 60 minutes
  scopes?: string[];
};

export type PluginTokenValidation = {
  valid: boolean;
  token_id?: string;
  tenant_id?: string;
  user_id?: string;
  device_id?: string;
  scopes?: string[];
  error?: string;
  expires_at?: string;
};

export type DeviceRegistration = {
  id: string;
  tenant_id: string;
  user_id: string;
  device_id: string;
  attestation: DeviceAttestation;
  is_trusted: boolean;
  last_seen_at: string;
  created_at: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const TOKEN_PREFIX = "op_pt_"; // OpenPeople Plugin Token
const DEFAULT_TTL_MINUTES = 60;
const MAX_TTL_MINUTES = 480; // 8 hours max
const TOKEN_LENGTH = 32; // 256 bits

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function generateSecureToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString("base64url");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function hashDeviceFingerprint(fingerprint: string): string {
  return crypto.createHash("sha256").update(fingerprint).digest("hex");
}

function generateDeviceId(
  tenantId: string,
  userId: string,
  fingerprintHash: string
): string {
  const combined = `${tenantId}:${userId}:${fingerprintHash}`;
  return crypto.createHash("sha256").update(combined).digest("hex").slice(0, 16);
}

// ─────────────────────────────────────────────────────────────────────────────
// Token Generation
// ─────────────────────────────────────────────────────────────────────────────

export async function generatePluginToken(
  request: PluginTokenRequest
): Promise<PluginToken> {
  const supabase = await createSupabaseAdmin();
  
  // Generate secure token
  const rawToken = generateSecureToken();
  const fullToken = `${TOKEN_PREFIX}${rawToken}`;
  const tokenHash = hashToken(fullToken);
  const tokenPrefix = fullToken.slice(0, 12) + "...";
  
  // Hash device fingerprint
  const fingerprintHash = hashDeviceFingerprint(request.device_fingerprint);
  const deviceId = generateDeviceId(
    request.tenant_id,
    request.user_id,
    fingerprintHash
  );
  
  // Calculate expiration
  const ttlMinutes = Math.min(
    request.ttl_minutes || DEFAULT_TTL_MINUTES,
    MAX_TTL_MINUTES
  );
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
  
  // Create attestation
  const attestation: DeviceAttestation = {
    platform: request.platform,
    fingerprint_hash: fingerprintHash,
    created_at: new Date().toISOString(),
    ...(request.user_agent ? { user_agent: request.user_agent } : {}),
  };
  
  // Store token in database
  const { error } = await supabase.from("plugin_tokens").insert({
    tenant_id: request.tenant_id,
    user_id: request.user_id,
    device_id: deviceId,
    token_hash: tokenHash,
    token_prefix: tokenPrefix,
    attestation: attestation,
    scopes: request.scopes || ["chat", "read"],
    expires_at: expiresAt,
    is_active: true,
    created_at: new Date().toISOString(),
  });
  
  if (error) {
    throw new Error(`Failed to create plugin token: ${error.message}`);
  }
  
  // Register/update device
  await registerDevice({
    tenant_id: request.tenant_id,
    user_id: request.user_id,
    device_id: deviceId,
    attestation,
  });
  
  return {
    token: fullToken,
    token_prefix: tokenPrefix,
    device_id: deviceId,
    tenant_id: request.tenant_id,
    user_id: request.user_id,
    expires_at: expiresAt,
    attestation,
    scopes: request.scopes || ["chat", "read"],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Token Validation
// ─────────────────────────────────────────────────────────────────────────────

export async function validatePluginToken(
  token: string,
  deviceFingerprint?: string
): Promise<PluginTokenValidation> {
  // Check token format
  if (!token.startsWith(TOKEN_PREFIX)) {
    return { valid: false, error: "Invalid token format" };
  }
  
  const supabase = await createSupabaseAdmin();
  const tokenHash = hashToken(token);
  
  // Look up token
  const { data: tokenRecord, error } = await supabase
    .from("plugin_tokens")
    .select("*")
    .eq("token_hash", tokenHash)
    .eq("is_active", true)
    .single();
  
  if (error || !tokenRecord) {
    return { valid: false, error: "Token not found or inactive" };
  }
  
  // Check expiration
  if (new Date(tokenRecord.expires_at) < new Date()) {
    // Deactivate expired token
    await supabase
      .from("plugin_tokens")
      .update({ is_active: false })
      .eq("id", tokenRecord.id);
    
    return { valid: false, error: "Token expired" };
  }
  
  // Validate device binding if fingerprint provided
  if (deviceFingerprint) {
    const fingerprintHash = hashDeviceFingerprint(deviceFingerprint);
    const attestation = tokenRecord.attestation as DeviceAttestation;
    
    if (attestation.fingerprint_hash !== fingerprintHash) {
      // Device mismatch - potential token theft
      await supabase.from("plugin_tokens").update({
        is_active: false,
        revoked_at: new Date().toISOString(),
        revoke_reason: "device_mismatch",
      }).eq("id", tokenRecord.id);
      
      // Log security event
      await supabase.from("activity_ledger").insert({
        tenant_id: tokenRecord.tenant_id,
        actor_id: tokenRecord.user_id,
        actor_type: "user",
        action: "token_device_mismatch",
        action_category: "security",
        resource_type: "plugin_token",
        resource_id: tokenRecord.id,
        context: {
          expected_device: tokenRecord.device_id,
          suspicious: true,
        },
        success: false,
      });
      
      return { valid: false, error: "Device mismatch - token revoked" };
    }
  }
  
  // Update last used
  await supabase
    .from("plugin_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", tokenRecord.id);
  
  return {
    valid: true,
    token_id: tokenRecord.id,
    tenant_id: tokenRecord.tenant_id,
    user_id: tokenRecord.user_id,
    device_id: tokenRecord.device_id,
    scopes: tokenRecord.scopes,
    expires_at: tokenRecord.expires_at,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Token Revocation
// ─────────────────────────────────────────────────────────────────────────────

export async function revokePluginToken(
  tokenId: string,
  reason?: string
): Promise<boolean> {
  const supabase = await createSupabaseAdmin();
  
  const { error } = await supabase
    .from("plugin_tokens")
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
      revoke_reason: reason || "manual",
    })
    .eq("id", tokenId);
  
  return !error;
}

export async function revokeAllDeviceTokens(
  tenantId: string,
  userId: string,
  deviceId: string
): Promise<number> {
  const supabase = await createSupabaseAdmin();
  
  const { data } = await supabase
    .from("plugin_tokens")
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
      revoke_reason: "device_revoked",
    })
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("device_id", deviceId)
    .eq("is_active", true)
    .select();
  
  return data?.length || 0;
}

export async function revokeAllUserTokens(
  tenantId: string,
  userId: string
): Promise<number> {
  const supabase = await createSupabaseAdmin();
  
  const { data } = await supabase
    .from("plugin_tokens")
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
      revoke_reason: "user_revoked",
    })
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .select();
  
  return data?.length || 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Device Registration
// ─────────────────────────────────────────────────────────────────────────────

async function registerDevice(params: {
  tenant_id: string;
  user_id: string;
  device_id: string;
  attestation: DeviceAttestation;
}): Promise<DeviceRegistration> {
  const supabase = await createSupabaseAdmin();
  
  const { data, error } = await supabase
    .from("registered_devices")
    .upsert(
      {
        tenant_id: params.tenant_id,
        user_id: params.user_id,
        device_id: params.device_id,
        attestation: params.attestation,
        last_seen_at: new Date().toISOString(),
        is_trusted: true, // New devices are trusted by default
      },
      {
        onConflict: "tenant_id,user_id,device_id",
      }
    )
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to register device: ${error.message}`);
  }
  
  return data as DeviceRegistration;
}

export async function listUserDevices(
  tenantId: string,
  userId: string
): Promise<DeviceRegistration[]> {
  const supabase = await createSupabaseAdmin();
  
  const { data } = await supabase
    .from("registered_devices")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .order("last_seen_at", { ascending: false });
  
  return (data || []) as DeviceRegistration[];
}

export async function untrustDevice(
  tenantId: string,
  userId: string,
  deviceId: string
): Promise<boolean> {
  const supabase = await createSupabaseAdmin();
  
  // Mark device as untrusted
  const { error: deviceError } = await supabase
    .from("registered_devices")
    .update({ is_trusted: false })
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .eq("device_id", deviceId);
  
  // Revoke all tokens for this device
  await revokeAllDeviceTokens(tenantId, userId, deviceId);
  
  return !deviceError;
}

// ─────────────────────────────────────────────────────────────────────────────
// Token Refresh
// ─────────────────────────────────────────────────────────────────────────────

export async function refreshPluginToken(
  token: string,
  deviceFingerprint: string
): Promise<PluginToken | null> {
  // Validate existing token
  const validation = await validatePluginToken(token, deviceFingerprint);
  
  if (!validation.valid) {
    return null;
  }
  
  // Revoke old token
  await revokePluginToken(validation.token_id!, "refreshed");
  
  // Generate new token
  const supabase = await createSupabaseAdmin();
  
  // Get original token details
  const { data: originalToken } = await supabase
    .from("plugin_tokens")
    .select("*")
    .eq("id", validation.token_id)
    .single();
  
  if (!originalToken) {
    return null;
  }
  
  // Generate new token with same scopes
  const tokenRequest: PluginTokenRequest = {
    tenant_id: validation.tenant_id!,
    user_id: validation.user_id!,
    device_fingerprint: deviceFingerprint,
    platform: (originalToken.attestation as DeviceAttestation).platform,
    ...(validation.scopes ? { scopes: validation.scopes } : {}),
  };
  return generatePluginToken(tokenRequest);
}

// ─────────────────────────────────────────────────────────────────────────────
// Cleanup Expired Tokens
// ─────────────────────────────────────────────────────────────────────────────

export async function cleanupExpiredTokens(): Promise<number> {
  const supabase = await createSupabaseAdmin();
  
  const { data } = await supabase
    .from("plugin_tokens")
    .delete()
    .lt("expires_at", new Date().toISOString())
    .eq("is_active", false)
    .select();
  
  return data?.length || 0;
}
