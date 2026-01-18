/* ═══════════════════════════════════════════════════════════════════════════
   Cloud Storage Types
   Types for the Cloudflare R2-powered storage add-on
   ═══════════════════════════════════════════════════════════════════════════ */

export type StorageTier = "free" | "starter" | "pro" | "enterprise";

export type StoragePlan = {
  tier: StorageTier;
  name: string;
  price: number; // monthly price in dollars
  storageLimit: number; // in bytes
  bandwidthLimit: number; // in bytes per month
  maxFileSize: number; // in bytes
  features: string[];
};

export const STORAGE_PLANS: Record<StorageTier, StoragePlan> = {
  free: {
    tier: "free",
    name: "Free",
    price: 0,
    storageLimit: 1 * 1024 * 1024 * 1024, // 1 GB
    bandwidthLimit: 5 * 1024 * 1024 * 1024, // 5 GB/month
    maxFileSize: 10 * 1024 * 1024, // 10 MB
    features: ["1 GB storage", "5 GB bandwidth/month", "10 MB max file size"],
  },
  starter: {
    tier: "starter",
    name: "Starter",
    price: 9,
    storageLimit: 10 * 1024 * 1024 * 1024, // 10 GB
    bandwidthLimit: 50 * 1024 * 1024 * 1024, // 50 GB/month
    maxFileSize: 100 * 1024 * 1024, // 100 MB
    features: [
      "10 GB storage",
      "50 GB bandwidth/month",
      "100 MB max file size",
      "File versioning",
    ],
  },
  pro: {
    tier: "pro",
    name: "Pro",
    price: 29,
    storageLimit: 100 * 1024 * 1024 * 1024, // 100 GB
    bandwidthLimit: 500 * 1024 * 1024 * 1024, // 500 GB/month
    maxFileSize: 1024 * 1024 * 1024, // 1 GB
    features: [
      "100 GB storage",
      "500 GB bandwidth/month",
      "1 GB max file size",
      "File versioning",
      "CDN acceleration",
      "Custom domains",
    ],
  },
  enterprise: {
    tier: "enterprise",
    name: "Enterprise",
    price: 99,
    storageLimit: 1024 * 1024 * 1024 * 1024, // 1 TB
    bandwidthLimit: 5 * 1024 * 1024 * 1024 * 1024, // 5 TB/month
    maxFileSize: 5 * 1024 * 1024 * 1024, // 5 GB
    features: [
      "1 TB storage",
      "5 TB bandwidth/month",
      "5 GB max file size",
      "File versioning",
      "CDN acceleration",
      "Custom domains",
      "SLA guarantee",
      "Priority support",
    ],
  },
};

export type StorageFile = {
  id: string;
  tenant_id: string;
  bucket: string;
  key: string; // path/to/file.ext
  filename: string;
  content_type: string;
  size: number; // in bytes
  etag: string | null;
  metadata: Record<string, string> | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null; // soft delete for versioning
};

export type StorageBucket = {
  id: string;
  tenant_id: string;
  name: string;
  is_public: boolean;
  cors_origins: string[] | null;
  created_at: string;
};

export type StorageUsage = {
  tenant_id: string;
  period_start: string;
  storage_bytes: number;
  bandwidth_bytes: number;
  file_count: number;
  request_count: number;
};

export type StorageSubscription = {
  id: string;
  tenant_id: string;
  tier: StorageTier;
  status: "active" | "trialing" | "canceled" | "past_due";
  current_period_start: string;
  current_period_end: string;
  created_at: string;
};

export type UploadUrlResponse = {
  uploadUrl: string;
  fileId: string;
  key: string;
  expiresAt: string;
};

export type DownloadUrlResponse = {
  downloadUrl: string;
  expiresAt: string;
};

// Helper functions
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function getStorageUsagePercent(used: number, limit: number): number {
  return Math.min((used / limit) * 100, 100);
}

export function isStorageLimitExceeded(used: number, limit: number): boolean {
  return used >= limit;
}

export function canUploadFile(
  currentUsage: number,
  fileSize: number,
  plan: StoragePlan
): { allowed: boolean; reason?: string } {
  if (fileSize > plan.maxFileSize) {
    return {
      allowed: false,
      reason: `File size exceeds maximum allowed (${formatBytes(plan.maxFileSize)})`,
    };
  }

  if (currentUsage + fileSize > plan.storageLimit) {
    return {
      allowed: false,
      reason: `Storage limit would be exceeded. Upgrade your plan for more storage.`,
    };
  }

  return { allowed: true };
}
