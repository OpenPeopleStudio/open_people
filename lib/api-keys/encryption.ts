/**
 * API Key Encryption Utilities
 * 
 * Server-side encryption for API key storage.
 * Uses AES-256-GCM with a master key derived from environment variable.
 */

import crypto from "crypto";

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const ENCODING = "base64";

// Master key from environment (should be 32 bytes / 256 bits)
function getMasterKey(): Buffer {
  const key = process.env.API_KEYS_ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error("API_KEYS_ENCRYPTION_KEY environment variable is not set");
  }
  
  // If key is base64 encoded
  if (key.length === 44) {
    return Buffer.from(key, "base64");
  }
  
  // If key is hex encoded
  if (key.length === 64) {
    return Buffer.from(key, "hex");
  }
  
  // If key is raw (32 bytes)
  if (key.length === 32) {
    return Buffer.from(key);
  }
  
  throw new Error("API_KEYS_ENCRYPTION_KEY must be 32 bytes (base64, hex, or raw)");
}

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface EncryptedKey {
  encryptedKey: string;  // Base64 encoded ciphertext + auth tag
  iv: string;            // Base64 encoded IV
}

// ═══════════════════════════════════════════════════════════════════════════
// Encryption Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Encrypt an API key for storage
 */
export function encryptApiKey(plainKey: string): EncryptedKey {
  const masterKey = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  
  let encrypted = cipher.update(plainKey, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  const authTag = cipher.getAuthTag();
  
  // Combine ciphertext and auth tag
  const combined = Buffer.concat([encrypted, authTag]);
  
  return {
    encryptedKey: combined.toString(ENCODING),
    iv: iv.toString(ENCODING),
  };
}

/**
 * Decrypt an API key from storage
 */
export function decryptApiKey(encrypted: EncryptedKey): string {
  const masterKey = getMasterKey();
  const iv = Buffer.from(encrypted.iv, ENCODING);
  const combined = Buffer.from(encrypted.encryptedKey, ENCODING);
  
  // Split ciphertext and auth tag
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

/**
 * Generate a hint from the API key (last 4-6 characters)
 */
export function generateKeyHint(plainKey: string): string {
  if (plainKey.length <= 8) {
    return "****";
  }
  
  // For keys like "sk-abc123xyz", show "...xyz"
  const suffix = plainKey.slice(-6);
  return `...${suffix}`;
}

/**
 * Mask an API key for display (show first and last few chars)
 */
export function maskApiKey(plainKey: string): string {
  if (plainKey.length <= 12) {
    return "*".repeat(plainKey.length);
  }
  
  const prefix = plainKey.slice(0, 4);
  const suffix = plainKey.slice(-4);
  const middle = "*".repeat(Math.min(20, plainKey.length - 8));
  
  return `${prefix}${middle}${suffix}`;
}

/**
 * Validate API key format for common providers
 */
export function validateKeyFormat(provider: string, key: string): { valid: boolean; error?: string } {
  const validators: Record<string, (k: string) => boolean> = {
    openai: (k) => k.startsWith("sk-") && k.length > 20,
    anthropic: (k) => k.startsWith("sk-ant-") && k.length > 20,
    cloudflare: (k) => k.length >= 32,
    stripe: (k) => k.startsWith("sk_") || k.startsWith("rk_") || k.startsWith("pk_"),
    resend: (k) => k.startsWith("re_") && k.length > 10,
    twilio: (k) => k.length >= 32,
    github: (k) => k.startsWith("ghp_") || k.startsWith("github_pat_") || k.length >= 40,
    vercel: (k) => k.length >= 20,
    supabase: (k) => k.startsWith("eyJ") || k.length >= 32, // JWT or service role
    aws: (k) => k.length >= 16,
    custom: () => true, // No validation for custom keys
  };
  
  const validator = validators[provider] || validators.custom;
  
  if (!validator(key)) {
    return {
      valid: false,
      error: `Invalid key format for ${provider}. Please check the key and try again.`,
    };
  }
  
  return { valid: true };
}

/**
 * Generate a new encryption key (for initial setup)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("base64");
}

// ═══════════════════════════════════════════════════════════════════════════
// Provider Utilities
// ═══════════════════════════════════════════════════════════════════════════

export const PROVIDERS = [
  { id: "openai", name: "OpenAI", icon: "🤖", color: "#10a37f" },
  { id: "anthropic", name: "Anthropic", icon: "🧠", color: "#d4a574" },
  { id: "cloudflare", name: "Cloudflare", icon: "☁️", color: "#f38020" },
  { id: "stripe", name: "Stripe", icon: "💳", color: "#635bff" },
  { id: "resend", name: "Resend", icon: "📧", color: "#000000" },
  { id: "twilio", name: "Twilio", icon: "📱", color: "#f22f46" },
  { id: "github", name: "GitHub", icon: "🐙", color: "#333333" },
  { id: "vercel", name: "Vercel", icon: "▲", color: "#000000" },
  { id: "supabase", name: "Supabase", icon: "⚡", color: "#3ecf8e" },
  { id: "aws", name: "AWS", icon: "☁️", color: "#ff9900" },
  { id: "custom", name: "Custom", icon: "🔑", color: "#6b7280" },
] as const;

export type ProviderId = typeof PROVIDERS[number]["id"];

export function getProviderInfo(providerId: string) {
  return PROVIDERS.find(p => p.id === providerId) || PROVIDERS.find(p => p.id === "custom")!;
}

export const ENVIRONMENTS = [
  { id: "development", name: "Development", color: "#22c55e" },
  { id: "staging", name: "Staging", color: "#eab308" },
  { id: "production", name: "Production", color: "#ef4444" },
] as const;

export type EnvironmentId = typeof ENVIRONMENTS[number]["id"];
