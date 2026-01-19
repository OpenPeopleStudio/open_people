/**
 * Client-Side Vault Encryption
 * 
 * Browser-based encryption using Web Crypto API.
 * Handles file encryption/decryption in the browser before upload/after download.
 * 
 * Security Model:
 * - DEK (Data Encryption Key) is received from server after unlock
 * - DEK is stored in memory only (sessionStorage for persistence across refreshes)
 * - Files are encrypted client-side before upload
 * - Files are decrypted client-side after download
 * - Server never sees unencrypted file contents
 */

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 128; // bits

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface EncryptedFile {
  encryptedData: ArrayBuffer;
  iv: string; // Base64
  authTag: string; // Base64 (included in ciphertext for GCM)
}

export interface DecryptedFile {
  data: ArrayBuffer;
  filename: string;
  contentType: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert ArrayBuffer to Base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generate random IV
 */
export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Compute SHA-256 hash of data
 */
export async function computeHash(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ═══════════════════════════════════════════════════════════════════════════
// Key Management
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Import a raw key (from Base64) into a CryptoKey
 */
export async function importKey(keyBase64: string): Promise<CryptoKey> {
  const keyBuffer = base64ToArrayBuffer(keyBase64);
  
  return crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: ALGORITHM, length: KEY_LENGTH },
    false, // not extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Session key storage with auto-expiry
 */
class VaultKeyManager {
  private cryptoKey: CryptoKey | null = null;
  private keyBase64: string | null = null;
  private expiresAt: number = 0;
  private sessionId: string | null = null;
  
  /**
   * Initialize the key manager with session data
   */
  async initialize(sessionId: string, keyBase64: string, expiresAt: Date): Promise<void> {
    this.sessionId = sessionId;
    this.keyBase64 = keyBase64;
    this.expiresAt = expiresAt.getTime();
    this.cryptoKey = await importKey(keyBase64);
    
    // Store in sessionStorage for page refresh persistence
    sessionStorage.setItem('vault_session_id', sessionId);
    sessionStorage.setItem('vault_encryption_key', keyBase64);
    sessionStorage.setItem('vault_expires_at', this.expiresAt.toString());
  }
  
  /**
   * Restore from sessionStorage
   */
  async restore(): Promise<boolean> {
    const sessionId = sessionStorage.getItem('vault_session_id');
    const keyBase64 = sessionStorage.getItem('vault_encryption_key');
    const expiresAt = sessionStorage.getItem('vault_expires_at');
    
    if (!sessionId || !keyBase64 || !expiresAt) {
      return false;
    }
    
    const expiry = parseInt(expiresAt, 10);
    if (Date.now() > expiry) {
      this.clear();
      return false;
    }
    
    this.sessionId = sessionId;
    this.keyBase64 = keyBase64;
    this.expiresAt = expiry;
    this.cryptoKey = await importKey(keyBase64);
    
    return true;
  }
  
  /**
   * Check if vault is unlocked
   */
  isUnlocked(): boolean {
    return this.cryptoKey !== null && Date.now() < this.expiresAt;
  }
  
  /**
   * Get the crypto key
   */
  getKey(): CryptoKey | null {
    if (!this.isUnlocked()) {
      return null;
    }
    return this.cryptoKey;
  }
  
  /**
   * Get session ID
   */
  getSessionId(): string | null {
    if (!this.isUnlocked()) {
      return null;
    }
    return this.sessionId;
  }
  
  /**
   * Get key as Base64 (for server communication)
   */
  getKeyBase64(): string | null {
    if (!this.isUnlocked()) {
      return null;
    }
    return this.keyBase64;
  }
  
  /**
   * Refresh expiry time
   */
  refresh(expiresAt: Date): void {
    this.expiresAt = expiresAt.getTime();
    sessionStorage.setItem('vault_expires_at', this.expiresAt.toString());
  }
  
  /**
   * Clear all stored keys
   */
  clear(): void {
    this.cryptoKey = null;
    this.keyBase64 = null;
    this.sessionId = null;
    this.expiresAt = 0;
    
    sessionStorage.removeItem('vault_session_id');
    sessionStorage.removeItem('vault_encryption_key');
    sessionStorage.removeItem('vault_expires_at');
  }
}

// Singleton instance
export const vaultKeyManager = new VaultKeyManager();

// ═══════════════════════════════════════════════════════════════════════════
// File Encryption
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Encrypt a file for upload
 * Returns encrypted data and IV
 */
export async function encryptFile(
  file: File | ArrayBuffer,
  key?: CryptoKey
): Promise<{ encryptedData: ArrayBuffer; iv: string; contentHash: string }> {
  const cryptoKey = key || vaultKeyManager.getKey();
  if (!cryptoKey) {
    throw new Error('Vault is locked. Please unlock first.');
  }
  
  // Get file data
  const data = file instanceof File ? await file.arrayBuffer() : file;
  
  // Compute hash of original content
  const contentHash = await computeHash(data);
  
  // Generate random IV
  const iv = generateIV();
  
  // Encrypt
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv.buffer as ArrayBuffer,
      tagLength: AUTH_TAG_LENGTH,
    },
    cryptoKey,
    data
  );
  
  return {
    encryptedData,
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    contentHash,
  };
}

/**
 * Decrypt file data after download
 */
