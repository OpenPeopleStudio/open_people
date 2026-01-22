"use client";

import { useState, useEffect } from "react";
import type { VaultPreviewResponse } from "@/types/vault";
import { ImagePreview } from "./previews/ImagePreview";
import { PDFPreview } from "./previews/PDFPreview";
import { TextPreview } from "./previews/TextPreview";
import { GenericPreview } from "./previews/GenericPreview";

/* ═══════════════════════════════════════════════════════════════════════════
   File Preview Modal
   Displays decrypted file content in a modal with type-specific viewers
   ═══════════════════════════════════════════════════════════════════════════ */

interface FilePreviewModalProps {
  previewData: VaultPreviewResponse;
  sessionId: string;
  onClose: () => void;
}

export function FilePreviewModal({ previewData, sessionId, onClose }: FilePreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | ArrayBuffer | null>(null);

  useEffect(() => {
    loadPreviewContent();
  }, [previewData, sessionId]);

  async function loadPreviewContent() {
    try {
      setLoading(true);
      setError(null);

      // Fetch encrypted file
      const response = await fetch(previewData.download_url);
      if (!response.ok) {
        throw new Error("Failed to download file for preview");
      }

      const encryptedData = await response.arrayBuffer();

      // Import required decryption functions
      const { decryptFileForPreview, decryptFileForTextPreview } = await import("@/lib/vault/client-crypto");

      // Decrypt based on content type
      if (previewData.content_type.startsWith('image/')) {
        const dataUrl = await decryptFileForPreview(
          encryptedData,
          previewData.encryption_iv,
          previewData.content_type
        );
        setPreviewContent(dataUrl);
      } else if (previewData.content_type === 'application/pdf') {
        const dataUrl = await decryptFileForPreview(
          encryptedData,
          previewData.encryption_iv,
          previewData.content_type
        );
        setPreviewContent(dataUrl);
      } else if (isTextFile(previewData.content_type) || isCodeFile(previewData.filename)) {
        const textContent = await decryptFileForTextPreview(
          encryptedData,
          previewData.encryption_iv
        );
        setPreviewContent(textContent);
      } else {
        // For unsupported file types, show generic preview
        setPreviewContent(null);
      }

    } catch (err) {
      console.error("Preview load error:", err);
      setError(err instanceof Error ? err.message : "Failed to load preview");
    } finally {
      setLoading(false);
    }
  }

  function isTextFile(contentType: string): boolean {
    return contentType.startsWith('text/') ||
           contentType === 'application/json' ||
           contentType === 'application/xml' ||
           contentType === 'application/javascript';
  }

  function isCodeFile(filename: string): boolean {
    const ext = filename.toLowerCase().split('.').pop();
    return ['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'cpp', 'c', 'h', 'hpp', 'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'scala', 'sql', 'html', 'css', 'scss', 'less', 'json', 'xml', 'yaml', 'yml', 'md', 'txt', 'sh', 'bash', 'zsh', 'ps1'].includes(ext || '');
  }

  function renderPreview() {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-3 text-[var(--text-muted)]">
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Loading preview...</span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--surface-1)] flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-500 font-medium">Preview Failed</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">{error}</p>
        </div>
      );
    }

    // Render type-specific preview
    if (previewData.content_type.startsWith('image/') && typeof previewContent === 'string') {
      return <ImagePreview dataUrl={previewContent} filename={previewData.filename} />;
    }

    if (previewData.content_type === 'application/pdf' && typeof previewContent === 'string') {
      return <PDFPreview dataUrl={previewContent} filename={previewData.filename} />;
    }

    if ((isTextFile(previewData.content_type) || isCodeFile(previewData.filename)) && typeof previewContent === 'string') {
      return <TextPreview content={previewContent} filename={previewData.filename} />;
    }

    // Generic preview for unsupported types
    return <GenericPreview previewData={previewData} />;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--surface-2)] rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[var(--text-primary)] truncate">
              {previewData.filename}
            </h3>
            <p className="text-sm text-[var(--text-muted)]">
              {previewData.content_type} • {(previewData.size_bytes / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--surface-1)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors ml-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Preview Content */}
        <div className="overflow-auto max-h-[calc(90vh-80px)]">
          {renderPreview()}
        </div>
      </div>
    </div>
  );
}
