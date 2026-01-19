/**
 * Vault Encryption Library
 * 
 * Server-side encryption for the Super Admin Vault using Node.js crypto.
 * Implements AES-256-GCM with PBKDF2 key derivation.
 * 
 * Architecture:
 * - Master Password → PBKDF2 → Key Encryption Key (KEK)
 * - KEK encrypts Data Encryption Keys (DEKs)
 * - Each file is encrypted with its own DEK
 * - DEKs are stored encrypted in the database
 */

import crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

const PBKDF2_ITERATIONS = 150000;
const PBKDF2_DIGEST = 'sha256';
const KEY_LENGTH = 32; // 256 bits for AES-256
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface EncryptedData {
  ciphertext: string; // Base64 encoded
  iv: string; // Base64 encoded
  authTag: string; // Base64 encoded
}

export interface EncryptedKey {
  encryptedDek: string; // Base64 encoded
  iv: string; // Base64 encoded
  salt: string; // Base64 encoded
  authTag: string; // Base64 encoded
}

export interface KeyVerification {
  hash: string; // Base64 encoded
  salt: string; // Base64 encoded
}

// ═══════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert buffer to base64 string
 */
export function bufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}

/**
 * Convert base64 string to buffer
 */
export function base64ToBuffer(base64: string): Buffer {
  return Buffer.from(base64, 'base64');
}

/**
 * Generate cryptographically secure random bytes
 */
export function generateRandomBytes(length: number): Buffer {
  return crypto.randomBytes(length);
}

/**
 * Generate a random key ID (short hash)
 */
export function generateKeyId(): string {
  return crypto.randomBytes(8).toString('hex');
}

// ═══════════════════════════════════════════════════════════════════════════
// Key Derivation
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Derive a key from a password using PBKDF2
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: Buffer
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      PBKDF2_ITERATIONS,
      KEY_LENGTH,
      PBKDF2_DIGEST,
      (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      }
    );
  });
}

/**
 * Create a verification hash for the master password
 * This is stored in the database to verify password correctness without storing it
 */
export async function createPasswordVerification(
  password: string
): Promise<KeyVerification> {
  const salt = generateRandomBytes(SALT_LENGTH);
  const derivedKey = await deriveKeyFromPassword(password, salt);
  
  // Hash the derived key one more time for verification
  const verificationHash = crypto
    .createHash('sha256')
    .update(derivedKey)
    .digest();
  
  return {
    hash: bufferToBase64(verificationHash),
    salt: bufferToBase64(salt),
  };
}

/**
 * Verify a password against stored verification data
 */
export async function verifyPassword(
  password: string,
  verification: KeyVerification
): Promise<boolean> {
  const salt = base64ToBuffer(verification.salt);
  const derivedKey = await deriveKeyFromPassword(password, salt);
  
  const verificationHash = crypto
    .createHash('sha256')
    .update(derivedKey)
    .digest();
  
  const storedHash = base64ToBuffer(verification.hash);
  
  return crypto.timingSafeEqual(verificationHash, storedHash);
}

// ═══════════════════════════════════════════════════════════════════════════
// Data Encryption Key (DEK) Management
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a new Data Encryption Key (DEK)
 */
export function generateDEK(): Buffer {
  return generateRandomBytes(KEY_LENGTH);
}

/**
 * Encrypt a DEK with the master password (wrapping)
 */
