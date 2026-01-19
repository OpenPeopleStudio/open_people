"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { VaultAutomationRule, VaultFolder } from "@/types/vault";

/* ═══════════════════════════════════════════════════════════════════════════
   Vault Automation Rules Page
   
   TODO: Complete implementation for Phase 5
   ═══════════════════════════════════════════════════════════════════════════ */

export default function VaultAutomationPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [rules, setRules] = useState<VaultAutomationRule[]>([]);
  const [folders, setFolders] = useState<VaultFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
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
      
      const [rulesRes, foldersRes] = await Promise.all([
        fetch("/api/vault/automation/rules", { headers: { "x-vault-session": sid } }),
        fetch("/api/vault/folders", { headers: { "x-vault-session": sid } }),
      ]);
      
      if (rulesRes.ok) {
        const data = await rulesRes.json();
        setRules(data.rules || []);
      }
      
      if (foldersRes.ok) {
        const data = await foldersRes.json();
        setFolders(data.folders || []);
      }
      
    } catch (err) {
      console.error("Failed to load automation data:", err);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleToggleRule(ruleId: string, isActive: boolean) {
    if (!sessionId) return;
    
    try {
      const res = await fetch("/api/vault/automation/rules", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-vault-session": sessionId,
        },
        body: JSON.stringify({ rule_id: ruleId, is_active: !isActive }),
      });
      
      if (res.ok) {
        setRules(prev => prev.map(r => 
          r.id === ruleId ? { ...r, is_active: !isActive } : r
        ));
      }
    } catch (err) {
      console.error("Failed to toggle rule:", err);
    }
  }
  
  async function handleDeleteRule(ruleId: string) {
    if (!sessionId) return;
    if (!confirm("Delete this automation rule?")) return;
    
    try {
      const res = await fetch("/api/vault/automation/rules", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-vault-session": sessionId,
        },
        body: JSON.stringify({ rule_id: ruleId }),
      });
      
      if (res.ok) {
        setRules(prev => prev.filter(r => r.id !== ruleId));
      }
    } catch (err) {
      console.error("Failed to delete rule:", err);
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
          <span>Loading automation rules...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-8 max-w-4xl">
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
              Automation Rules
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Automatically process incoming emails
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Rule
          </button>
        </div>
      </div>
      
      {/* Email Setup Notice */}
      <div className="mb-6 p-4 rounded-xl bg-[var(--warning)]/10 border border-[var(--warning)]/20">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-[var(--warning)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-[var(--warning)]">
              Email Worker Not Configured
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              To enable email automation, deploy the Cloudflare Email Worker and configure 
              your email routing. See the documentation for setup instructions.
            </p>
          </div>
        </div>
      </div>
      
      {/* Rules List */}
      {rules.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--surface-1)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
            No automation rules
          </h3>
          <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto mb-6">
            Create rules to automatically process incoming emails and attachments.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all"
          >
            Create First Rule
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <RuleCard
              key={rule.id}
              rule={rule}
              folders={folders}
              onToggle={() => handleToggleRule(rule.id, rule.is_active)}
              onDelete={() => handleDeleteRule(rule.id)}
            />
          ))}
        </div>
      )}
      
      {/* Create Modal */}
      {showCreateModal && (
        <CreateRuleModal
          sessionId={sessionId}
          folders={folders}
          onClose={() => setShowCreateModal(false)}
          onCreated={(rule) => {
            setRules(prev => [rule, ...prev]);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Rule Card Component
   ═══════════════════════════════════════════════════════════════════════════ */

interface RuleCardProps {
  rule: VaultAutomationRule;
  folders: VaultFolder[];
  onToggle: () => void;
  onDelete: () => void;
}

function RuleCard({ rule, folders, onToggle, onDelete }: RuleCardProps) {
  const targetFolder = folders.find(f => f.id === rule.target_folder_id);
  
  return (
    <div className={`p-4 rounded-xl bg-[var(--surface-1)] border transition-all ${
      rule.is_active 
        ? "border-[var(--electric-lime)]/30" 
        : "border-[var(--border-subtle)] opacity-60"
    }`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          rule.is_active ? "bg-[var(--electric-lime)]/10" : "bg-[var(--surface-2)]"
        }`}>
          <svg className={`w-5 h-5 ${rule.is_active ? "text-[var(--electric-lime)]" : "text-[var(--text-muted)]"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-[var(--text-primary)]">
            {rule.name}
          </h3>
          
          <div className="mt-2 space-y-1 text-xs text-[var(--text-muted)]">
            {rule.email_from_pattern && (
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-secondary)]">From pattern:</span>
                <code className="px-1.5 py-0.5 rounded bg-[var(--surface-2)]">
                  {rule.email_from_pattern}
                </code>
              </div>
            )}
            {rule.email_from_exact && rule.email_from_exact.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-secondary)]">From exact:</span>
                <code className="px-1.5 py-0.5 rounded bg-[var(--surface-2)]">
                  {rule.email_from_exact.join(", ")}
                </code>
              </div>
            )}
            {rule.email_subject_pattern && (
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-secondary)]">Subject pattern:</span>
                <code className="px-1.5 py-0.5 rounded bg-[var(--surface-2)]">
                  {rule.email_subject_pattern}
                </code>
              </div>
            )}
            {rule.email_subject_contains && rule.email_subject_contains.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-secondary)]">Subject contains:</span>
                <code className="px-1.5 py-0.5 rounded bg-[var(--surface-2)]">
                  {rule.email_subject_contains.join(", ")}
                </code>
              </div>
            )}
            {targetFolder && (
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-secondary)]">Destination:</span>
                <span>{targetFolder.path || targetFolder.name}</span>
              </div>
            )}
          </div>
          
          <div className="mt-2 flex items-center gap-2">
            {rule.auto_approve && (
              <span className="px-2 py-0.5 text-xs rounded bg-[var(--success)]/10 text-[var(--success)]">
                Auto-approve
              </span>
            )}
            {rule.attachment_types && rule.attachment_types.length > 0 && (
              <span className="px-2 py-0.5 text-xs rounded bg-[var(--surface-2)] text-[var(--text-muted)]">
                {rule.attachment_types.join(", ")}
              </span>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className={`p-2 rounded-lg transition-colors ${
              rule.is_active 
                ? "bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]" 
                : "bg-[var(--surface-2)] text-[var(--text-muted)]"
            }`}
            title={rule.is_active ? "Disable" : "Enable"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              {rule.is_active ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
              )}
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg bg-[var(--surface-2)] text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Create Rule Modal
   ═══════════════════════════════════════════════════════════════════════════ */

interface CreateRuleModalProps {
  sessionId: string;
  folders: VaultFolder[];
  onClose: () => void;
  onCreated: (rule: VaultAutomationRule) => void;
}

function CreateRuleModal({ sessionId, folders, onClose, onCreated }: CreateRuleModalProps) {
  const [name, setName] = useState("");
  const [emailFromPattern, setEmailFromPattern] = useState("");
  const [emailSubjectPattern, setEmailSubjectPattern] = useState("");
  const [attachmentTypes, setAttachmentTypes] = useState("");
  const [targetFolderId, setTargetFolderId] = useState("");
  const [autoApprove, setAutoApprove] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!name.trim()) {
      setError("Rule name is required");
      return;
    }
    
    if (!emailFromPattern.trim() && !emailSubjectPattern.trim()) {
      setError("At least one of email from or subject is required");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/vault/automation/rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vault-session": sessionId,
        },
        body: JSON.stringify({
          name: name.trim(),
          email_from_pattern: emailFromPattern.trim() || null,
          email_subject_pattern: emailSubjectPattern.trim() || null,
          attachment_types: attachmentTypes ? attachmentTypes.split(",").map(s => s.trim()) : [],
          target_folder_id: targetFolderId || null,
          auto_approve: autoApprove,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to create rule");
      }
      
      onCreated(data.rule);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create rule");
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md mx-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-xl">
        <div className="p-6 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Create Automation Rule
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/20">
              <p className="text-sm text-[var(--error)]">{error}</p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Rule Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Snow White Laundry Invoices"
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Email From (pattern)
            </label>
            <input
              type="text"
              value={emailFromPattern}
              onChange={(e) => setEmailFromPattern(e.target.value)}
              placeholder="e.g., billing@snowwhitelaundry.co"
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Use * as wildcard (e.g., *@company.com)
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Subject Contains (optional)
            </label>
            <input
              type="text"
              value={emailSubjectPattern}
              onChange={(e) => setEmailSubjectPattern(e.target.value)}
              placeholder="e.g., Invoice"
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Attachment Types (optional)
            </label>
            <input
              type="text"
              value={attachmentTypes}
              onChange={(e) => setAttachmentTypes(e.target.value)}
              placeholder="e.g., pdf, png, jpg"
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Comma-separated file extensions
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Destination Folder
            </label>
            <select
              value={targetFolderId}
              onChange={(e) => setTargetFolderId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
            >
              <option value="">Inbox (no folder)</option>
              {folders.map(folder => (
                <option key={folder.id} value={folder.id}>
                  {folder.path || folder.name}
                </option>
              ))}
            </select>
          </div>
          
          <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-2)] cursor-pointer">
            <input
              type="checkbox"
              checked={autoApprove}
              onChange={(e) => setAutoApprove(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--electric-lime)] focus:ring-[var(--electric-lime)]"
            />
            <div>
              <span className="text-sm text-[var(--text-primary)]">
                Auto-approve
              </span>
              <p className="text-xs text-[var(--text-muted)]">
                Skip inbox review and add directly to vault
              </p>
            </div>
          </label>
        </form>
        
        <div className="p-6 border-t border-[var(--border-subtle)] flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Rule"}
          </button>
        </div>
      </div>
    </div>
  );
}
