/**
 * Client-Side Thumbnail Generation for Vault Files
 *
 * Generates thumbnails for image files before encryption and upload.
 * Maintains zero-knowledge encryption by generating thumbnails client-side.
 */

const THUMBNAIL_SIZE = 256; // pixels
const THUMBNAIL_QUALITY = 0.85; // JPEG quality (0-1)

/**
 * Generate thumbnail from image file
 */
export async function generateImageThumbnail(file: File): Promise<{ thumbnail: File; dataUrl: string } | null> {
  // Skip if not an image
  if (!file.type.startsWith('image/')) {
    return null;
  }

  // Skip very large images
  if (file.size > 50 * 1024 * 1024) { // 50MB
    console.log(`Skipping thumbnail generation for large file: ${file.size} bytes`);
    return null;
  }

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate thumbnail dimensions
      const aspectRatio = img.width / img.height;
      let { width, height } = img;

      if (width > height) {
        if (width > THUMBNAIL_SIZE) {
          width = THUMBNAIL_SIZE;
          height = width / aspectRatio;
        }
      } else {
        if (height > THUMBNAIL_SIZE) {
          height = THUMBNAIL_SIZE;
          width = height * aspectRatio;
        }
      }

      // Set canvas size
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const thumbnailFile = new File(
            [blob],
            `thumbnail-${file.name}`,
            { type: 'image/jpeg' }
          );

          // Also create data URL for preview
          const dataUrl = canvas.toDataURL('image/jpeg', THUMBNAIL_QUALITY);

          resolve({ thumbnail: thumbnailFile, dataUrl });
        } else {
          resolve(null);
        }
      }, 'image/jpeg', THUMBNAIL_QUALITY);
    };

    img.onerror = () => {
      console.error('Failed to load image for thumbnail generation');
      resolve(null);
    };

    // Load image
    const url = URL.createObjectURL(file);
    img.src = url;

    // Clean up object URL after loading
    img.onload = () => {
      URL.revokeObjectURL(url);
      // Continue with original onload logic
      const aspectRatio = img.width / img.height;
      let { width, height } = img;

      if (width > height) {
        if (width > THUMBNAIL_SIZE) {
          width = THUMBNAIL_SIZE;
          height = width / aspectRatio;
        }
      } else {
        if (height > THUMBNAIL_SIZE) {
          height = THUMBNAIL_SIZE;
          width = height * aspectRatio;
        }
      }

      canvas.width = width;
      canvas.height = height;

      ctx?.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (blob) {
          const thumbnailFile = new File(
            [blob],
            `thumbnail-${file.name}`,
            { type: 'image/jpeg' }
          );

          const dataUrl = canvas.toDataURL('image/jpeg', THUMBNAIL_QUALITY);

          resolve({ thumbnail: thumbnailFile, dataUrl });
        } else {
          resolve(null);
        }
      }, 'image/jpeg', THUMBNAIL_QUALITY);
    };
  });
}