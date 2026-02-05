"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { VaultInboxItem, VaultFile, VaultFolder } from "@/types/vault";
import { formatBytes, getCategoryIcon, getCategoryColor, getCategoryLabel } from "@/types/vault";

/* ═══════════════════════════════════════════════════════════════════════════
   Vault Inbox Page
   Review files from automated sources (email, etc.)
   ═══════════════════════════════════════════════════════════════════════════ */

interface InboxItemWithDetails extends VaultInboxItem {
  file: VaultFile;
  source_type?: string;
  source_metadata?: {
    email_from?: string;
    email_subject?: string;
    email_date?: string;
    content_hash_error?: string | null;
  };
}

export default function VaultInboxPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [items, setItems] = useState<InboxItemWithDetails[]>([]);
  const [folders, setFolders] = useState<VaultFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<InboxItemWithDetails | null>(null);
  
  useEffect(() => {
    const sid = sessionStorage.getItem("vault_session_id");
    if (!sid) {
      router.push("/super-admin/vault");
      return;
    }
    setSessionId(sid);
    loadData(sid);
  }, [router]);
  
  async function loadData(sid: string) {
    try {
      setLoading(true);
      
      // Load inbox items
      const inboxRes = await fetch("/api/vault/inbox", {
        headers: { "x-vault-session": sid },
      });
      if (inboxRes.ok) {
        const data = await inboxRes.json();
        setItems(data.items || []);
      }
      
      // Load folders for moving files
      const foldersRes = await fetch("/api/vault/folders", {
        headers: { "x-vault-session": sid },
      });
      if (foldersRes.ok) {
        const data = await foldersRes.json();
        setFolders(data.folders || []);
      }
      
    } catch (err) {
      console.error("Failed to load inbox:", err);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleAction(itemId: string, action: "approve" | "reject", targetFolderId?: string) {
    if (!sessionId) return;
    
    setProcessing(itemId);
    try {
      const res = await fetch("/api/vault/inbox", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-vault-session": sessionId,
        },
        body: JSON.stringify({
          item_id: itemId,
          action,
          target_folder_id: targetFolderId,
        }),
      });
      
      if (res.ok) {
        setItems(prev => prev.filter(i => i.id !== itemId));
        if (selectedItem?.id === itemId) {
          setSelectedItem(null);
        }
      }
    } catch (err) {
      console.error("Failed to process inbox item:", err);
    } finally {
      setProcessing(null);
    }
  }
  
  async function handleBulkApprove() {
    if (!sessionId) return;
    
    for (const item of items) {
      await handleAction(item.id, "approve", item.suggested_folder_id ?? undefined);
    }
  }
  
  if (loading || !sessionId) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-[var(--text-muted)]">
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Loading inbox...</span>
        </div>
      </div>
    );
  }
  
    return (
      <div className="flex h-[calc(100vh-4rem)]">
      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/super-admin/vault"
              className="p-1.5 rounded-lg hover:bg-[var(--surface-1)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                Inbox
              </h1>
              <p className="text-sm text-[var(--text-muted)]">
                Review files from automated sources
              </p>
            </div>
            {items.length > 1 && (
              <button
                onClick={handleBulkApprove}
                className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all"
              >
                Approve All ({items.length})
              </button>
            )}
          </div>
        </div>
        
        {/* Inbox Items */}
        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--surface-1)] flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
              Inbox is empty
            </h3>
            <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
              Files from automated sources like email will appear here for review.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <InboxItemCard
                key={item.id}
                item={item}
                selected={selectedItem?.id === item.id}
                processing={processing === item.id}
                onSelect={() => setSelectedItem(item)}
                onApprove={() => handleAction(item.id, "approve", item.suggested_folder_id ?? undefined)}
                onReject={() => handleAction(item.id, "reject")}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Detail Panel */}
      {selectedItem && (
        <div className="w-96 border-l border-[var(--border-subtle)] bg-[var(--surface-1)] overflow-y-auto">
          <InboxDetailPanel
            item={selectedItem}
            folders={folders}
            processing={processing === selectedItem.id}
            onApprove={(folderId) => handleAction(selectedItem.id, "approve", folderId)}
            onReject={() => handleAction(selectedItem.id, "reject")}
            onClose={() => setSelectedItem(null)}
          />
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Inbox Item Card
   ═══════════════════════════════════════════════════════════════════════════ */

interface InboxItemCardProps {
  item: InboxItemWithDetails;
  selected: boolean;
  processing: boolean;
  onSelect: () => void;
  onApprove: () => void;
  onReject: () => void;
}

function InboxItemCard({ item, selected, processing, onSelect, onApprove, onReject }: InboxItemCardProps) {
  const hasHashError =
    item.source_metadata?.content_hash_error ||
    item.file?.error_message;

  return (
    <div
      className={`p-4 rounded-xl border cursor-pointer transition-all ${
        selected
          ? "bg-[var(--electric-lime)]/5 border-[var(--electric-lime)]/30"
          : "bg-[var(--surface-1)] border-[var(--border-subtle)] hover:border-[var(--border)]"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-4">
        {/* File icon */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          item.file?.ai_category 
            ? getCategoryColor(item.file.ai_category).replace("text-", "bg-").replace("500", "500/10")
            : "bg-[var(--surface-2)]"
        }`}>
          {item.file?.ai_category ? (
            <span className={getCategoryColor(item.file.ai_category)}>
              {getCategoryIcon(item.file.ai_category)}
            </span>
          ) : (
            <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-[var(--text-primary)] truncate">
            {item.file?.filename || "Unknown file"}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            {item.file?.ai_category && (
              <span className={`px-1.5 py-0.5 text-xs rounded ${getCategoryColor(item.file.ai_category)} bg-current/10`}>
                {getCategoryLabel(item.file.ai_category)}
              </span>
            )}
            <span className="text-xs text-[var(--text-muted)]">
              {item.file ? formatBytes(item.file.size_bytes) : "—"}
            </span>
          </div>
          
          {/* Source info */}
          <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="px-1.5 py-0.5 rounded bg-[var(--surface-2)]">
              {item.source_type}
            </span>
            {item.rule && (
              <span>via {item.rule.name}</span>
            )}
            {hasHashError && (
              <span className="px-1.5 py-0.5 rounded bg-[var(--warning)]/10 text-[var(--warning)]">
                Pending: content hash missing
              </span>
            )}
          </div>
        </div>
        
        {/* Quick actions */}
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button
            onClick={onReject}
            disabled={processing}
            className="p-2 rounded-lg text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors disabled:opacity-50"
            title="Reject"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={onApprove}
            disabled={processing}
            className="p-2 rounded-lg text-[var(--success)] hover:bg-[var(--success)]/10 transition-colors disabled:opacity-50"
            title="Approve"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Inbox Detail Panel
   ═══════════════════════════════════════════════════════════════════════════ */

interface InboxDetailPanelProps {
  item: InboxItemWithDetails;
  folders: VaultFolder[];
  processing: boolean;
  onApprove: (folderId?: string) => void;
  onReject: () => void;
  onClose: () => void;
}

function InboxDetailPanel({ item, folders, processing, onApprove, onReject, onClose }: InboxDetailPanelProps) {
  const [selectedFolder, setSelectedFolder] = useState(item.suggested_folder_id || "");
  const hasHashError =
    item.source_metadata?.content_hash_error ||
    item.file?.error_message;
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <h3 className="text-sm font-medium text-[var(--text-primary)]">
          File Details
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-[var(--surface-2)] text-[var(--text-muted)]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* File info */}
        <div>
          <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
            File
          </h4>
          <p className="text-sm text-[var(--text-primary)] break-words">
            {item.file?.filename}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-[var(--text-muted)]">
              {item.file ? formatBytes(item.file.size_bytes) : "—"}
            </span>
            <span className="text-xs text-[var(--text-muted)]">•</span>
            <span className="text-xs text-[var(--text-muted)]">
              {item.file?.content_type}
            </span>
          </div>
        </div>
        
        {/* AI Analysis */}
        {item.file?.ai_summary && (
          <div>
            <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
              AI Summary
            </h4>
            <p className="text-sm text-[var(--text-secondary)]">
              {item.file.ai_summary}
            </p>
          </div>
        )}

        {hasHashError && (
          <div className="p-3 rounded-lg border border-[var(--warning)]/30 bg-[var(--warning)]/10">
            <p className="text-xs font-medium text-[var(--warning)] uppercase tracking-wider mb-1">
              Pending Error
            </p>
            <p className="text-sm text-[var(--text-primary)]">
              Missing content hash from email worker payload. File held in pending for review.
            </p>
          </div>
        )}
        
        {/* Source */}
        <div>
          <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Source
          </h4>
          <div className="p-3 rounded-lg bg-[var(--surface-2)]">
            <p className="text-xs text-[var(--text-muted)]">Type</p>
            <p className="text-sm text-[var(--text-primary)] capitalize">{item.source_type}</p>
            
            {item.source_metadata?.email_from && (
              <>
                <p className="text-xs text-[var(--text-muted)] mt-2">From</p>
                <p className="text-sm text-[var(--text-primary)]">{item.source_metadata.email_from}</p>
              </>
            )}
            
            {item.source_metadata?.email_subject && (
              <>
                <p className="text-xs text-[var(--text-muted)] mt-2">Subject</p>
                <p className="text-sm text-[var(--text-primary)]">{item.source_metadata.email_subject}</p>
              </>
            )}
            
            {item.rule && (
              <>
                <p className="text-xs text-[var(--text-muted)] mt-2">Matched Rule</p>
                <p className="text-sm text-[var(--text-primary)]">{item.rule.name}</p>
              </>
            )}
          </div>
        </div>
        
        {/* Folder selection */}
        <div>
          <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Destination Folder
          </h4>
          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
          >
            <option value="">Root (no folder)</option>
            {folders.map(folder => (
              <option key={folder.id} value={folder.id}>
                {folder.path || folder.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Actions */}
      <div className="p-4 border-t border-[var(--border-subtle)] flex gap-2">
        <button
          onClick={onReject}
          disabled={processing}
          className="flex-1 py-2.5 rounded-lg bg-[var(--error)]/10 text-[var(--error)] font-medium hover:bg-[var(--error)]/20 transition-colors disabled:opacity-50"
        >
          Reject
        </button>
        <button
          onClick={() => onApprove(selectedFolder || undefined)}
          disabled={processing}
          className="flex-1 py-2.5 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all disabled:opacity-50"
        >
          {processing ? "Processing..." : "Approve"}
        </button>
      </div>
    </div>
  );
}
