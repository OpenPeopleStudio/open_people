"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FolderTree } from "./components/FolderTree";
import { FileList } from "./components/FileList";
import { FileDetails } from "./components/FileDetails";
import { SearchBar } from "./components/SearchBar";
import { UploadDropzone } from "./components/UploadDropzone";
import { FilePreviewModal } from "@/components/vault/FilePreviewModal";
import type { VaultFolder, VaultFileWithFolder, AICategory, VaultPreviewResponse } from "@/types/vault";

/* ═══════════════════════════════════════════════════════════════════════════
   Vault File Browser
   Full file management interface with folder navigation
   ═══════════════════════════════════════════════════════════════════════════ */

function VaultBrowseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Data state
  const [folders, setFolders] = useState<VaultFolder[]>([]);
  const [files, setFiles] = useState<VaultFileWithFolder[]>([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // UI state
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    searchParams.get("folder")
  );
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [detailsFileId, setDetailsFileId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<VaultPreviewResponse | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortBy, setSortBy] = useState<"name" | "date" | "size" | "category">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // Search/filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<AICategory | null>(null);
  const [showUploadDropzone, setShowUploadDropzone] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(0);
  const pageSize = 50;
  
  // Check session on mount
  useEffect(() => {
    const sid = sessionStorage.getItem("vault_session_id");
    const key = sessionStorage.getItem("vault_encryption_key");
    
    if (!sid || !key) {
      router.push("/super-admin/vault");
      return;
    }
    
    setSessionId(sid);
  }, [router]);
  
  // Fetch headers helper
  const fetchHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    "x-vault-session": sessionId || "",
  }), [sessionId]);
  
  // Load data when session is ready
  useEffect(() => {
    if (sessionId) {
      loadFolders();
      loadFiles();
    }
  }, [sessionId, selectedFolderId, searchQuery, categoryFilter, sortBy, sortOrder, page]);
  
  async function loadFolders() {
    try {
      const res = await fetch("/api/vault/folders?tree=true", {
        headers: fetchHeaders(),
      });
      
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders || []);
      }
    } catch (err) {
      console.error("Failed to load folders:", err);
    }
  }
  
  async function loadFiles() {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (selectedFolderId) params.set("folder_id", selectedFolderId);
      if (searchQuery) params.set("query", searchQuery);
      if (categoryFilter) params.set("category", categoryFilter);
      params.set("limit", pageSize.toString());
      params.set("offset", (page * pageSize).toString());
      
      const res = await fetch(`/api/vault/files?${params}`, {
        headers: fetchHeaders(),
      });
      
      if (res.ok) {
        const data = await res.json();
        let sortedFiles = [...(data.files || [])];
        
        // Client-side sorting
        sortedFiles.sort((a, b) => {
          let comparison = 0;
          switch (sortBy) {
            case "name":
              comparison = a.filename.localeCompare(b.filename);
              break;
            case "date":
              comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
              break;
            case "size":
              comparison = a.size_bytes - b.size_bytes;
              break;
            case "category":
              comparison = (a.ai_category || "zzz").localeCompare(b.ai_category || "zzz");
              break;
          }
          return sortOrder === "asc" ? comparison : -comparison;
        });
        
        setFiles(sortedFiles);
        setTotalFiles(data.total || 0);
      }
    } catch (err) {
      console.error("Failed to load files:", err);
    } finally {
      setLoading(false);
    }
  }
  
  function handleFolderSelect(folderId: string | null) {
    setSelectedFolderId(folderId);
    setSelectedFileIds(new Set());
    setDetailsFileId(null);
    setPage(0);
    
    // Update URL
    if (folderId) {
      router.push(`/super-admin/vault/browse?folder=${folderId}`, { scroll: false });
    } else {
      router.push("/super-admin/vault/browse", { scroll: false });
    }
  }
  
  function handleFileSelect(fileId: string, multiSelect: boolean) {
    setSelectedFileIds(prev => {
      const newSet = new Set(multiSelect ? prev : []);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  }
  
  function handleFileOpen(fileId: string) {
    setDetailsFileId(fileId);
  }

  async function handleFilePreview(fileId: string) {
    if (!sessionId) return;

    try {
      const res = await fetch(`/api/vault/files/${fileId}/preview`, {
        headers: { "x-vault-session": sessionId },
      });

      if (res.ok) {
        const data = await res.json();
        setPreviewData(data);
      }
    } catch (err) {
      console.error("Failed to load preview:", err);
    }
  }
  
  function handleSelectAll() {
    if (selectedFileIds.size === files.length) {
      setSelectedFileIds(new Set());
    } else {
      setSelectedFileIds(new Set(files.map(f => f.id)));
    }
  }
  
  async function handleDelete() {
    if (selectedFileIds.size === 0) return;
    
    if (!confirm(`Delete ${selectedFileIds.size} file(s)? This cannot be undone.`)) {
      return;
    }
    
    try {
      const res = await fetch("/api/vault/files", {
        method: "DELETE",
        headers: fetchHeaders(),
        body: JSON.stringify({ file_ids: Array.from(selectedFileIds) }),
      });
      
      if (res.ok) {
        setSelectedFileIds(new Set());
        setDetailsFileId(null);
        loadFiles();
      }
    } catch (err) {
      console.error("Failed to delete files:", err);
    }
  }
  
  async function handleMove(targetFolderId: string | null) {
    if (selectedFileIds.size === 0) return;
    
    try {
      // Move each selected file
      for (const fileId of selectedFileIds) {
        await fetch("/api/vault/files", {
          method: "PATCH",
          headers: fetchHeaders(),
          body: JSON.stringify({ file_id: fileId, folder_id: targetFolderId }),
        });
      }
      
      setSelectedFileIds(new Set());
      loadFiles();
    } catch (err) {
      console.error("Failed to move files:", err);
    }
  }
  
  async function handleUploadComplete() {
    setShowUploadDropzone(false);
    loadFiles();
    loadFolders(); // Refresh file counts
  }
  
  async function handleCreateFolder(name: string, parentId: string | null) {
    try {
      const res = await fetch("/api/vault/folders", {
        method: "POST",
        headers: fetchHeaders(),
        body: JSON.stringify({ name, parent_id: parentId }),
      });
      
      if (res.ok) {
        loadFolders();
      }
    } catch (err) {
      console.error("Failed to create folder:", err);
    }
  }
  
  // Get breadcrumb path
  const breadcrumbs = getBreadcrumbs(folders, selectedFolderId);
  
  if (!sessionId) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-[var(--text-muted)]">
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Loading...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Upload dropzone overlay */}
      {showUploadDropzone && (
        <UploadDropzone
          sessionId={sessionId}
          folderId={selectedFolderId}
          onComplete={handleUploadComplete}
          onClose={() => setShowUploadDropzone(false)}
        />
      )}
      
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-[var(--border-subtle)] bg-[var(--surface-1)]">
        <div className="flex items-center justify-between gap-4">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => handleFolderSelect(null)}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Vault
            </button>
            {breadcrumbs.map((folder, i) => (
              <div key={folder.id} className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
                <button
                  onClick={() => handleFolderSelect(folder.id)}
                  className={`text-sm truncate ${
                    i === breadcrumbs.length - 1
                      ? "text-[var(--text-primary)] font-medium"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {folder.name}
                </button>
              </div>
            ))}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              categoryFilter={categoryFilter}
              onCategoryChange={setCategoryFilter}
            />
            
            <div className="flex items-center gap-1 p-1 bg-[var(--surface-2)] rounded-lg">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded ${viewMode === "list" ? "bg-[var(--surface-1)] shadow-sm" : ""}`}
                title="List view"
              >
                <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded ${viewMode === "grid" ? "bg-[var(--surface-1)] shadow-sm" : ""}`}
                title="Grid view"
              >
                <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
            
            <button
              onClick={() => setShowUploadDropzone(true)}
              className="px-3 py-1.5 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] text-sm font-medium hover:brightness-110 transition-all flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload
            </button>
          </div>
        </div>
        
        {/* Selection actions */}
        {selectedFileIds.size > 0 && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--border-subtle)]">
            <span className="text-sm text-[var(--text-muted)]">
              {selectedFileIds.size} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                className="px-2 py-1 text-xs rounded bg-[var(--error)]/10 text-[var(--error)] hover:bg-[var(--error)]/20 transition-colors"
              >
                Delete
              </button>
              <MoveDropdown
                folders={folders}
                currentFolderId={selectedFolderId}
                onMove={handleMove}
              />
              <button
                onClick={() => setSelectedFileIds(new Set())}
                className="px-2 py-1 text-xs rounded bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                Clear selection
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Folder sidebar */}
        <div className="w-64 flex-shrink-0 border-r border-[var(--border-subtle)] bg-[var(--surface-1)] overflow-y-auto">
          <FolderTree
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelect={handleFolderSelect}
            onCreateFolder={handleCreateFolder}
          />
        </div>
        
        {/* File list */}
        <div className="flex-1 overflow-y-auto bg-[var(--void)]">
          <FileList
            files={files}
            loading={loading}
            viewMode={viewMode}
            sortBy={sortBy}
            sortOrder={sortOrder}
            selectedIds={selectedFileIds}
            onSort={(by) => {
              if (by === sortBy) {
                setSortOrder(prev => prev === "asc" ? "desc" : "asc");
              } else {
                setSortBy(by);
                setSortOrder("desc");
              }
            }}
            onSelect={handleFileSelect}
            onOpen={handleFileOpen}
            onPreview={handleFilePreview}
            onSelectAll={handleSelectAll}
            totalFiles={totalFiles}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
        
        {/* Details panel */}
        {detailsFileId && (
          <div className="w-80 flex-shrink-0 border-l border-[var(--border-subtle)] bg-[var(--surface-1)] overflow-y-auto">
            <FileDetails
              fileId={detailsFileId}
              sessionId={sessionId}
              onClose={() => setDetailsFileId(null)}
              onUpdate={loadFiles}
            />
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewData && (
        <FilePreviewModal
          previewData={previewData}
          sessionId={sessionId || ""}
          onClose={() => setPreviewData(null)}
        />
      )}
    </div>
  );
}

export default function VaultBrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 flex items-center justify-center h-64 text-[var(--text-muted)]">
          Loading vault...
        </div>
      }
    >
      <VaultBrowseContent />
    </Suspense>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Helper Components
   ═══════════════════════════════════════════════════════════════════════════ */

function MoveDropdown({
  folders,
  currentFolderId,
  onMove,
}: {
  folders: VaultFolder[];
  currentFolderId: string | null;
  onMove: (folderId: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  
  // Flatten folders for dropdown
  const flatFolders = flattenFolders(folders);
  
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-2 py-1 text-xs rounded bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
      >
        Move to
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-48 py-1 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-xl z-20 max-h-64 overflow-y-auto">
            <button
              onClick={() => { onMove(null); setOpen(false); }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--surface-2)] ${
                currentFolderId === null ? "text-[var(--electric-lime)]" : "text-[var(--text-primary)]"
              }`}
            >
              Root (No folder)
            </button>
            {flatFolders.map(folder => (
              <button
                key={folder.id}
                onClick={() => { onMove(folder.id); setOpen(false); }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--surface-2)] ${
                  currentFolderId === folder.id ? "text-[var(--electric-lime)]" : "text-[var(--text-primary)]"
                }`}
                style={{ paddingLeft: `${12 + folder.depth * 12}px` }}
              >
                {folder.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Helper Functions
   ═══════════════════════════════════════════════════════════════════════════ */

function getBreadcrumbs(folders: VaultFolder[], targetId: string | null): VaultFolder[] {
  if (!targetId) return [];
  
  const result: VaultFolder[] = [];
  
  function findPath(folders: VaultFolder[], target: string, path: VaultFolder[]): boolean {
    for (const folder of folders) {
      const newPath = [...path, folder];
      if (folder.id === target) {
        result.push(...newPath);
        return true;
      }
      if ('children' in folder && (folder as any).children.length > 0) {
        if (findPath((folder as any).children, target, newPath)) {
          return true;
        }
      }
    }
    return false;
  }
  
  findPath(folders, targetId, []);
  return result;
}

function flattenFolders(folders: VaultFolder[], depth = 0): (VaultFolder & { depth: number })[] {
  const result: (VaultFolder & { depth: number })[] = [];
  
  for (const folder of folders) {
    if (!folder.is_smart_folder) {
      result.push({ ...folder, depth });
      if ('children' in folder && (folder as any).children.length > 0) {
        result.push(...flattenFolders((folder as any).children, depth + 1));
      }
    }
  }
  
  return result;
}
