/**
 * Secrets Management - Public API
 *
 * KMS-backed envelope encryption for sensitive credentials.
 */

// KMS operations
export {
  encryptSecret,
  decryptSecret,
  rotateSecret,
  generateDataKey,
  decryptDataKey,
  generateHint,
  serializeEnvelope,
  deserializeEnvelope,
  KMSError,
  type EncryptedEnvelope,
  type DecryptedSecret,
} from "./kms";

// High-level secret management
export {
  storeSecret,
  retrieveSecret,
  deleteSecret,
  rotateSecretByName,
  listSecrets,
  logSecretAccess,
  type StoredSecret,
  type SecretListItem,
} from "./service";

// Re-export types
export type {
  SecretType,
  SecretStatus,
  EncryptedSecretRow,
  SecretAccessLogRow,
  BreakGlassAccessRow,
  TenantDEKRegistryRow,
  StoreSecretRequest,
  StoreSecretResponse,
  RetrieveSecretRequest,
  RetrieveSecretResponse,
  ListSecretsResponse,
  SecretAccessPolicy,
  RotationSchedule,
  RotationEvent,
} from "@/types/secrets";
