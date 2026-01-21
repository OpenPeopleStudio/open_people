"use client";

import type { VaultFileWithFolder, AICategory } from "@/types/vault";
import { formatBytes, getCategoryIcon, getCategoryColor, getCategoryLabel } from "@/types/vault";

/* ═══════════════════════════════════════════════════════════════════════════
   File List Component
   List and grid view with sorting and selection
   ═══════════════════════════════════════════════════════════════════════════ */

interface FileListProps {
  files: VaultFileWithFolder[];
  loading: boolean;
  viewMode: "list" | "grid";
  sortBy: "name" | "date" | "size" | "category";
  sortOrder: "asc" | "desc";
  selectedIds: Set<string>;
  onSort: (by: "name" | "date" | "size" | "category") => void;
  onSelect: (fileId: string, multiSelect: boolean) => void;
  onOpen: (fileId: string) => void;
  onPreview: (fileId: string) => void;
  onSelectAll: () => void;
  totalFiles: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function FileList({
  files,
  loading,
  viewMode,
  sortBy,
  sortOrder,
  selectedIds,
  onSort,
  onSelect,
  onOpen,
  onPreview,
  onSelectAll,
  totalFiles,
  page,
  pageSize,
  onPageChange,
}: FileListProps) {
  const totalPages = Math.ceil(totalFiles / pageSize);
  const allSelected = files.length > 0 && selectedIds.size === files.length;
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-[var(--text-muted)]">
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Loading files...</span>
        </div>
      </div>
    );
  }
  
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--surface-1)] flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-[var(--text-muted)]">No files found</p>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Upload files or adjust your filters
        </p>
      </div>
    );
  }
  
  if (viewMode === "grid") {
    return (
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {files.map(file => (
            <FileGridItem
              key={file.id}
              file={file}
              selected={selectedIds.has(file.id)}
              onSelect={(multi) => onSelect(file.id, multi)}
              onOpen={() => onOpen(file.id)}
              onPreview={() => onPreview(file.id)}
            />
          ))}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            totalFiles={totalFiles}
            pageSize={pageSize}
            onPageChange={onPageChange}
          />
        )}
      </div>
    );
  }
  
  // List view
  return (
    <div className="p-4">
      {/* Table header */}
      <div className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide border-b border-[var(--border-subtle)]">
        <div className="w-6">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onSelectAll}
            className="w-4 h-4 rounded border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--electric-lime)] focus:ring-[var(--electric-lime)] focus:ring-offset-0"
          />
        </div>
        <SortHeader label="Name" field="name" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} className="flex-1" />
        <SortHeader label="Category" field="category" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} className="w-28" />
        <SortHeader label="Size" field="size" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} className="w-24 text-right" />
        <SortHeader label="Date" field="date" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} className="w-28 text-right" />
        <div className="w-16" />
      </div>
      
      {/* File rows */}
      <div className="divide-y divide-[var(--border-subtle)]">
        {files.map(file => (
          <FileListItem
            key={file.id}
            file={file}
            selected={selectedIds.has(file.id)}
            onSelect={(multi) => onSelect(file.id, multi)}
            onOpen={() => onOpen(file.id)}
            onPreview={() => onPreview(file.id)}
          />
        ))}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          totalFiles={totalFiles}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════════════════ */

