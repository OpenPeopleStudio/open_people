"use client";

import { useState, useEffect } from "react";
import type { VaultFile, AICategory, AIExtractedData } from "@/types/vault";
import { formatBytes, getCategoryIcon, getCategoryColor, getCategoryLabel } from "@/types/vault";
import { decryptFileForDownload } from "@/lib/vault/client-crypto";

/* ═══════════════════════════════════════════════════════════════════════════
   File Details Panel
   Detailed view of file metadata, AI analysis, and actions
   ═══════════════════════════════════════════════════════════════════════════ */

interface FileDetailsProps {
  fileId: string;
  sessionId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function FileDetails({ fileId, sessionId, onClose, onUpdate }: FileDetailsProps) {
  const [file, setFile] = useState<VaultFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [newTag, setNewTag] = useState("");
  
  useEffect(() => {
    loadFile();
  }, [fileId]);
  
  async function loadFile() {
    try {
      setLoading(true);
      const res = await fetch(`/api/vault/files/${fileId}`, {
        headers: { "x-vault-session": sessionId },
      });
      
      if (res.ok) {
        const data = await res.json();
        setFile(data);
      }
    } catch (err) {
      console.error("Failed to load file:", err);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleDownload() {
    if (!file) return;
    
    try {
      setDownloading(true);
      
      // 1. Get download URL and encryption details from server
      const res = await fetch(`/api/vault/files/${fileId}?download=true`, {
        headers: { "x-vault-session": sessionId },
      });
      
      if (!res.ok) {
        throw new Error("Failed to get download URL");
      }
      
      const data = await res.json();
      
      // 2. Fetch the encrypted file from R2
      const fileRes = await fetch(data.download_url);
      if (!fileRes.ok) {
        throw new Error("Failed to download file");
      }
      
      const encryptedData = await fileRes.arrayBuffer();
      
      // 3. Decrypt the file client-side
      const decryptedBlob = await decryptFileForDownload(
        encryptedData,
        file.encryption_iv,
        file.content_type
      );
      
      // 4. Trigger download
      const url = URL.createObjectURL(decryptedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error("Download failed:", err);
      alert(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  }
  
  async function handleAddTag() {
    if (!file || !newTag.trim()) return;
    
    const updatedTags = [...(file.ai_tags || []), newTag.trim()];
    
    try {
      const res = await fetch("/api/vault/files", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-vault-session": sessionId,
        },
        body: JSON.stringify({
          file_id: fileId,
          ai_tags: updatedTags,
        }),
      });
      
      if (res.ok) {
        setFile(prev => prev ? { ...prev, ai_tags: updatedTags } : null);
        setNewTag("");
        onUpdate();
      }
    } catch (err) {
      console.error("Failed to add tag:", err);
    }
  }
  
  async function handleRemoveTag(tag: string) {
    if (!file) return;
    
    const updatedTags = file.ai_tags.filter(t => t !== tag);
    
    try {
      const res = await fetch("/api/vault/files", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-vault-session": sessionId,
        },
        body: JSON.stringify({
          file_id: fileId,
          ai_tags: updatedTags,
        }),
      });
      
      if (res.ok) {
        setFile(prev => prev ? { ...prev, ai_tags: updatedTags } : null);
        onUpdate();
      }
    } catch (err) {
      console.error("Failed to remove tag:", err);
    }
  }
  
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <svg className="w-5 h-5 animate-spin text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }
  
  if (!file) {
    return (
      <div className="p-6 text-center">
        <p className="text-[var(--text-muted)]">File not found</p>
      </div>
    );
  }
  
  const categoryColor = getCategoryColor(file.ai_category);
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0">
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
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] break-words">
                {file.filename}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {formatBytes(file.size_bytes)} · {file.content_type}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {downloading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Downloading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* AI Summary */}
        {file.ai_summary && (
          <Section title="AI Summary">
            <p className="text-sm text-[var(--text-secondary)]">{file.ai_summary}</p>
          </Section>
        )}
        
        {/* Category */}
        <Section title="Category">
          <span
            className="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium"
            style={{ 
              backgroundColor: `${categoryColor}15`,
              color: categoryColor,
            }}
          >
            {getCategoryLabel(file.ai_category)}
          </span>
          {file.ai_subcategory && (
            <span className="text-sm text-[var(--text-muted)] ml-2">
              {file.ai_subcategory}
            </span>
          )}
          {file.ai_confidence && (
            <span className="text-xs text-[var(--text-muted)] ml-2">
              ({Math.round(file.ai_confidence * 100)}% confidence)
            </span>
          )}
        </Section>
        
        {/* Tags */}
        <Section title="Tags">
          <div className="flex flex-wrap gap-1.5">
            {file.ai_tags.map(tag => (
              <span
                key={tag}
                className="group inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--surface-2)] text-xs text-[var(--text-secondary)]"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="opacity-0 group-hover:opacity-100 hover:text-[var(--error)] transition-all"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
            {editingTags ? (
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { handleAddTag(); setEditingTags(false); }
                  if (e.key === "Escape") { setNewTag(""); setEditingTags(false); }
                }}
                onBlur={() => { setNewTag(""); setEditingTags(false); }}
                placeholder="Add tag"
                autoFocus
                className="px-2 py-0.5 text-xs rounded bg-[var(--surface-2)] border border-[var(--electric-lime)] text-[var(--text-primary)] focus:outline-none w-20"
              />
            ) : (
              <button
                onClick={() => setEditingTags(true)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--surface-2)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add
              </button>
            )}
          </div>
        </Section>
        
        {/* Extracted Data */}
        {file.ai_extracted_data && Object.keys(file.ai_extracted_data).length > 0 && (
          <Section title="Extracted Data">
            <ExtractedDataView data={file.ai_extracted_data} category={file.ai_category} />
          </Section>
        )}
        
        {/* Source */}
        <Section title="Source">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-muted)]">Type:</span>
              <span className="text-[var(--text-secondary)] capitalize">{file.source_type}</span>
            </div>
            {file.source_metadata?.email_from && (
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-muted)]">From:</span>
                <span className="text-[var(--text-secondary)]">{file.source_metadata.email_from}</span>
              </div>
            )}
            {file.source_metadata?.email_subject && (
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-muted)]">Subject:</span>
                <span className="text-[var(--text-secondary)] truncate">{file.source_metadata.email_subject}</span>
              </div>
            )}
          </div>
        </Section>
        
        {/* Dates */}
        <Section title="Dates">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-muted)]">Uploaded:</span>
              <span className="text-[var(--text-secondary)]">
                {new Date(file.created_at).toLocaleString()}
              </span>
            </div>
            {file.ai_analyzed_at && (
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-muted)]">Analyzed:</span>
                <span className="text-[var(--text-secondary)]">
                  {new Date(file.ai_analyzed_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </Section>
        
        {/* Location */}
        <Section title="Location">
          <div className="text-sm text-[var(--text-secondary)]">
            {file.folder_id ? (
              <span>{(file as any).folder_path || "In folder"}</span>
            ) : (
              <span className="text-[var(--text-muted)]">Root (no folder)</span>
            )}
          </div>
        </Section>
        
        {/* Technical */}
        <Section title="Technical">
          <div className="space-y-2 text-xs font-mono text-[var(--text-muted)]">
            <div>ID: {file.id}</div>
            <div className="break-all">Hash: {file.content_hash.substring(0, 16)}...</div>
            <div>Encrypted: Yes (AES-256-GCM)</div>
          </div>
        </Section>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════════════════ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">
        {title}
      </h4>
      {children}
    </div>
  );
}

