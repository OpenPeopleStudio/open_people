/**
 * Secrets Management Types
 *
 * Types for the KMS-backed secrets management system.
 */

// ═══════════════════════════════════════════════════════════════════════════
// Secret Types
// ═══════════════════════════════════════════════════════════════════════════

/** Types of secrets that can be stored */
export type SecretType =
  | "api_key"
  | "oauth_token"
  | "oauth_refresh_token"
  | "credential"
  | "webhook_secret"
  | "encryption_key"
  | "certificate"
  | "other";

/** Status of a secret */
export type SecretStatus = "active" | "rotating" | "expired" | "revoked";

// ═══════════════════════════════════════════════════════════════════════════
// Database Row Types
// ═══════════════════════════════════════════════════════════════════════════

/** Encrypted secret row */
export interface EncryptedSecretRow {
  id: string;
  tenant_id: string | null;
  secret_type: string;
  secret_name: string;
  description: string | null;
  kms_key_id: string;
  encrypted_dek: string; // Base64
  encrypted_value: string; // Base64
  algorithm: string;
  iv: string; // Base64
  auth_tag: string | null; // Base64
  key_version: number;
  rotated_at: string | null;
  rotation_scheduled_at: string | null;
  access_policy: Record<string, unknown> | null;
  hint: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  last_accessed_at: string | null;
  last_accessed_by: string | null;
  access_count: number;
  deleted_at: string | null;
  deleted_by: string | null;
}

/** Secret access log row */
export interface SecretAccessLogRow {
  id: string;
  secret_id: string;
  tenant_id: string | null;
  secret_type: string;
  secret_name: string;
  accessor_id: string;
  accessor_role: string | null;
  access_type: string;
  access_granted: boolean;
  denial_reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  request_id: string | null;
  correlation_id: string | null;
  duration_ms: number | null;
  created_at: string;
}

/** Break glass access row */
export interface BreakGlassAccessRow {
  id: string;
  requestor_id: string;
  approver_id: string;
  justification: string;
  ticket_reference: string | null;
  tenant_id: string | null;
  secret_types: string[] | null;
  granted_at: string;
  expires_at: string;
  revoked_at: string | null;
  revoked_by: string | null;
  revocation_reason: string | null;
  operations_performed: Array<{
    operation: string;
    secret_id: string;
    timestamp: string;
  }>;
  security_notified_at: string | null;
  created_at: string;
}

/** Tenant DEK registry row */
export interface TenantDEKRegistryRow {
  id: string;
  tenant_id: string;
  key_purpose: string;
  key_version: number;
  kms_key_id: string;
  encrypted_dek: string; // Base64
  status: "active" | "rotating" | "retired";
  created_at: string;
  activated_at: string | null;
  retired_at: string | null;
  scheduled_retirement_at: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// API Types
// ═══════════════════════════════════════════════════════════════════════════

/** Request to store a secret */
export interface StoreSecretRequest {
  secret_type: SecretType;
  secret_name: string;
  value: string;
  description?: string;
  access_policy?: {
    allowed_users?: string[];
    allowed_roles?: string[];
  };
}

/** Response from storing a secret */
export interface StoreSecretResponse {
  id: string;
  secret_type: string;
  secret_name: string;
  hint: string;
  key_version: number;
  created_at: string;
}

/** Request to retrieve a secret */
export interface RetrieveSecretRequest {
  secret_type: SecretType;
  secret_name: string;
}

/** Response from retrieving a secret */
export interface RetrieveSecretResponse {
  id: string;
  secret_type: string;
  secret_name: string;
  value: string;
  hint: string;
  key_version: number;
}

/** Response from listing secrets */
export interface ListSecretsResponse {
  secrets: Array<{
    id: string;
    secret_type: string;
    secret_name: string;
    description: string | null;
    hint: string | null;
    key_version: number;
    created_at: string;
    last_accessed_at: string | null;
    access_count: number;
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Access Policy Types
// ═══════════════════════════════════════════════════════════════════════════

/** Access policy for a secret */
export interface SecretAccessPolicy {
  /** User IDs that can access this secret */
  allowed_users?: string[];
  /** Roles that can access this secret */
  allowed_roles?: ("owner" | "admin" | "member")[];
  /** Require break glass for access */
  require_break_glass?: boolean;
  /** Expiry date for the policy */
  expires_at?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Rotation Types
// ═══════════════════════════════════════════════════════════════════════════

/** Secret rotation schedule */
export interface RotationSchedule {
  /** Days between rotations */
  interval_days: number;
  /** Last rotation date */
  last_rotated_at: string | null;
  /** Next scheduled rotation */
  next_rotation_at: string;
  /** Auto-rotate or notify only */
  auto_rotate: boolean;
}

/** Rotation event */
export interface RotationEvent {
  secret_id: string;
  old_key_version: number;
  new_key_version: number;
  rotated_at: string;
  rotated_by: string | "system";
  reason: "scheduled" | "manual" | "compromise" | "policy";
}
