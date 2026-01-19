"use client";

import { useState } from "react";
import type { VaultFolder, FolderTreeNode } from "@/types/vault";

/* ═══════════════════════════════════════════════════════════════════════════
   Folder Tree Component
   Hierarchical folder navigation with create/expand functionality
   ═══════════════════════════════════════════════════════════════════════════ */

interface FolderTreeProps {
  folders: VaultFolder[];
  selectedFolderId: string | null;
  onSelect: (folderId: string | null) => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
}

export function FolderTree({ folders, selectedFolderId, onSelect, onCreateFolder }: FolderTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [creatingIn, setCreatingIn] = useState<string | null | "root">(null);
  const [newFolderName, setNewFolderName] = useState("");
  
  function toggleExpanded(folderId: string) {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  }
  
  function handleCreateSubmit(parentId: string | null) {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim(), parentId);
      setNewFolderName("");
      setCreatingIn(null);
    }
  }
  
  // Separate regular folders from smart folders
  const regularFolders = (folders as FolderTreeNode[]).filter(f => !f.is_smart_folder);
  const smartFolders = (folders as FolderTreeNode[]).filter(f => f.is_smart_folder);
  
  return (
    <div className="p-3">
      {/* All Files option */}
      <button
        onClick={() => onSelect(null)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
          selectedFolderId === null
            ? "bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
        All Files
      </button>
      
      {/* Folders section */}
      <div className="mt-4">
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
            Folders
          </span>
          <button
            onClick={() => setCreatingIn("root")}
            className="p-1 rounded hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            title="New folder"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
        
        {/* New folder input at root */}
        {creatingIn === "root" && (
          <div className="px-3 mb-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateSubmit(null);
                if (e.key === "Escape") { setCreatingIn(null); setNewFolderName(""); }
              }}
              onBlur={() => { setCreatingIn(null); setNewFolderName(""); }}
              placeholder="Folder name"
              autoFocus
              className="w-full px-2 py-1.5 text-sm rounded bg-[var(--surface-2)] border border-[var(--electric-lime)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
            />
          </div>
        )}
        
        {/* Folder tree */}
        <div className="space-y-0.5">
          {regularFolders.map(folder => (
            <FolderItem
              key={folder.id}
              folder={folder}
              depth={0}
              selectedFolderId={selectedFolderId}
              expandedIds={expandedIds}
              creatingIn={creatingIn}
              newFolderName={newFolderName}
              onSelect={onSelect}
              onToggleExpand={toggleExpanded}
              onStartCreate={setCreatingIn}
              onNameChange={setNewFolderName}
              onCreateSubmit={handleCreateSubmit}
              onCancelCreate={() => { setCreatingIn(null); setNewFolderName(""); }}
            />
          ))}
        </div>
      </div>
      
      {/* Smart Folders section */}
      {smartFolders.length > 0 && (
        <div className="mt-6">
          <div className="px-3 mb-2">
            <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
              Smart Folders
            </span>
          </div>
          
          <div className="space-y-0.5">
            {smartFolders.map(folder => (
              <button
                key={folder.id}
                onClick={() => onSelect(folder.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedFolderId === folder.id
                    ? "bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                </svg>
                {folder.name}
                {folder.file_count !== undefined && folder.file_count > 0 && (
                  <span className="ml-auto text-xs text-[var(--text-muted)]">
                    {folder.file_count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Folder Item (recursive)
   ═══════════════════════════════════════════════════════════════════════════ */

interface FolderItemProps {
  folder: FolderTreeNode;
  depth: number;
  selectedFolderId: string | null;
  expandedIds: Set<string>;
  creatingIn: string | null | "root";
  newFolderName: string;
  onSelect: (folderId: string) => void;
  onToggleExpand: (folderId: string) => void;
  onStartCreate: (folderId: string) => void;
  onNameChange: (name: string) => void;
  onCreateSubmit: (parentId: string) => void;
  onCancelCreate: () => void;
}

function FolderItem({
  folder,
  depth,
  selectedFolderId,
  expandedIds,
  creatingIn,
  newFolderName,
  onSelect,
  onToggleExpand,
  onStartCreate,
  onNameChange,
  onCreateSubmit,
  onCancelCreate,
}: FolderItemProps) {
  const hasChildren = folder.children && folder.children.length > 0;
  const isExpanded = expandedIds.has(folder.id);
  const isSelected = selectedFolderId === folder.id;
  const isCreatingHere = creatingIn === folder.id;
  
  return (
    <div>
      <div
        className={`group flex items-center gap-1 rounded-lg transition-colors ${
          isSelected
            ? "bg-[var(--electric-lime)]/10"
            : "hover:bg-[var(--surface-2)]"
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        {/* Expand button */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleExpand(folder.id); }}
          className={`p-1 rounded hover:bg-[var(--surface-3)] ${
            hasChildren ? "visible" : "invisible"
          }`}
        >
          <svg
            className={`w-3 h-3 text-[var(--text-muted)] transition-transform ${
              isExpanded ? "rotate-90" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        {/* Folder button */}
        <button
          onClick={() => onSelect(folder.id)}
          className={`flex-1 flex items-center gap-2 py-2 pr-2 text-sm ${
            isSelected
              ? "text-[var(--electric-lime)]"
              : "text-[var(--text-secondary)]"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
          </svg>
          <span className="truncate">{folder.name}</span>
          {folder.file_count !== undefined && folder.file_count > 0 && (
            <span className="ml-auto text-xs text-[var(--text-muted)]">
              {folder.file_count}
            </span>
          )}
        </button>
        
        {/* Add subfolder button */}
        <button
          onClick={(e) => { e.stopPropagation(); onStartCreate(folder.id); }}
          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--surface-3)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
          title="Add subfolder"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>
      
      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {folder.children.map(child => (
            <FolderItem
              key={child.id}
              folder={child}
              depth={depth + 1}
              selectedFolderId={selectedFolderId}
              expandedIds={expandedIds}
              creatingIn={creatingIn}
              newFolderName={newFolderName}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onStartCreate={onStartCreate}
              onNameChange={onNameChange}
              onCreateSubmit={onCreateSubmit}
              onCancelCreate={onCancelCreate}
            />
          ))}
        </div>
      )}
      
      {/* New folder input */}
      {isCreatingHere && (
        <div style={{ paddingLeft: `${24 + depth * 16}px`, paddingRight: 8 }} className="py-1">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onCreateSubmit(folder.id);
              if (e.key === "Escape") onCancelCreate();
            }}
            onBlur={onCancelCreate}
            placeholder="Folder name"
            autoFocus
            className="w-full px-2 py-1.5 text-sm rounded bg-[var(--surface-2)] border border-[var(--electric-lime)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
