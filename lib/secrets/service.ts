/**
 * Secrets Service - High-level secret management
 *
 * Provides CRUD operations for secrets with automatic envelope encryption,
 * audit logging, and access control.
 */

import { createSupabaseAdmin } from "@/lib/supabase/server";
import {
  encryptSecret,
  decryptSecret,
  rotateSecret,
  serializeEnvelope,
  deserializeEnvelope,
  generateHint,
  type EncryptedEnvelope,
} from "./kms";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface StoredSecret {
  id: string;
  tenantId: string | null;
  secretType: string;
  secretName: string;
  description: string | null;
  hint: string | null;
  keyVersion: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  lastAccessedAt: string | null;
  accessCount: number;
}

export interface SecretListItem {
  id: string;
  secretType: string;
  secretName: string;
  description: string | null;
  hint: string | null;
  keyVersion: number;
  createdAt: string;
  lastAccessedAt: string | null;
  accessCount: number;
}

export interface StoreSecretOptions {
  tenantId: string | null;
  secretType: string;
  secretName: string;
  value: string;
  description?: string;
  accessPolicy?: Record<string, unknown>;
  createdBy?: string;
}

export interface SecretAccessContext {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CRUD Operations
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Store a new secret with envelope encryption.
 */
export async function storeSecret(options: StoreSecretOptions): Promise<StoredSecret> {
  const supabase = await createSupabaseAdmin();

  // Encrypt the secret value
  const envelope = await encryptSecret(options.value);
  const serialized = serializeEnvelope(envelope);

  const { data, error } = await supabase
    .from("encrypted_secrets")
    .insert({
      tenant_id: options.tenantId,
      secret_type: options.secretType,
      secret_name: options.secretName,
      description: options.description,
      kms_key_id: serialized.kms_key_id,
      encrypted_dek: serialized.encrypted_dek,
      encrypted_value: serialized.encrypted_value,
      iv: serialized.iv,
      auth_tag: serialized.auth_tag,
      algorithm: serialized.algorithm,
      hint: generateHint(options.value),
      access_policy: options.accessPolicy,
      created_by: options.createdBy,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to store secret: ${error.message}`);
  }

  return mapDbRowToStoredSecret(data);
}

/**
 * Retrieve and decrypt a secret by name.
 */
export async function retrieveSecret(
  tenantId: string | null,
  secretType: string,
  secretName: string,
  context: SecretAccessContext
): Promise<{ secret: StoredSecret; value: string }> {
  const supabase = await createSupabaseAdmin();
  const startTime = Date.now();

  // Fetch the encrypted secret
  const { data, error } = await supabase
    .from("encrypted_secrets")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("secret_type", secretType)
    .eq("secret_name", secretName)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    // Log failed access attempt
    if (data?.id) {
      await logSecretAccess(data.id, context.userId, "decrypt", false, "Secret not found", context);
    }
    throw new Error(`Secret not found: ${secretType}/${secretName}`);
  }

  // Check access permission
  const { data: canAccess } = await supabase.rpc("can_access_secret", {
    p_secret_id: data.id,
    p_user_id: context.userId,
    p_access_type: "decrypt",
  });

  if (!canAccess) {
    await logSecretAccess(data.id, context.userId, "decrypt", false, "Access denied", context);
    throw new Error("Access denied to secret");
  }

  // Decrypt the secret
  const envelope = deserializeEnvelope({
    kms_key_id: data.kms_key_id,
    encrypted_dek: data.encrypted_dek,
    encrypted_value: data.encrypted_value,
    iv: data.iv,
    auth_tag: data.auth_tag,
    algorithm: data.algorithm,
  });

  const { value } = await decryptSecret(envelope);

  // Log successful access
  const durationMs = Date.now() - startTime;
  await logSecretAccess(data.id, context.userId, "decrypt", true, null, {
    ...context,
    durationMs,
  });

  return {
    secret: mapDbRowToStoredSecret(data),
    value,
  };
}

/**
 * Delete a secret (soft delete for audit trail).
 */
export async function deleteSecret(
  secretId: string,
  context: SecretAccessContext
): Promise<boolean> {
  const supabase = await createSupabaseAdmin();

  // Check access
  const { data: canAccess } = await supabase.rpc("can_access_secret", {
    p_secret_id: secretId,
    p_user_id: context.userId,
    p_access_type: "delete",
  });

  if (!canAccess) {
    await logSecretAccess(secretId, context.userId, "delete", false, "Access denied", context);
    throw new Error("Access denied");
  }

  const { error } = await supabase
    .from("encrypted_secrets")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: context.userId,
    })
    .eq("id", secretId);

  if (error) {
    await logSecretAccess(secretId, context.userId, "delete", false, error.message, context);
    throw new Error(`Failed to delete secret: ${error.message}`);
  }

  await logSecretAccess(secretId, context.userId, "delete", true, null, context);
  return true;
}

/**
 * Rotate a secret's encryption (re-encrypt with new DEK).
 */
export async function rotateSecretByName(
  tenantId: string | null,
  secretType: string,
  secretName: string,
  context: SecretAccessContext
): Promise<StoredSecret> {
  const supabase = await createSupabaseAdmin();

  // Fetch the encrypted secret
  const { data, error } = await supabase
    .from("encrypted_secrets")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("secret_type", secretType)
    .eq("secret_name", secretName)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    throw new Error(`Secret not found: ${secretType}/${secretName}`);
  }

  // Check access
  const { data: canAccess } = await supabase.rpc("can_access_secret", {
    p_secret_id: data.id,
    p_user_id: context.userId,
    p_access_type: "rotate",
  });

  if (!canAccess) {
    await logSecretAccess(data.id, context.userId, "rotate", false, "Access denied", context);
    throw new Error("Access denied");
  }

  // Decrypt current value
  const currentEnvelope = deserializeEnvelope({
    kms_key_id: data.kms_key_id,
    encrypted_dek: data.encrypted_dek,
    encrypted_value: data.encrypted_value,
    iv: data.iv,
    auth_tag: data.auth_tag,
    algorithm: data.algorithm,
  });

  // Re-encrypt with new DEK
  const newEnvelope = await rotateSecret(currentEnvelope);
  const serialized = serializeEnvelope(newEnvelope);

  // Update the record
  const { data: updated, error: updateError } = await supabase
    .from("encrypted_secrets")
    .update({
      kms_key_id: serialized.kms_key_id,
      encrypted_dek: serialized.encrypted_dek,
      encrypted_value: serialized.encrypted_value,
      iv: serialized.iv,
      auth_tag: serialized.auth_tag,
      key_version: data.key_version + 1,
      rotated_at: new Date().toISOString(),
    })
    .eq("id", data.id)
    .select()
    .single();

  if (updateError) {
    await logSecretAccess(data.id, context.userId, "rotate", false, updateError.message, context);
    throw new Error(`Failed to rotate secret: ${updateError.message}`);
  }

  await logSecretAccess(data.id, context.userId, "rotate", true, null, context);
  return mapDbRowToStoredSecret(updated);
}

/**
 * List secrets for a tenant (metadata only, no values).
 */
export async function listSecrets(
  tenantId: string | null,
  options?: { secretType?: string; limit?: number; offset?: number }
): Promise<SecretListItem[]> {
  const supabase = await createSupabaseAdmin();

  let query = supabase
    .from("encrypted_secrets")
    .select("id, secret_type, secret_name, description, hint, key_version, created_at, last_accessed_at, access_count")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (options?.secretType) {
    query = query.eq("secret_type", options.secretType);
  }

  if (options?.limit) {
    const offset = options.offset || 0;
    query = query.range(offset, offset + options.limit - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list secrets: ${error.message}`);
  }

  return (data || []).map((row) => ({
    id: row.id,
    secretType: row.secret_type,
    secretName: row.secret_name,
    description: row.description,
    hint: row.hint,
    keyVersion: row.key_version,
    createdAt: row.created_at,
    lastAccessedAt: row.last_accessed_at,
    accessCount: row.access_count,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// Audit Logging
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Log a secret access event.
 */
export async function logSecretAccess(
  secretId: string,
  userId: string,
  accessType: string,
  accessGranted: boolean,
  denialReason: string | null,
  context?: Partial<SecretAccessContext> & { durationMs?: number }
): Promise<void> {
  const supabase = await createSupabaseAdmin();

  await supabase.rpc("log_secret_access", {
    p_secret_id: secretId,
    p_accessor_id: userId,
    p_access_type: accessType,
    p_access_granted: accessGranted,
    p_denial_reason: denialReason,
    p_ip_address: context?.ipAddress ?? null,
    p_user_agent: context?.userAgent ?? null,
    p_request_id: context?.requestId ?? null,
    p_duration_ms: context?.durationMs ?? null,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

function mapDbRowToStoredSecret(row: Record<string, unknown>): StoredSecret {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string | null,
    secretType: row.secret_type as string,
    secretName: row.secret_name as string,
    description: row.description as string | null,
    hint: row.hint as string | null,
    keyVersion: row.key_version as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    createdBy: row.created_by as string | null,
    lastAccessedAt: row.last_accessed_at as string | null,
    accessCount: row.access_count as number,
  };
}
