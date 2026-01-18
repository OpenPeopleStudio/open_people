"use client";

import { useState } from "react";
import { formatBytes, type StoragePlan } from "@/types/storage";

/* ═══════════════════════════════════════════════════════════════════════════
   Storage Dashboard Client Component
   Handles file uploads, bucket management, and file browser
   ═══════════════════════════════════════════════════════════════════════════ */

type Bucket = {
  id: string;
  name: string;
  is_public: boolean;
  created_at: string;
  file_count: number;
  total_size: number;
};

type StorageFile = {
  id: string;
  key: string;
  filename: string;
  content_type: string;
  size: number;
  created_at: string;
  is_public: boolean;
  bucket?: { name: string } | null;
};

type Props = {
  buckets: Bucket[];
  recentFiles: StorageFile[];
  plan: StoragePlan;
};

export function StorageDashboard({ buckets: initialBuckets, recentFiles, plan }: Props) {
  const [buckets, setBuckets] = useState(initialBuckets);
  const [activeTab, setActiveTab] = useState<"buckets" | "files" | "upload">("buckets");
  const [showCreateBucket, setShowCreateBucket] = useState(false);
  const [newBucketName, setNewBucketName] = useState("");
  const [newBucketPublic, setNewBucketPublic] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedBucket, setSelectedBucket] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleCreateBucket = async () => {
    if (!newBucketName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/storage/buckets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBucketName.toLowerCase(),
          isPublic: newBucketPublic,
        }),
      });

      const data = await res.json();

      if (res.ok && data.bucket) {
        setBuckets((prev) => [
          { ...data.bucket, file_count: 0, total_size: 0 },
          ...prev,
        ]);
        setNewBucketName("");
        setNewBucketPublic(false);
        setShowCreateBucket(false);
      } else {
        alert(data.error || "Failed to create bucket");
      }
    } catch (error) {
      console.error("Create bucket error:", error);
      alert("Failed to create bucket");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBucket = async (bucketId: string) => {
    if (!confirm("Are you sure you want to delete this bucket?")) return;

    try {
      const res = await fetch("/api/storage/buckets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucketId, force: true }),
      });

      if (res.ok) {
        setBuckets((prev) => prev.filter((b) => b.id !== bucketId));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete bucket");
      }
    } catch (error) {
      console.error("Delete bucket error:", error);
      alert("Failed to delete bucket");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Check file sizes
    const oversized = files.filter((f) => f.size > plan.maxFileSize);
    if (oversized.length > 0) {
      alert(
        `Some files exceed the maximum size of ${formatBytes(plan.maxFileSize)}: ${oversized.map((f) => f.name).join(", ")}`
      );
      return;
    }

    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (!selectedBucket || selectedFiles.length === 0) {
      alert("Please select a bucket and files to upload");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        // Get presigned URL
        const urlRes = await fetch("/api/storage/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type || "application/octet-stream",
            size: file.size,
            bucketName: selectedBucket,
          }),
        });

        const urlData = await urlRes.json();

        if (!urlRes.ok) {
          alert(`Failed to upload ${file.name}: ${urlData.error}`);
          continue;
        }

        // Upload to R2
        await fetch(urlData.uploadUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
        });

        setUploadProgress(((i + 1) / selectedFiles.length) * 100);
      }

      alert("Upload complete!");
      setSelectedFiles([]);
      setUploadProgress(0);
      
      // Refresh the page to show new files
      window.location.reload();
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (fileId: string, filename: string) => {
    try {
      const res = await fetch(`/api/storage/download/${fileId}`);
      const data = await res.json();

      if (res.ok && data.downloadUrl) {
        // Open download in new tab
        const link = document.createElement("a");
        link.href = data.downloadUrl;
        link.download = filename;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(data.error || "Failed to get download URL");
      }
    } catch (error) {
      console.error("Download error:", error);
      alert("Download failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--surface-1)] w-fit">
        {[
          { id: "buckets" as const, label: "Buckets" },
          { id: "files" as const, label: "Recent Files" },
          { id: "upload" as const, label: "Upload" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-[var(--electric-lime)] text-[var(--void)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Buckets Tab */}
      {activeTab === "buckets" && (
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Storage Buckets
            </h2>
            <button
              onClick={() => setShowCreateBucket(true)}
              className="btn-primary text-sm"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Bucket
            </button>
          </div>

          {buckets.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <p className="text-[var(--text-muted)]">No buckets yet</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Create a bucket to start storing files
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {buckets.map((bucket) => (
                <div
                  key={bucket.id}
                  className="p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] hover:border-[var(--electric-lime)] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--surface-3)] flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-[var(--text-muted)]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {bucket.name}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {bucket.file_count} files · {formatBytes(bucket.total_size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteBucket(bucket.id)}
                      className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--error)] transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        bucket.is_public
                          ? "bg-[var(--warning)]/10 text-[var(--warning)]"
                          : "bg-[var(--surface-3)] text-[var(--text-muted)]"
                      }`}
                    >
                      {bucket.is_public ? "Public" : "Private"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent Files Tab */}
      {activeTab === "files" && (
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            Recent Files
          </h2>

          {recentFiles.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <p className="text-[var(--text-muted)]">No files yet</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Upload files to see them here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileIcon contentType={file.content_type} />
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {file.filename}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {file.bucket?.name || "—"} · {formatBytes(file.size)} ·{" "}
                        {new Date(file.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(file.id, file.filename)}
                    className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--electric-lime)] hover:bg-[var(--surface-3)] transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Tab */}
      {activeTab === "upload" && (
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            Upload Files
          </h2>

          <div className="space-y-6">
            {/* Bucket Selection */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Select Bucket
              </label>
              <select
                value={selectedBucket}
                onChange={(e) => setSelectedBucket(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
              >
                <option value="">Choose a bucket...</option>
                {buckets.map((bucket) => (
                  <option key={bucket.id} value={bucket.name}>
                    {bucket.name}
                  </option>
                ))}
              </select>
            </div>

            {/* File Drop Zone */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Select Files
              </label>
              <div className="border-2 border-dashed border-[var(--border-subtle)] rounded-xl p-8 text-center hover:border-[var(--electric-lime)] transition-colors">
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <svg
                    className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-[var(--text-primary)]">
                    Click to select files or drag and drop
                  </p>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    Max file size: {formatBytes(plan.maxFileSize)}
                  </p>
                </label>
              </div>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div>
                <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Selected Files ({selectedFiles.length})
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedFiles.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded bg-[var(--surface-2)]"
                    >
                      <span className="text-sm text-[var(--text-primary)] truncate">
                        {file.name}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {formatBytes(file.size)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--text-secondary)]">
                    Uploading...
                  </span>
                  <span className="text-sm text-[var(--text-muted)]">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
                <div className="h-2 bg-[var(--surface-3)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--electric-lime)] rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!selectedBucket || selectedFiles.length === 0 || uploading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Uploading..." : "Upload Files"}
            </button>
          </div>
        </div>
      )}

      {/* Create Bucket Modal */}
      {showCreateBucket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[var(--void)]/80 backdrop-blur-sm"
            onClick={() => setShowCreateBucket(false)}
          />
          <div className="relative bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Create New Bucket
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Bucket Name
                </label>
                <input
                  type="text"
                  value={newBucketName}
                  onChange={(e) => setNewBucketName(e.target.value)}
                  placeholder="my-bucket"
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Lowercase letters, numbers, hyphens only
                </p>
              </div>
              <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-2)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={newBucketPublic}
                  onChange={(e) => setNewBucketPublic(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--border-subtle)] text-[var(--electric-lime)] focus:ring-[var(--electric-lime)]"
                />
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Public Bucket
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Files can be accessed without authentication
                  </p>
                </div>
              </label>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateBucket(false)}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBucket}
                disabled={!newBucketName.trim() || creating}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Bucket"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FileIcon({ contentType }: { contentType: string }) {
  const isImage = contentType.startsWith("image/");
  const isVideo = contentType.startsWith("video/");
  const isAudio = contentType.startsWith("audio/");
  const isPdf = contentType === "application/pdf";

  let iconPath =
    "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z";
  let color = "var(--text-muted)";

  if (isImage) {
    iconPath =
      "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z";
    color = "var(--electric-cyan)";
  } else if (isVideo) {
    iconPath =
      "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z";
    color = "var(--electric-violet)";
  } else if (isAudio) {
    iconPath =
      "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3";
    color = "var(--electric-rose)";
  } else if (isPdf) {
    color = "var(--error)";
  }

  return (
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center"
      style={{ backgroundColor: `${color}15` }}
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        style={{ color }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
      </svg>
    </div>
  );
}
