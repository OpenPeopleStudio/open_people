/**
 * Quick Share Token Utilities
 */

import crypto from "crypto";

const TOKEN_PREFIX = "qs_";
const TOKEN_LENGTH = 48; // 48 bytes = 64 chars base64

/**
 * Generate a new upload token
 */
export function generateUploadToken(): { token: string; hash: string; prefix: string } {
  const randomBytes = crypto.randomBytes(TOKEN_LENGTH);
  const token = TOKEN_PREFIX + randomBytes.toString("base64url");
  const hash = hashToken(token);
  const prefix = token.slice(0, 12); // "qs_" + first 9 chars
  
  return { token, hash, prefix };
}

/**
 * Hash a token for storage (we never store the raw token)
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Validate token format
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token.startsWith(TOKEN_PREFIX)) return false;
  if (token.length < 20) return false;
  return true;
}

/**
 * Extract prefix from token for display
 */
export function getTokenPrefix(token: string): string {
  return token.slice(0, 12);
}

/**
 * Format token for display (shows prefix + masked)
 */
export function formatTokenForDisplay(prefix: string): string {
  return `${prefix}${"•".repeat(20)}`;
}

/**
 * Parse client type from user agent
 */
export function parseClientType(userAgent: string | null): string {
  if (!userAgent) return "unknown";
  
  const ua = userAgent.toLowerCase();
  
  if (ua.includes("vault-cli")) return "cli";
  if (ua.includes("vault-extension")) return "extension";
  if (ua.includes("vault-mobile") || ua.includes("okhttp") || ua.includes("darwin")) {
    if (ua.includes("iphone") || ua.includes("ipad")) return "mobile-ios";
    if (ua.includes("android")) return "mobile-android";
    return "mobile";
  }
  if (ua.includes("mozilla") || ua.includes("chrome") || ua.includes("safari")) return "web";
  
  return "other";
}

/**
 * Check if content type is allowed
 */
export function isContentTypeAllowed(contentType: string, allowedTypes: string[]): boolean {
  if (!allowedTypes || allowedTypes.length === 0) return true;
  
  // Check exact match
  if (allowedTypes.includes(contentType)) return true;
  
  // Check wildcard matches (e.g., "image/*")
  const [type] = contentType.split("/");
  if (allowedTypes.includes(`${type}/*`)) return true;
  
  return false;
}

/**
 * Common content type groups for UI
 */
export const CONTENT_TYPE_GROUPS = {
  images: ["image/*"],
  documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/markdown",
  ],
  archives: [
    "application/zip",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    "application/gzip",
  ],
  code: [
    "text/plain",
    "text/javascript",
    "text/typescript",
    "text/css",
    "text/html",
    "application/json",
    "application/xml",
  ],
};