export async function decryptFile(
  encryptedData: ArrayBuffer,
  ivBase64: string,
  key?: CryptoKey
): Promise<ArrayBuffer> {
  const cryptoKey = key || vaultKeyManager.getKey();
  if (!cryptoKey) {
    throw new Error('Vault is locked. Please unlock first.');
  }
  
  const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));
  
  // Decrypt
  const decryptedData = await crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv,
      tagLength: AUTH_TAG_LENGTH,
    },
    cryptoKey,
    encryptedData
  );
  
  return decryptedData;
}

/**
 * Encrypt file and return as Blob for upload
 */
export async function encryptFileForUpload(file: File): Promise<{
  encryptedBlob: Blob;
  iv: string;
  contentHash: string;
  originalSize: number;
}> {
  const { encryptedData, iv, contentHash } = await encryptFile(file);
  
  return {
    encryptedBlob: new Blob([encryptedData], { type: 'application/octet-stream' }),
    iv,
    contentHash,
    originalSize: file.size,
  };
}

/**
 * Decrypt downloaded data and return as Blob
 */
export async function decryptFileForDownload(
  encryptedData: ArrayBuffer,
  ivBase64: string,
  contentType: string
): Promise<Blob> {
  const decryptedData = await decryptFile(encryptedData, ivBase64);
  return new Blob([decryptedData], { type: contentType });
}

// ═══════════════════════════════════════════════════════════════════════════
// Streaming Encryption (for large files)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Encrypt a large file in chunks
 * Note: AES-GCM doesn't support streaming, so we process in chunks but encrypt whole
 * For very large files (>100MB), consider using AES-CTR with HMAC
 */
export async function encryptLargeFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ encryptedBlob: Blob; iv: string; contentHash: string }> {
  const cryptoKey = vaultKeyManager.getKey();
  if (!cryptoKey) {
    throw new Error('Vault is locked. Please unlock first.');
  }
  
  // For files under 100MB, use regular encryption
  if (file.size < 100 * 1024 * 1024) {
    onProgress?.(50);
    const result = await encryptFileForUpload(file);
    onProgress?.(100);
    return result;
  }
  
  // For very large files, we still need to read the whole file into memory
  // A production implementation might use chunked encryption with a different cipher
  onProgress?.(10);
  const data = await file.arrayBuffer();
  onProgress?.(30);
  
  const contentHash = await computeHash(data);
  onProgress?.(50);
  
  const iv = generateIV();
  
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv.buffer as ArrayBuffer,
      tagLength: AUTH_TAG_LENGTH,
    },
    cryptoKey,
    data
  );
  onProgress?.(90);
  
  return {
    encryptedBlob: new Blob([encryptedData], { type: 'application/octet-stream' }),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    contentHash,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Password Verification (client-side)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Derive a key from password using PBKDF2
 * This matches the server-side derivation
 */
export async function deriveKeyFromPassword(
  password: string,
  saltBase64: string,
  iterations: number = 150000
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const salt = base64ToArrayBuffer(saltBase64);
  
  // Import password as key material
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  // Derive the key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    true, // extractable for verification
    ['encrypt', 'decrypt']
  );
}

/**
 * Create password verification hash (for comparing with server)
 */
export async function createPasswordVerificationHash(
  password: string,
  saltBase64: string,
  iterations: number = 150000
): Promise<string> {
  const derivedKey = await deriveKeyFromPassword(password, saltBase64, iterations);
  const keyData = await crypto.subtle.exportKey('raw', derivedKey);
  
  // Hash the derived key
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
  return arrayBufferToBase64(hashBuffer);
}

// ═══════════════════════════════════════════════════════════════════════════
// Recovery Code Utilities
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format recovery code for display
 */
export function formatRecoveryCode(code: string): string {
  const clean = code.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  return clean.match(/.{1,4}/g)?.join('-') || clean;
}

/**
 * Normalize recovery code for verification
 */
export function normalizeRecoveryCode(code: string): string {
  return code.replace(/[^A-Z0-9]/gi, '').toUpperCase();
}

// ═══════════════════════════════════════════════════════════════════════════
// Secure Memory Utilities
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Attempt to securely clear sensitive string data
 * Note: JavaScript doesn't guarantee immediate garbage collection
 */
export function secureClear(str: string): void {
  // Convert to array and clear
  const arr = str.split('');
  for (let i = 0; i < arr.length; i++) {
    arr[i] = '\0';
  }
}

/**
 * Generate a random password suggestion
 */
export function generateStrongPassword(length: number = 20): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const values = crypto.getRandomValues(new Uint8Array(length));
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[values[i] % charset.length];
  }
  return password;
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length >= 12) score++;
  else feedback.push('Use at least 12 characters');
  
  if (password.length >= 16) score++;
  
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  else feedback.push('Mix uppercase and lowercase letters');
  
  if (/\d/.test(password)) score++;
  else feedback.push('Include numbers');
  
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  else feedback.push('Include special characters');
  
  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    score--;
    feedback.push('Avoid repeated characters');
  }
  
  if (/^(123|abc|qwerty|password)/i.test(password)) {
    score--;
    feedback.push('Avoid common patterns');
  }
  
  return {
    valid: score >= 3 && password.length >= 12,
    score: Math.max(0, Math.min(5, score)),
    feedback,
  };
}
