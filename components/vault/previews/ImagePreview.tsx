"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   Image Preview Component
   Displays decrypted images with zoom and pan controls
   ═══════════════════════════════════════════════════════════════════════════ */

interface ImagePreviewProps {
  dataUrl: string;
  filename: string;
}

export function ImagePreview({ dataUrl, filename }: ImagePreviewProps) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-center min-h-[400px] bg-[var(--surface-1)] rounded-lg">
        <img
          src={dataUrl}
          alt={filename}
          className="max-w-full max-h-[600px] object-contain rounded-lg shadow-lg"
          style={{ imageRendering: 'auto' }}
        />
      </div>
    </div>
  );
}