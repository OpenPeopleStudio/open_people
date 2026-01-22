"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { formatBytes } from "@/types/vault";
import { encryptFileForUpload } from "@/lib/vault/client-crypto";
import { generateImageThumbnail } from "@/lib/vault/client-thumbnails";

/* ═══════════════════════════════════════════════════════════════════════════
   Upload Dropzone Component
   Full-screen drag-and-drop upload with progress
   ═══════════════════════════════════════════════════════════════════════════ */

interface UploadDropzoneProps {
  sessionId: string;
  folderId: string | null;
  onComplete: () => void;
  onClose: () => void;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "processing" | "complete" | "error";
  error?: string;
}

export function UploadDropzone({ sessionId, folderId, onComplete, onClose }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  
  // Global drag listeners
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current++;
      if (dragCounterRef.current === 1) {
        setIsDragging(true);
      }
    };
    
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) {
        setIsDragging(false);
      }
    };
    
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDragging(false);
      
      if (e.dataTransfer?.files) {
        handleFiles(Array.from(e.dataTransfer.files));
      }
    };
    
    document.addEventListener("dragenter", handleDragEnter);
    document.addEventListener("dragleave", handleDragLeave);
    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("drop", handleDrop);
    
    return () => {
      document.removeEventListener("dragenter", handleDragEnter);
      document.removeEventListener("dragleave", handleDragLeave);
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("drop", handleDrop);
    };
  }, []);
  
  const handleFiles = useCallback((newFiles: File[]) => {
    const uploadingFiles: UploadingFile[] = newFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: "pending",
    }));
    
    setFiles(prev => [...prev, ...uploadingFiles]);
  }, []);
  
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };
  
  async function uploadFile(uploadingFile: UploadingFile) {
    const { file, id } = uploadingFile;
    
    try {
      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === id ? { ...f, status: "uploading", progress: 5 } : f
      ));
      
      // 1. Generate thumbnail if image
      setFiles(prev => prev.map(f =>
        f.id === id ? { ...f, progress: 5 } : f
      ));

      const thumbnail = await generateImageThumbnail(file);

      // 2. Encrypt file client-side
      setFiles(prev => prev.map(f =>
        f.id === id ? { ...f, progress: 15 } : f
      ));

      const { encryptedBlob, iv, contentHash } = await encryptFileForUpload(file);

      setFiles(prev => prev.map(f =>
        f.id === id ? { ...f, progress: 35 } : f
      ));
      
      // 3. Encrypt thumbnail if exists
      let encryptedThumbnail = null;
      if (thumbnail) {
        encryptedThumbnail = await encryptFileForUpload(thumbnail.thumbnail);
      }

      // 4. Get upload URLs from server
      const initRes = await fetch("/api/vault/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vault-session": sessionId,
        },
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type || "application/octet-stream",
          size_bytes: encryptedBlob.size, // Use encrypted size
          folder_id: folderId,
          encryption_iv: iv, // Send IV to server for storage
          has_thumbnail: !!encryptedThumbnail,
        }),
      });

      if (!initRes.ok) {
        throw new Error("Failed to initialize upload");
      }

      const { file_id, upload_url, thumbnail_upload_url, thumbnail_key } = await initRes.json();

      // 5. Upload thumbnail if exists
      if (encryptedThumbnail && thumbnail_upload_url) {
        const thumbnailUploadRes = await fetch(thumbnail_upload_url, {
          method: "PUT",
          body: encryptedThumbnail.encryptedBlob,
          headers: {
            "Content-Type": "application/octet-stream",
          },
        });

        if (!thumbnailUploadRes.ok) {
          console.warn("Thumbnail upload failed, continuing with main file");
        }
      }

      setFiles(prev => prev.map(f =>
        f.id === id ? { ...f, progress: 50 } : f
      ));

      // 6. Upload encrypted file to R2
      const uploadRes = await fetch(upload_url, {
        method: "PUT",
        body: encryptedBlob,
        headers: {
          "Content-Type": "application/octet-stream", // Encrypted data is binary
        },
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload file");
      }

      setFiles(prev => prev.map(f =>
        f.id === id ? { ...f, progress: 85, status: "processing" } : f
      ));
      
      // 7. Confirm upload with content hash and thumbnail info
      const confirmRes = await fetch("/api/vault/files/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vault-session": sessionId,
        },
        body: JSON.stringify({
          file_id,
          content_hash: contentHash,
          encryption_iv: iv,
          thumbnail_key: thumbnail_key || null,
        }),
      });
      
      if (!confirmRes.ok) {
        throw new Error("Failed to confirm upload");
      }
      
      setFiles(prev => prev.map(f => 
        f.id === id ? { ...f, progress: 100, status: "complete" } : f
      ));
      
    } catch (err) {
      console.error("Upload error:", err);
      setFiles(prev => prev.map(f => 
        f.id === id ? { 
          ...f, 
          status: "error", 
          error: err instanceof Error ? err.message : "Upload failed" 
        } : f
      ));
    }
  }
  
  async function startUpload() {
    if (files.length === 0 || isUploading) return;
    
    setIsUploading(true);
    
    const pendingFiles = files.filter(f => f.status === "pending");
    
    // Upload files in parallel (max 3 at a time)
    const batchSize = 3;
    for (let i = 0; i < pendingFiles.length; i += batchSize) {
      const batch = pendingFiles.slice(i, i + batchSize);
      await Promise.all(batch.map(uploadFile));
    }
    
    setIsUploading(false);
  }
  
  function removeFile(id: string) {
    setFiles(prev => prev.filter(f => f.id !== id));
  }
  
  function handleDone() {
    const hasCompleted = files.some(f => f.status === "complete");
    if (hasCompleted) {
      onComplete();
    } else {
      onClose();
    }
  }
  
  const pendingCount = files.filter(f => f.status === "pending").length;
  const completedCount = files.filter(f => f.status === "complete").length;
  const errorCount = files.filter(f => f.status === "error").length;
  const totalSize = files.reduce((sum, f) => sum + f.file.size, 0);
  
  return (
    <div className="fixed inset-0 z-50 bg-[var(--void)]/90 backdrop-blur-sm flex items-center justify-center p-8">
      <div className="w-full max-w-2xl bg-[var(--surface-1)] rounded-2xl border border-[var(--border-subtle)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Upload Files</h2>
            {folderId && (
              <p className="text-sm text-[var(--text-muted)]">Uploading to current folder</p>
            )}
          </div>
          <button
            onClick={handleDone}
            className="p-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Dropzone */}
        <div
          className={`p-8 border-2 border-dashed m-4 rounded-xl transition-colors ${
            isDragging
              ? "border-[var(--electric-lime)] bg-[var(--electric-lime)]/5"
              : "border-[var(--border-subtle)] hover:border-[var(--border-default)]"
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
          
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center mx-auto mb-4">
              <svg
                className={`w-8 h-8 ${isDragging ? "text-[var(--electric-lime)]" : "text-[var(--text-muted)]"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
            </div>
            <p className="text-[var(--text-primary)] font-medium mb-1">
              {isDragging ? "Drop files here" : "Drag and drop files here"}
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              or click to browse
            </p>
          </div>
        </div>
        
        {/* File list */}
        {files.length > 0 && (
          <div className="px-4 pb-4">
            <div className="rounded-lg bg-[var(--surface-2)] overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                {files.map(f => (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle)] last:border-0"
                  >
                    {/* Status icon */}
                    <div className="w-8 h-8 rounded-lg bg-[var(--surface-1)] flex items-center justify-center shrink-0">
                      {f.status === "complete" ? (
                        <svg className="w-4 h-4 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : f.status === "error" ? (
                        <svg className="w-4 h-4 text-[var(--error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : f.status === "uploading" || f.status === "processing" ? (
                        <svg className="w-4 h-4 text-[var(--electric-lime)] animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      )}
                    </div>
                    
                    {/* File info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text-primary)] truncate">{f.file.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[var(--text-muted)]">
                          {formatBytes(f.file.size)}
                        </span>
                        {f.status === "uploading" && (
                          <span className="text-xs text-[var(--electric-lime)]">
                            Uploading... {f.progress}%
                          </span>
                        )}
                        {f.status === "processing" && (
                          <span className="text-xs text-[var(--electric-lime)]">
                            Processing...
                          </span>
                        )}
                        {f.status === "complete" && (
                          <span className="text-xs text-[var(--success)]">
                            Complete
                          </span>
                        )}
                        {f.status === "error" && (
                          <span className="text-xs text-[var(--error)]">
                            {f.error || "Failed"}
                          </span>
                        )}
                      </div>
                      
                      {/* Progress bar */}
                      {(f.status === "uploading" || f.status === "processing") && (
                        <div className="mt-1.5 h-1 bg-[var(--surface-1)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--electric-lime)] rounded-full transition-all duration-300"
                            style={{ width: `${f.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Remove button */}
                    {f.status === "pending" && (
                      <button
                        onClick={() => removeFile(f.id)}
                        className="p-1.5 rounded hover:bg-[var(--surface-1)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Summary */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-[var(--text-muted)]">
                {files.length} file{files.length !== 1 ? "s" : ""} · {formatBytes(totalSize)}
                {completedCount > 0 && (
                  <span className="text-[var(--success)]"> · {completedCount} uploaded</span>
                )}
                {errorCount > 0 && (
                  <span className="text-[var(--error)]"> · {errorCount} failed</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {pendingCount > 0 && !isUploading && (
                  <button
                    onClick={() => setFiles([])}
                    className="px-3 py-1.5 text-sm rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    Clear
                  </button>
                )}
                
                {pendingCount > 0 && (
                  <button
                    onClick={startUpload}
                    disabled={isUploading}
                    className="px-4 py-1.5 text-sm rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Upload {pendingCount} file{pendingCount !== 1 ? "s" : ""}
                      </>
                    )}
                  </button>
                )}
                
                {pendingCount === 0 && completedCount > 0 && (
                  <button
                    onClick={handleDone}
                    className="px-4 py-1.5 text-sm rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Helper Functions
   ═══════════════════════════════════════════════════════════════════════════ */

// hashFile function moved to client-crypto.ts as computeHash