function ExtractedDataView({ data, category }: { data: AIExtractedData; category: AICategory | null }) {
  // Render based on category
  const fields = getDisplayFields(data, category);
  
  return (
    <div className="space-y-2">
      {fields.map(({ label, value }) => (
        <div key={label} className="flex items-start gap-2 text-sm">
          <span className="text-[var(--text-muted)] shrink-0">{label}:</span>
          <span className="text-[var(--text-secondary)]">{value}</span>
        </div>
      ))}
      
      {/* Line items for invoices/receipts */}
      {data.line_items && data.line_items.length > 0 && (
        <div className="mt-3">
          <span className="text-xs font-medium text-[var(--text-muted)] uppercase">Line Items</span>
          <div className="mt-2 space-y-1">
            {data.line_items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)] truncate">{item.description}</span>
                {item.total && (
                  <span className="text-[var(--text-primary)] font-medium ml-2">
                    {formatCurrency(item.total, data.currency)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getDisplayFields(data: AIExtractedData, category: AICategory | null): { label: string; value: string }[] {
  const fields: { label: string; value: string }[] = [];
  
  if (data.document_date) {
    fields.push({ label: "Date", value: data.document_date });
  }
  if (data.document_number) {
    fields.push({ label: "Number", value: data.document_number });
  }
  
  // Invoice/Receipt fields
  if (data.vendor_name) {
    fields.push({ label: "Vendor", value: data.vendor_name });
  }
  if (data.total_amount !== undefined) {
    fields.push({ label: "Total", value: formatCurrency(data.total_amount, data.currency) });
  }
  if (data.due_date) {
    fields.push({ label: "Due Date", value: data.due_date });
  }
  if (data.payment_status) {
    fields.push({ label: "Status", value: data.payment_status });
  }
  
  // Contract fields
  if (data.parties && data.parties.length > 0) {
    fields.push({ label: "Parties", value: data.parties.join(", ") });
  }
  if (data.effective_date) {
    fields.push({ label: "Effective", value: data.effective_date });
  }
  if (data.expiration_date) {
    fields.push({ label: "Expires", value: data.expiration_date });
  }
  
  // Bank statement fields
  if (data.account_number) {
    fields.push({ label: "Account", value: `***${data.account_number.slice(-4)}` });
  }
  if (data.opening_balance !== undefined) {
    fields.push({ label: "Opening", value: formatCurrency(data.opening_balance, data.currency) });
  }
  if (data.closing_balance !== undefined) {
    fields.push({ label: "Closing", value: formatCurrency(data.closing_balance, data.currency) });
  }
  
  // ID document fields
  if (data.full_name) {
    fields.push({ label: "Name", value: data.full_name });
  }
  if (data.id_number) {
    fields.push({ label: "ID Number", value: `***${data.id_number.slice(-4)}` });
  }
  if (data.id_expiry_date) {
    fields.push({ label: "Expires", value: data.id_expiry_date });
  }
  
  return fields;
}

function formatCurrency(amount: number, currency?: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(amount);
}
