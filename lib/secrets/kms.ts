/**
 * KMS Client - AWS KMS integration for key management
 *
 * Provides envelope encryption using AWS KMS as the key encryption key (KEK)
 * source. Supports local fallback for development.
 *
 * Architecture:
 *   KMS (KEK) -> encrypts -> DEK -> encrypts -> Secret Value
 */

import crypto from "crypto";

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const DEK_LENGTH = 32; // 256 bits

interface KMSConfig {
  region: string;
  keyArn: string;
  localFallback: boolean;
  localKey?: string;
}

function getKMSConfig(): KMSConfig {
  return {
    region: process.env.AWS_REGION || "us-east-1",
    keyArn: process.env.AWS_KMS_KEY_ARN || "",
    localFallback: process.env.KMS_LOCAL_FALLBACK === "true" || process.env.NODE_ENV === "development",
    localKey: process.env.KMS_LOCAL_KEY || process.env.API_KEYS_ENCRYPTION_KEY,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface EncryptedEnvelope {
  /** KMS key ARN or 'local' for fallback */
  kmsKeyId: string;
  /** DEK encrypted by KMS */
  encryptedDek: Buffer;
  /** Value encrypted by DEK */
  encryptedValue: Buffer;
  /** Initialization vector */
  iv: Buffer;
  /** GCM auth tag */
  authTag: Buffer;
  /** Algorithm used */
  algorithm: string;
}

export interface DecryptedSecret {
  value: string;
  /** Hint for display (e.g., last 4 chars) */
  hint: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// KMS Operations (AWS SDK lazy-loaded)
// ═══════════════════════════════════════════════════════════════════════════

let kmsClient: unknown = null;

async function getKMSClient() {
  if (kmsClient) return kmsClient;

  const config = getKMSConfig();

  if (config.localFallback) {
    // Return a mock client for local development
    return {
      generateDataKey: async () => ({
        Plaintext: crypto.randomBytes(DEK_LENGTH),
        CiphertextBlob: crypto.randomBytes(DEK_LENGTH + 16), // Simulated encrypted DEK
      }),
      decrypt: async (params: { CiphertextBlob: Buffer }) => ({
        Plaintext: params.CiphertextBlob.subarray(0, DEK_LENGTH), // Return the "plaintext" part
      }),
    };
  }

  // Lazy-load AWS SDK only when needed
  try {
    // @ts-expect-error - AWS SDK is optional, only loaded when configured
    const { KMSClient, GenerateDataKeyCommand, DecryptCommand } = await import("@aws-sdk/client-kms");

    const client = new KMSClient({ region: config.region });

    kmsClient = {
      generateDataKey: async () => {
        const command = new GenerateDataKeyCommand({
          KeyId: config.keyArn,
          KeySpec: "AES_256",
          EncryptionContext: { service: "openpeople" },
        });
        return client.send(command);
      },
      decrypt: async (params: { CiphertextBlob: Buffer }) => {
        const command = new DecryptCommand({
          KeyId: config.keyArn,
          CiphertextBlob: params.CiphertextBlob,
          EncryptionContext: { service: "openpeople" },
        });
        return client.send(command);
      },
    };

    return kmsClient;
  } catch {
    throw new KMSError("AWS SDK not available and local fallback not enabled");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Local Fallback Encryption
// ═══════════════════════════════════════════════════════════════════════════

function getLocalMasterKey(): Buffer {
  const config = getKMSConfig();
  const raw = config.localKey?.trim().replace(/^['"]|['"]$/g, "") || "";

  if (!raw) {
    throw new KMSError(
      "Local KMS fallback enabled but no key configured. Set KMS_LOCAL_KEY or API_KEYS_ENCRYPTION_KEY."
    );
  }

  // Try base64 first
  if (/^[A-Za-z0-9+/]+=*$/.test(raw)) {
    try {
      const buf = Buffer.from(raw, "base64");
      if (buf.length === 32) return buf;
    } catch {
      // Fall through
    }
  }

  // Try hex
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }

  // Raw 32-char string
  if (raw.length === 32) {
    return Buffer.from(raw);
  }

  throw new KMSError("Local key must decode to 32 bytes (base64, hex, or 32-char raw)");
}

function localEncryptDek(dek: Buffer): Buffer {
  const masterKey = getLocalMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv, { authTagLength: AUTH_TAG_LENGTH });

  let encrypted = cipher.update(dek);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Format: iv (12) + authTag (16) + ciphertext
  return Buffer.concat([iv, authTag, encrypted]);
}

function localDecryptDek(encryptedDek: Buffer): Buffer {
  const masterKey = getLocalMasterKey();

  const iv = encryptedDek.subarray(0, IV_LENGTH);
  const authTag = encryptedDek.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = encryptedDek.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted;
}

// ═══════════════════════════════════════════════════════════════════════════
// Core Encryption Operations
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a new DEK and encrypt it with KMS.
 */
export async function generateDataKey(): Promise<{ plaintext: Buffer; encrypted: Buffer; kmsKeyId: string }> {
  const config = getKMSConfig();

  if (config.localFallback) {
    const plaintext = crypto.randomBytes(DEK_LENGTH);
    const encrypted = localEncryptDek(plaintext);
    return { plaintext, encrypted, kmsKeyId: "local" };
  }

  const kms = await getKMSClient();
  const result = await (kms as {
    generateDataKey: () => Promise<{ Plaintext: Buffer; CiphertextBlob: Buffer }>;
  }).generateDataKey();

  return {
    plaintext: Buffer.from(result.Plaintext),
    encrypted: Buffer.from(result.CiphertextBlob),
    kmsKeyId: config.keyArn,
  };
}

/**
 * Decrypt an encrypted DEK using KMS.
 */
export async function decryptDataKey(encryptedDek: Buffer, kmsKeyId: string): Promise<Buffer> {
  if (kmsKeyId === "local") {
    return localDecryptDek(encryptedDek);
  }

  const kms = await getKMSClient();
  const result = await (kms as {
    decrypt: (params: { CiphertextBlob: Buffer }) => Promise<{ Plaintext: Buffer }>;
  }).decrypt({ CiphertextBlob: encryptedDek });

  return Buffer.from(result.Plaintext);
}

/**
 * Encrypt a value using envelope encryption.
 */
export async function encryptSecret(plaintext: string): Promise<EncryptedEnvelope> {
  // Generate DEK
  const { plaintext: dek, encrypted: encryptedDek, kmsKeyId } = await generateDataKey();

  // Encrypt the value with DEK
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, dek, iv, { authTagLength: AUTH_TAG_LENGTH });

  let encryptedValue = cipher.update(plaintext, "utf8");
  encryptedValue = Buffer.concat([encryptedValue, cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Clear DEK from memory
  dek.fill(0);

  return {
    kmsKeyId,
    encryptedDek,
    encryptedValue,
    iv,
    authTag,
    algorithm: ALGORITHM,
  };
}

/**
 * Decrypt a value using envelope encryption.
 */
export async function decryptSecret(envelope: EncryptedEnvelope): Promise<DecryptedSecret> {
  // Decrypt DEK
  const dek = await decryptDataKey(envelope.encryptedDek, envelope.kmsKeyId);

  try {
    // Decrypt value with DEK
    const decipher = crypto.createDecipheriv(ALGORITHM, dek, envelope.iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(envelope.authTag);

    let decrypted = decipher.update(envelope.encryptedValue);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    const value = decrypted.toString("utf8");

    return {
      value,
      hint: generateHint(value),
    };
  } finally {
    // Clear DEK from memory
    dek.fill(0);
  }
}

/**
 * Re-encrypt a secret with a new DEK (for rotation).
 */
export async function rotateSecret(envelope: EncryptedEnvelope): Promise<EncryptedEnvelope> {
  const { value } = await decryptSecret(envelope);
  return encryptSecret(value);
}

// ═══════════════════════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a hint for display (e.g., "...xyz123").
 */
export function generateHint(value: string): string {
  if (value.length <= 8) {
    return "****";
  }
  return `...${value.slice(-6)}`;
}

/**
 * Serialize envelope for database storage.
 */
export function serializeEnvelope(envelope: EncryptedEnvelope): {
  kms_key_id: string;
  encrypted_dek: string;
  encrypted_value: string;
  iv: string;
  auth_tag: string;
  algorithm: string;
} {
  return {
    kms_key_id: envelope.kmsKeyId,
    encrypted_dek: envelope.encryptedDek.toString("base64"),
    encrypted_value: envelope.encryptedValue.toString("base64"),
    iv: envelope.iv.toString("base64"),
    auth_tag: envelope.authTag.toString("base64"),
    algorithm: envelope.algorithm,
  };
}

/**
 * Deserialize envelope from database storage.
 */
export function deserializeEnvelope(data: {
  kms_key_id: string;
  encrypted_dek: string;
  encrypted_value: string;
  iv: string;
  auth_tag: string | null;
  algorithm: string;
}): EncryptedEnvelope {
  return {
    kmsKeyId: data.kms_key_id,
    encryptedDek: Buffer.from(data.encrypted_dek, "base64"),
    encryptedValue: Buffer.from(data.encrypted_value, "base64"),
    iv: Buffer.from(data.iv, "base64"),
    authTag: data.auth_tag ? Buffer.from(data.auth_tag, "base64") : Buffer.alloc(0),
    algorithm: data.algorithm,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Error Types
// ═══════════════════════════════════════════════════════════════════════════

export class KMSError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "KMSError";
  }
}