export async function wrapDEK(
  dek: Buffer,
  masterPassword: string
): Promise<EncryptedKey> {
  const salt = generateRandomBytes(SALT_LENGTH);
  const kek = await deriveKeyFromPassword(masterPassword, salt);
  const iv = generateRandomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv('aes-256-gcm', kek, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  
  const encrypted = Buffer.concat([cipher.update(dek), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  return {
    encryptedDek: bufferToBase64(encrypted),
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt),
    authTag: bufferToBase64(authTag),
  };
}

/**
 * Decrypt a DEK with the master password (unwrapping)
 */
export async function unwrapDEK(
  encryptedKey: EncryptedKey,
  masterPassword: string
): Promise<Buffer> {
  const salt = base64ToBuffer(encryptedKey.salt);
  const kek = await deriveKeyFromPassword(masterPassword, salt);
  const iv = base64ToBuffer(encryptedKey.iv);
  const authTag = base64ToBuffer(encryptedKey.authTag);
  const encryptedDek = base64ToBuffer(encryptedKey.encryptedDek);
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', kek, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);
  
  return Buffer.concat([decipher.update(encryptedDek), decipher.final()]);
}

// ═══════════════════════════════════════════════════════════════════════════
// File Encryption
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Encrypt file data with a DEK
 */
export function encryptFile(
  data: Buffer,
  dek: Buffer
): EncryptedData {
  const iv = generateRandomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  return {
    ciphertext: bufferToBase64(encrypted),
    iv: bufferToBase64(iv),
    authTag: bufferToBase64(authTag),
  };
}

/**
 * Decrypt file data with a DEK
 */
export function decryptFile(
  encryptedData: EncryptedData,
  dek: Buffer
): Buffer {
  const iv = base64ToBuffer(encryptedData.iv);
  const authTag = base64ToBuffer(encryptedData.authTag);
  const ciphertext = base64ToBuffer(encryptedData.ciphertext);
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', dek, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);
  
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/**
 * Encrypt a file stream (for large files)
 * Returns a transform stream that encrypts data as it flows through
 */
export function createEncryptStream(dek: Buffer): {
  stream: crypto.CipherGCM;
  iv: string;
  getAuthTag: () => string;
} {
  const iv = generateRandomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  
  return {
    stream: cipher,
    iv: bufferToBase64(iv),
    getAuthTag: () => bufferToBase64(cipher.getAuthTag()),
  };
}

/**
 * Decrypt a file stream (for large files)
 */
export function createDecryptStream(
  dek: Buffer,
  iv: string,
  authTag: string
): crypto.DecipherGCM {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    dek,
    base64ToBuffer(iv),
    { authTagLength: AUTH_TAG_LENGTH }
  );
  decipher.setAuthTag(base64ToBuffer(authTag));
  
  return decipher;
}

// ═══════════════════════════════════════════════════════════════════════════
// Content Hashing (for duplicate detection)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate SHA-256 hash of file content
 */
export function hashContent(data: Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate hash incrementally for streams
 */
export function createHashStream(): crypto.Hash {
  return crypto.createHash('sha256');
}

// ═══════════════════════════════════════════════════════════════════════════
// Recovery Codes
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate recovery codes (one-time use emergency access)
 */
export function generateRecoveryCodes(count: number = 10): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Format: XXXX-XXXX-XXXX (12 chars, easy to read/type)
    const bytes = generateRandomBytes(9);
    const code = bytes
      .toString('base64')
      .replace(/[+/=]/g, '')
      .substring(0, 12)
      .toUpperCase()
      .match(/.{4}/g)
      ?.join('-') || '';
    codes.push(code);
  }
  
  return codes;
}

/**
 * Hash a recovery code for storage
 */
export function hashRecoveryCode(code: string): string {
  const normalized = code.replace(/-/g, '').toUpperCase();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Verify a recovery code against stored hash
 */
export function verifyRecoveryCode(code: string, storedHash: string): boolean {
  const inputHash = hashRecoveryCode(code);
  return crypto.timingSafeEqual(
    Buffer.from(inputHash, 'hex'),
    Buffer.from(storedHash, 'hex')
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// QR Code Challenge (for cross-device unlock)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a QR challenge for cross-device authentication
 */
export function generateQRChallenge(): {
  challenge: string;
  expiresAt: Date;
} {
  const challenge = generateRandomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  
  return { challenge, expiresAt };
}

/**
 * Create QR code data for approval request
 */
export function createQRApprovalData(
  vaultId: string,
  challenge: string,
  deviceName: string
): string {
  return JSON.stringify({
    type: 'vault_unlock',
    version: 1,
    vaultId,
    challenge,
    deviceName,
    timestamp: Date.now(),
  });
}

/**
 * Parse and validate QR approval data
 */
export function parseQRApprovalData(data: string): {
  valid: boolean;
  vaultId?: string;
  challenge?: string;
  deviceName?: string;
  error?: string;
} {
  try {
    const parsed = JSON.parse(data);
    
    if (parsed.type !== 'vault_unlock') {
      return { valid: false, error: 'Invalid QR code type' };
    }
    
    if (parsed.version !== 1) {
      return { valid: false, error: 'Unsupported QR code version' };
    }
    
    // Check if timestamp is recent (within 10 minutes)
    if (Date.now() - parsed.timestamp > 10 * 60 * 1000) {
      return { valid: false, error: 'QR code expired' };
    }
    
    return {
      valid: true,
      vaultId: parsed.vaultId,
      challenge: parsed.challenge,
      deviceName: parsed.deviceName,
    };
  } catch {
    return { valid: false, error: 'Invalid QR code format' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Backup Encryption
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create an encrypted backup header
 * The backup file format:
 * [32 bytes: salt][12 bytes: iv][encrypted data][16 bytes: auth tag]
 */
export async function createBackupHeader(
  password: string
): Promise<{
  salt: Buffer;
  iv: Buffer;
  cipher: crypto.CipherGCM;
}> {
  const salt = generateRandomBytes(SALT_LENGTH * 2); // Extra salt for backup
  const kek = await deriveKeyFromPassword(password, salt);
  const iv = generateRandomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv('aes-256-gcm', kek, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  
  return { salt, iv, cipher };
}

/**
 * Create a decipher for reading encrypted backup
 */
export async function createBackupDecipher(
  password: string,
  salt: Buffer,
  iv: Buffer,
  authTag: Buffer
): Promise<crypto.DecipherGCM> {
  const kek = await deriveKeyFromPassword(password, salt);
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', kek, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);
  
  return decipher;
}

// ═══════════════════════════════════════════════════════════════════════════
// Key Rotation
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Re-encrypt a DEK with a new master password
 * Used when changing the master password
 */
export async function rotateKeyEncryption(
  encryptedKey: EncryptedKey,
  oldPassword: string,
  newPassword: string
): Promise<EncryptedKey> {
  // Unwrap with old password
  const dek = await unwrapDEK(encryptedKey, oldPassword);
  
  // Re-wrap with new password
  return wrapDEK(dek, newPassword);
}

// ═══════════════════════════════════════════════════════════════════════════
// Secure Memory Handling
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Securely zero out a buffer (best effort)
 * Note: JavaScript GC may still have copies, but this helps
 */
export function secureZero(buffer: Buffer): void {
  buffer.fill(0);
}

/**
 * Create a session key holder that auto-expires
 */
export class SessionKeyHolder {
  private key: Buffer | null = null;
  private expiresAt: number = 0;
  private readonly timeoutMs: number;
  private cleanupTimer: NodeJS.Timeout | null = null;
  
  constructor(timeoutMs: number = 30 * 60 * 1000) { // 30 minutes default
    this.timeoutMs = timeoutMs;
  }
  
  setKey(key: Buffer): void {
    this.clear();
    this.key = Buffer.from(key); // Make a copy
    this.expiresAt = Date.now() + this.timeoutMs;
    
    this.cleanupTimer = setTimeout(() => {
      this.clear();
    }, this.timeoutMs);
  }
  
  getKey(): Buffer | null {
    if (!this.key || Date.now() > this.expiresAt) {
      this.clear();
      return null;
    }
    return this.key;
  }
  
  isValid(): boolean {
    return this.key !== null && Date.now() <= this.expiresAt;
  }
  
  clear(): void {
    if (this.key) {
      secureZero(this.key);
      this.key = null;
    }
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.expiresAt = 0;
  }
  
  refresh(): void {
    if (this.key) {
      this.expiresAt = Date.now() + this.timeoutMs;
    }
  }
}
