/**
 * Email Credentials Encryption
 * 
 * Uses the same encryption scheme as API keys for consistency.
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const ENCODING = "base64";

function getMasterKey(): Buffer {
  // Use the same key as API keys encryption, or a separate one
  const key = process.env.EMAIL_ENCRYPTION_KEY || process.env.API_KEYS_ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error("EMAIL_ENCRYPTION_KEY or API_KEYS_ENCRYPTION_KEY environment variable is not set");
  }
  
  if (key.length === 44) {
    return Buffer.from(key, "base64");
  }
  
  if (key.length === 64) {
    return Buffer.from(key, "hex");
  }
  
  if (key.length === 32) {
    return Buffer.from(key);
  }
  
  throw new Error("Encryption key must be 32 bytes (base64, hex, or raw)");
}

export interface EncryptedCredential {
  encrypted: string;
  iv: string;
}

export function encryptCredential(plaintext: string): EncryptedCredential {
  const masterKey = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  
  let encrypted = cipher.update(plaintext, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([encrypted, authTag]);
  
  return {
    encrypted: combined.toString(ENCODING),
    iv: iv.toString(ENCODING),
  };
}

export function decryptCredential(credential: EncryptedCredential): string {
  const masterKey = getMasterKey();
  const iv = Buffer.from(credential.iv, ENCODING);
  const combined = Buffer.from(credential.encrypted, ENCODING);
  
  const ciphertext = combined.subarray(0, combined.length - AUTH_TAG_LENGTH);
  const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString("utf8");
}