function SortHeader({
  label,
  field,
  sortBy,
  sortOrder,
  onSort,
  className,
}: {
  label: string;
  field: "name" | "date" | "size" | "category";
  sortBy: string;
  sortOrder: string;
  onSort: (by: "name" | "date" | "size" | "category") => void;
  className?: string;
}) {
  const isActive = sortBy === field;
  
  return (
    <button
      onClick={() => onSort(field)}
      className={`flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors ${className}`}
    >
      {label}
      {isActive && (
        <svg className={`w-3 h-3 ${sortOrder === "desc" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      )}
    </button>
  );
}

function FileListItem({
  file,
  selected,
  onSelect,
  onOpen,
  onPreview,
}: {
  file: VaultFileWithFolder;
  selected: boolean;
  onSelect: (multiSelect: boolean) => void;
  onOpen: () => void;
  onPreview: () => void;
}) {
  const categoryColor = getCategoryColor(file.ai_category);
  
  return (
    <div
      className={`flex items-center gap-3 px-3 py-3 hover:bg-[var(--surface-1)] transition-colors cursor-pointer ${
        selected ? "bg-[var(--electric-lime)]/5" : ""
      }`}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('input[type="checkbox"]')) return;
        if (e.metaKey || e.ctrlKey) {
          onSelect(true);
        } else {
          onOpen();
        }
      }}
    >
      {/* Checkbox */}
      <div className="w-6">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect((e.nativeEvent as MouseEvent).shiftKey ?? false)}
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="w-4 h-4 rounded border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--electric-lime)] focus:ring-[var(--electric-lime)] focus:ring-offset-0"
        />
      </div>
      
      {/* Icon and name */}
      <div className="flex-1 flex items-center gap-3 min-w-0">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${categoryColor}15` }}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            style={{ color: categoryColor }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d={getCategoryIcon(file.ai_category)} />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
            {file.filename}
          </p>
          {file.ai_summary && (
            <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
              {file.ai_summary}
            </p>
          )}
        </div>
      </div>
      
      {/* Category */}
      <div className="w-28">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
          style={{ 
            backgroundColor: `${categoryColor}15`,
            color: categoryColor,
          }}
        >
          {getCategoryLabel(file.ai_category)}
        </span>
      </div>
      
      {/* Size */}
      <div className="w-24 text-right text-sm text-[var(--text-muted)]">
        {formatBytes(file.size_bytes)}
      </div>
      
      {/* Date */}
      <div className="w-28 text-right text-sm text-[var(--text-muted)]">
        {new Date(file.created_at).toLocaleDateString()}
      </div>
      
      {/* Actions */}
      <div className="w-16 flex gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onPreview(); }}
          className="p-1.5 rounded hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          title="Preview"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
          className="p-1.5 rounded hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          title="Details"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function FileGridItem({
  file,
  selected,
  onSelect,
  onOpen,
  onPreview,
}: {
  file: VaultFileWithFolder;
  selected: boolean;
  onSelect: (multiSelect: boolean) => void;
  onOpen: () => void;
  onPreview: () => void;
}) {
  const categoryColor = getCategoryColor(file.ai_category);
  
  return (
    <div
      className={`group relative p-4 rounded-xl bg-[var(--surface-1)] border transition-all cursor-pointer ${
        selected
          ? "border-[var(--electric-lime)] ring-2 ring-[var(--electric-lime)]/20"
          : "border-[var(--border-subtle)] hover:border-[var(--border-default)]"
      }`}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('input[type="checkbox"]')) return;
        if (e.metaKey || e.ctrlKey) {
          onSelect(true);
        } else {
          onOpen();
        }
      }}
    >
      {/* Checkbox */}
      <div className={`absolute top-2 left-2 ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}>
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect((e.nativeEvent as MouseEvent).shiftKey ?? false)}
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="w-4 h-4 rounded border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--electric-lime)] focus:ring-[var(--electric-lime)] focus:ring-offset-0"
        />
      </div>
      
      {/* Icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
        style={{ backgroundColor: `${categoryColor}15` }}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          style={{ color: categoryColor }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={getCategoryIcon(file.ai_category)} />
        </svg>
      </div>
      
      {/* Name */}
      <p className="text-sm font-medium text-[var(--text-primary)] truncate text-center">
        {file.filename}
      </p>
      
      {/* Meta */}
      <div className="flex items-center justify-center gap-2 mt-2">
        <span className="text-xs text-[var(--text-muted)]">
          {formatBytes(file.size_bytes)}
        </span>
        <span className="text-xs text-[var(--text-muted)]">·</span>
        <span
          className="text-xs font-medium"
          style={{ color: categoryColor }}
        >
          {getCategoryLabel(file.ai_category)}
        </span>
      </div>

      {/* Hover Actions */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onPreview(); }}
          className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
          title="Preview"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
          className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
          title="Details"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  totalFiles,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalFiles: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const start = page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, totalFiles);
  
  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border-subtle)]">
      <p className="text-sm text-[var(--text-muted)]">
        Showing {start}-{end} of {totalFiles} files
      </p>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="px-3 py-1.5 text-sm rounded-lg bg-[var(--surface-1)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        
        <span className="text-sm text-[var(--text-muted)]">
          Page {page + 1} of {totalPages}
        </span>
        
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="px-3 py-1.5 text-sm rounded-lg bg-[var(--surface-1)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
