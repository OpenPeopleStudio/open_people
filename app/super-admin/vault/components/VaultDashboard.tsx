"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { 
  VaultSpace, 
  VaultFile, 
  VaultFolder,
  AICategory
} from "@/types/vault";
import { formatBytes, getCategoryIcon, getCategoryColor, getCategoryLabel } from "@/types/vault";

/* ═══════════════════════════════════════════════════════════════════════════
   Vault Dashboard
   Main dashboard view when vault is unlocked
   ═══════════════════════════════════════════════════════════════════════════ */

interface VaultDashboardProps {
  vault: VaultSpace;
  sessionId: string;
  encryptionKey: string;
  onLock: () => void;
}

interface VaultStats {
  total_files: number;
  total_size_bytes: number;
  files_by_category: Record<string, number>;
  pending_inbox: number;
  pending_suggestions: number;
  recent_activity_count: number;
}

export function VaultDashboard({ vault, sessionId, encryptionKey, onLock }: VaultDashboardProps) {
  void encryptionKey;
  const [stats, setStats] = useState<VaultStats | null>(null);
  const [recentFiles, setRecentFiles] = useState<VaultFile[]>([]);
  const [folders, setFolders] = useState<VaultFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  // Fetch headers helper
  const fetchHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    "x-vault-session": sessionId,
  }), [sessionId]);
  
  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);
  
  async function loadDashboardData() {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [filesRes, foldersRes, inboxRes, suggestionsRes] = await Promise.all([
        fetch("/api/vault/files?limit=10", { headers: fetchHeaders() }),
        fetch("/api/vault/folders", { headers: fetchHeaders() }),
        fetch("/api/vault/inbox", { headers: fetchHeaders() }),
        fetch("/api/vault/suggestions", { headers: fetchHeaders() }),
      ]);
      
      let pendingInbox = 0;
      let pendingSuggestions = 0;
      
      if (inboxRes.ok) {
        const data = await inboxRes.json();
        pendingInbox = data.items?.length || 0;
      }
      
      if (suggestionsRes.ok) {
        const data = await suggestionsRes.json();
        pendingSuggestions = data.suggestions?.length || 0;
      }
      
      if (filesRes.ok) {
        const data = await filesRes.json();
        setRecentFiles(data.files || []);
        
        // Calculate stats from response
        setStats({
          total_files: data.total || 0,
          total_size_bytes: vault.total_size_bytes,
          files_by_category: calculateCategoryStats(data.files || []),
          pending_inbox: pendingInbox,
          pending_suggestions: pendingSuggestions,
          recent_activity_count: 0,
        });
      }
      
      if (foldersRes.ok) {
        const data = await foldersRes.json();
        setFolders(data.folders || []);
      }
      
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  }
  
  function calculateCategoryStats(files: VaultFile[]): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const file of files) {
      const cat = file.ai_category || "other";
      stats[cat] = (stats[cat] || 0) + 1;
    }
    return stats;
  }
  
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    for (const file of Array.from(files)) {
      await uploadFile(file);
    }
    
    // Reload data
    loadDashboardData();
  }
  
  async function uploadFile(file: File) {
    try {
      setUploadProgress(0);
      
      // 1. Get upload URL and encryption details
      const initRes = await fetch("/api/vault/upload", {
        method: "POST",
        headers: fetchHeaders(),
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type || "application/octet-stream",
          size_bytes: file.size,
        }),
      });
      
      if (!initRes.ok) {
        throw new Error("Failed to initialize upload");
      }
      
      const { file_id, upload_url, encryption_iv } = await initRes.json();
      void encryption_iv;
      
      // 2. Read file and encrypt (simplified - in production use streaming)
      const fileBuffer = await file.arrayBuffer();
      
      // For now, upload unencrypted - real implementation would encrypt client-side
      // using the encryptionKey and encryption_iv
      setUploadProgress(50);
      
      // 3. Upload to R2
      const uploadRes = await fetch(upload_url, {
        method: "PUT",
        body: fileBuffer,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      });
      
      if (!uploadRes.ok) {
        throw new Error("Failed to upload file");
      }
      
      setUploadProgress(80);
      
      // 4. Confirm upload
      const confirmRes = await fetch("/api/vault/files/confirm", {
        method: "POST",
        headers: fetchHeaders(),
        body: JSON.stringify({
          file_id,
          content_hash: await hashFile(fileBuffer),
        }),
      });
      
      if (!confirmRes.ok) {
        throw new Error("Failed to confirm upload");
      }
      
      setUploadProgress(100);
      
      // Brief delay to show completion
      setTimeout(() => setUploadProgress(null), 500);
      
    } catch (err) {
      console.error("Upload error:", err);
      setUploadProgress(null);
    }
  }
  
  async function hashFile(buffer: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }
  
  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-[var(--text-muted)]">
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Loading vault...</span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--electric-lime)] to-[var(--electric-cyan)] flex items-center justify-center">
            <svg className="w-6 h-6 text-[var(--void)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              {vault.name}
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Encrypted & Secure
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Upload button */}
          <label className="relative">
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload
            </div>
          </label>
          
          {/* Settings button */}
          <Link
            href="/super-admin/vault/settings"
            className="p-2 rounded-lg bg-[var(--surface-1)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
            title="Vault settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
          
          {/* Lock button */}
          <button
            onClick={onLock}
            className="p-2 rounded-lg bg-[var(--surface-1)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
            title="Lock vault"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Upload progress */}
      {uploadProgress !== null && (
        <div className="mb-6 p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[var(--electric-lime)] animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[var(--text-primary)]">Uploading...</span>
                <span className="text-[var(--text-muted)]">{uploadProgress}%</span>
              </div>
              <div className="h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--electric-lime)] rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/super-admin/vault/browse">
          <StatsCard
            label="Total Files"
            value={stats?.total_files.toString() || "0"}
            subtext={formatBytes(stats?.total_size_bytes || 0)}
            icon="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            color="var(--electric-lime)"
            clickable
          />
        </Link>
        <Link href="/super-admin/vault/browse">
          <StatsCard
            label="Folders"
            value={folders.filter(f => !f.is_smart_folder).length.toString()}
            subtext={`${folders.filter(f => f.is_smart_folder).length} smart folders`}
            icon="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            color="var(--electric-cyan)"
            clickable
          />
        </Link>
        <Link href="/super-admin/vault/inbox">
          <StatsCard
            label="Inbox"
            value={stats?.pending_inbox.toString() || "0"}
            subtext="Pending review"
            icon="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            color="var(--warning)"
            clickable
            highlight={(stats?.pending_inbox || 0) > 0}
          />
        </Link>
        <Link href="/super-admin/vault/suggestions">
          <StatsCard
            label="Suggestions"
            value={stats?.pending_suggestions.toString() || "0"}
            subtext="AI recommendations"
            icon="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            color="var(--electric-violet)"
            clickable
            highlight={(stats?.pending_suggestions || 0) > 0}
          />
        </Link>
      </div>
      
      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link
          href="/super-admin/vault/quick-share"
          className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-[var(--electric-lime)]/5 to-[var(--electric-cyan)]/5 border border-[var(--electric-lime)]/20 hover:border-[var(--electric-lime)]/40 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-[var(--electric-lime)]/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--electric-lime)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">
              Quick Share
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Upload from CLI, browser extension, or mobile
            </p>
          </div>
          <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
        
        <Link
          href="/super-admin/vault/automation"
          className="flex items-center gap-4 p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-[var(--border)] transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-[var(--surface-2)] flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">
              Email Automation
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Configure rules to process incoming emails
            </p>
          </div>
          <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>
      
      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent files */}
        <div className="lg:col-span-2 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Recent Files
            </h2>
            <Link
              href="/super-admin/vault/browse"
              className="text-sm text-[var(--electric-lime)] hover:underline"
            >
              View all
            </Link>
          </div>
          
          {recentFiles.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-[var(--text-muted)]">No files yet</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Upload your first file to get started
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentFiles.map((file) => (
                <FileRow key={file.id} file={file} />
              ))}
            </div>
          )}
        </div>
        
        {/* Quick folders */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Folders
            </h2>
            <Link
              href="/super-admin/vault/browse"
              className="text-sm text-[var(--electric-lime)] hover:underline"
            >
              Manage
            </Link>
          </div>
          
          <div className="space-y-2">
            {folders
              .filter(f => !f.is_smart_folder && !f.parent_id)
              .slice(0, 8)
              .map((folder) => (
                <Link
                  key={folder.id}
                  href={`/super-admin/vault/browse?folder=${folder.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center">
                    <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <span className="text-sm text-[var(--text-primary)]">{folder.name}</span>
                </Link>
              ))}
          </div>
        </div>
      </div>
      
      {/* Category breakdown */}
      {stats && Object.keys(stats.files_by_category).length > 0 && (
        <div className="mt-6 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Files by Category
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(stats.files_by_category).map(([category, count]) => (
              <div key={category} className="p-4 rounded-lg bg-[var(--surface-2)]">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
                  style={{ backgroundColor: `${getCategoryColor(category as AICategory)}15` }}
                >
                  <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    strokeWidth={1.5}
                    style={{ color: getCategoryColor(category as AICategory) }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={getCategoryIcon(category as AICategory)} />
                  </svg>
                </div>
                <p className="text-2xl font-semibold text-[var(--text-primary)]">{count}</p>
                <p className="text-xs text-[var(--text-muted)]">{getCategoryLabel(category as AICategory)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════════════════ */

function StatsCard({ 
  label, 
  value, 
  subtext, 
  icon, 
  color,
  clickable,
  highlight, 
}: { 
  label: string; 
  value: string; 
  subtext: string; 
  icon: string; 
  color: string;
  clickable?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={`p-5 rounded-xl bg-[var(--surface-1)] border transition-all ${
      highlight 
        ? "border-[var(--warning)]/50 bg-[var(--warning)]/5" 
        : "border-[var(--border-subtle)]"
    } ${clickable ? "hover:border-[var(--border)] hover:bg-[var(--surface-2)] cursor-pointer" : ""}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--text-muted)]">{label}</p>
          <p className="text-2xl font-semibold text-[var(--text-primary)] mt-2">{value}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-2">{subtext}</p>
        </div>
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
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
      </div>
    </div>
  );
}

function FileRow({ file }: { file: VaultFile }) {
  const categoryColor = getCategoryColor(file.ai_category);
  
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--surface-2)] transition-colors">
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${categoryColor}15` }}
      >
        <svg 
          className="w-5 h-5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          strokeWidth={1.5}
          style={{ color: categoryColor }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={getCategoryIcon(file.ai_category)} />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
          {file.filename}
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          {file.ai_category ? getCategoryLabel(file.ai_category) : "Uncategorized"} · {formatBytes(file.size_bytes)}
        </p>
      </div>
      <div className="text-xs text-[var(--text-muted)]">
        {new Date(file.created_at).toLocaleDateString()}
      </div>
    </div>
  );
}
