import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/* ═══════════════════════════════════════════════════════════════════════════
   Cloudflare R2 Storage Client
   S3-compatible object storage with zero egress fees
   ═══════════════════════════════════════════════════════════════════════════ */

// R2 Configuration
const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "openpeople-storage";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ""; // Optional: Custom domain for public files

// Create S3 client configured for R2
export function createR2Client(): S3Client {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error("R2 credentials not configured");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

// Generate the storage key for a tenant file
export function getTenantFileKey(
  tenantId: string,
  bucket: string,
  path: string
): string {
  // Format: tenants/{tenant_id}/{bucket}/{path}
  const cleanPath = path.replace(/^\/+/, "");
  return `tenants/${tenantId}/${bucket}/${cleanPath}`;
}

// Generate a presigned URL for uploading a file
export async function getUploadUrl(
  tenantId: string,
  bucket: string,
  filename: string,
  contentType: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<{ url: string; key: string }> {
  const client = createR2Client();
  const key = getTenantFileKey(tenantId, bucket, filename);

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    Metadata: {
      "tenant-id": tenantId,
      "bucket-name": bucket,
      "original-filename": filename,
    },
  });

  const url = await getSignedUrl(client, command, { expiresIn });

  return { url, key };
}

// Generate a presigned URL for downloading a file
export async function getDownloadUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  const client = createR2Client();

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

// Get public URL for a file (if R2_PUBLIC_URL is configured)
export function getPublicUrl(key: string): string | null {
  if (!R2_PUBLIC_URL) return null;
  return `${R2_PUBLIC_URL}/${key}`;
}

// Upload a file directly (for server-side uploads)
export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string,
  metadata?: Record<string, string>
): Promise<{ etag: string | undefined }> {
  const client = createR2Client();

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
    Metadata: metadata,
  });

  const response = await client.send(command);
  return { etag: response.ETag };
}

// Download a file
export async function downloadFile(
  key: string
): Promise<{ body: ReadableStream | null; contentType: string | undefined; size: number | undefined }> {
  const client = createR2Client();

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  const response = await client.send(command);

  return {
    body: response.Body?.transformToWebStream() || null,
    contentType: response.ContentType,
    size: response.ContentLength,
  };
}

// Delete a file
export async function deleteFile(key: string): Promise<void> {
  const client = createR2Client();

  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  await client.send(command);
}

// Delete multiple files (for cleanup)
export async function deleteFiles(keys: string[]): Promise<void> {
  const client = createR2Client();

  // R2 doesn't support bulk delete, so we delete one by one
  await Promise.all(
    keys.map((key) =>
      client.send(
        new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
        })
      )
    )
  );
}

// Get file metadata
export async function getFileMetadata(
  key: string
): Promise<{ size: number; contentType: string; etag: string; lastModified: Date } | null> {
  const client = createR2Client();

  try {
    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    const response = await client.send(command);

    return {
      size: response.ContentLength || 0,
      contentType: response.ContentType || "application/octet-stream",
      etag: response.ETag || "",
      lastModified: response.LastModified || new Date(),
    };
  } catch {
    return null;
  }
}

// List files in a tenant's bucket
export async function listFiles(
  tenantId: string,
  bucket: string,
  prefix?: string,
  maxKeys: number = 1000
): Promise<{
  files: { key: string; size: number; lastModified: Date }[];
  truncated: boolean;
}> {
  const client = createR2Client();
  const fullPrefix = prefix
    ? getTenantFileKey(tenantId, bucket, prefix)
    : `tenants/${tenantId}/${bucket}/`;

  const command = new ListObjectsV2Command({
    Bucket: R2_BUCKET_NAME,
    Prefix: fullPrefix,
    MaxKeys: maxKeys,
  });

  const response = await client.send(command);

  const files = (response.Contents || []).map((obj) => ({
    key: obj.Key || "",
    size: obj.Size || 0,
    lastModified: obj.LastModified || new Date(),
  }));

  return {
    files,
    truncated: response.IsTruncated || false,
  };
}

// Calculate total storage used by a tenant
export async function getTenantStorageUsed(tenantId: string): Promise<number> {
  const client = createR2Client();
  const prefix = `tenants/${tenantId}/`;

  let totalSize = 0;
  let continuationToken: string | undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    });

    const response = await client.send(command);

    for (const obj of response.Contents || []) {
      totalSize += obj.Size || 0;
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return totalSize;
}

// Delete all files for a tenant (for cleanup when tenant is deleted)
export async function deleteTenantFiles(tenantId: string): Promise<number> {
  const client = createR2Client();
  const prefix = `tenants/${tenantId}/`;

  let deletedCount = 0;
  let continuationToken: string | undefined;

  do {
    const listCommand = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    });

    const response = await client.send(listCommand);

    const keys = (response.Contents || [])
      .map((obj) => obj.Key)
      .filter((key): key is string => !!key);

    if (keys.length > 0) {
      await deleteFiles(keys);
      deletedCount += keys.length;
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return deletedCount;
}
