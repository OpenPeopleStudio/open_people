"use client";

import type { VaultPreviewResponse } from "@/types/vault";
import { formatBytes, getCategoryIcon, getCategoryColor, getCategoryLabel } from "@/types/vault";

/* ═══════════════════════════════════════════════════════════════════════════
   Generic Preview Component
   Shows file metadata and download option for unsupported file types
   ═══════════════════════════════════════════════════════════════════════════ */

interface GenericPreviewProps {
  previewData: VaultPreviewResponse;
}

export function GenericPreview({ previewData }: GenericPreviewProps) {
  const categoryColor = getCategoryColor(previewData.ai_category);

  return (
    <div className="p-4">
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6"
          style={{ backgroundColor: `${categoryColor}20` }}
        >
          <svg
            className="w-12 h-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1}
            style={{ color: categoryColor }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d={getCategoryIcon(previewData.ai_category)} />
          </svg>
        </div>

        <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          {previewData.filename}
        </h3>

        <p className="text-[var(--text-muted)] mb-4">
          {getCategoryLabel(previewData.ai_category)} • {formatBytes(previewData.size_bytes)}
        </p>

        {previewData.ai_summary && (
          <p className="text-sm text-[var(--text-muted)] mb-6 max-w-md">
            {previewData.ai_summary}
          </p>
        )}

        <div className="text-sm text-[var(--text-muted)]">
          <p className="mb-2">Content type: {previewData.content_type}</p>
          <p>This file type cannot be previewed in the browser.</p>
          <p className="mt-2">Use the download button to view the file.</p>
        </div>
      </div>
    </div>
  );
}