/**
 * Thumbnail Generation for Vault Files
 *
 * Generates thumbnails for image files during upload confirmation.
 * Thumbnails are stored encrypted alongside the original files.
 */

import sharp from 'sharp';
import { getUploadUrl } from '@/lib/storage/r2';
import { encryptFileForUpload } from './client-crypto';
import type { VaultEncryptionKey } from '@/types/vault';

const THUMBNAIL_SIZE = 256; // pixels
const THUMBNAIL_QUALITY = 85; // JPEG quality

/**
 * Generate thumbnail for an image file
 */
export async function generateImageThumbnail(
  imageBuffer: ArrayBuffer,
  contentType: string,
  vaultId: string,
  fileId: string,
  encryptionKey: VaultEncryptionKey
): Promise<{ thumbnailKey: string; thumbnailSize: number } | null> {
  try {
    // Skip if not an image
    if (!contentType.startsWith('image/')) {
      return null;
    }

    // Skip very large images to avoid memory issues
    if (imageBuffer.byteLength > 50 * 1024 * 1024) { // 50MB
      console.log(`Skipping thumbnail generation for large file: ${imageBuffer.byteLength} bytes`);
      return null;
    }

    // Generate thumbnail using Sharp
    const thumbnailBuffer = await sharp(Buffer.from(imageBuffer))
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: THUMBNAIL_QUALITY })
      .toBuffer();

    // Encrypt the thumbnail
    const encryptedThumbnail = await encryptFileForUpload(
      new File([thumbnailBuffer], 'thumbnail.jpg', { type: 'image/jpeg' })
    );

    // Get upload URL for thumbnail
    const { url: uploadUrl, key: thumbnailKey } = await getUploadUrl(
      vaultId,
      "vault-thumbnails",
      `${fileId}.enc`,
      'image/jpeg',
      3600 // 1 hour expiry
    );

    // Upload encrypted thumbnail to R2
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: encryptedThumbnail.encryptedBlob,
      headers: {
        'Content-Type': 'image/jpeg',
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload thumbnail: ${uploadResponse.status}`);
    }

    return {
      thumbnailKey,
      thumbnailSize: encryptedThumbnail.encryptedBlob.size,
    };

  } catch (error) {
    console.error('Thumbnail generation failed:', error);
    return null;
  }
}