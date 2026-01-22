"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { UploadToken, UploadTokenUsage } from "@/types/quick-share";
import { formatTokenForDisplay } from "@/lib/quick-share/tokens";

/* ═══════════════════════════════════════════════════════════════════════════
   Quick Share Management Page
   ═══════════════════════════════════════════════════════════════════════════ */

export default function QuickSharePage() {
  const [tokens, setTokens] = useState<UploadToken[]>([]);
  const [selectedToken, setSelectedToken] = useState<UploadToken | null>(null);
  const [usage, setUsage] = useState<UploadTokenUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  useEffect(() => {
    loadTokens();
  }, []);
  
  useEffect(() => {
    if (selectedToken) {
      loadUsage(selectedToken.id);
    }
  }, [selectedToken]);
  
  async function loadTokens() {
    try {
      setLoading(true);
      const res = await fetch("/api/vault/tokens");
      if (res.ok) {
        const data = await res.json();
        setTokens(data.tokens || []);
      }
    } catch (err) {
      console.error("Failed to load tokens:", err);
    } finally {
      setLoading(false);
    }
  }
  
  async function loadUsage(tokenId: string) {
    try {
      const res = await fetch(`/api/vault/tokens/${tokenId}`);
      if (res.ok) {
        const data = await res.json();
        setUsage(data.usage || []);
      }
    } catch (err) {
      console.error("Failed to load usage:", err);
    }
  }
  
  async function handleToggleActive(token: UploadToken) {
    try {
      const res = await fetch(`/api/vault/tokens/${token.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !token.is_active }),
      });
      if (res.ok) {
        const data = await res.json();
        setTokens(prev => prev.map(t => t.id === token.id ? data.token : t));
        if (selectedToken?.id === token.id) {
          setSelectedToken(data.token);
        }
      }
    } catch (err) {
      console.error("Failed to toggle token:", err);
    }
  }
  
  async function handleDelete(tokenId: string) {
    if (!confirm("Are you sure you want to delete this token? Any devices using it will no longer be able to upload.")) {
      return;
    }
    
    try {
      const res = await fetch(`/api/vault/tokens/${tokenId}`, { method: "DELETE" });
      if (res.ok) {
        setTokens(prev => prev.filter(t => t.id !== tokenId));
        if (selectedToken?.id === tokenId) {
          setSelectedToken(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete token:", err);
    }
  }
  
  function handleTokenCreated(token: UploadToken) {
    setTokens(prev => [token, ...prev]);
    setShowCreateModal(false);
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
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </Link>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Quick Share
            </h1>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Create upload tokens for one-click file sharing from any device
          </p>
        </div>
        
        {/* Instructions Card */}
        <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-[var(--electric-lime)]/5 to-[var(--electric-cyan)]/5 border border-[var(--electric-lime)]/20">
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">
            How Quick Share Works
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-[var(--text-muted)]">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-[var(--electric-lime)]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-[var(--electric-lime)]">1</span>
              </div>
              <div>
                <p className="font-medium text-[var(--text-secondary)]">Create a token</p>
                <p>Generate a unique upload token for each device or use case</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-[var(--electric-lime)]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-[var(--electric-lime)]">2</span>
              </div>
              <div>
                <p className="font-medium text-[var(--text-secondary)]">Configure your client</p>
                <p>Use the token in CLI, browser extension, or mobile app</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-[var(--electric-lime)]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-[var(--electric-lime)]">3</span>
              </div>
              <div>
                <p className="font-medium text-[var(--text-secondary)]">Upload anywhere</p>
                <p>Files appear in your vault with AI categorization</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Create Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-[var(--text-primary)]">
            Upload Tokens
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create Token
          </button>
        </div>
        
        {/* Tokens List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3 text-[var(--text-muted)]">
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Loading tokens...</span>
            </div>
          </div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--surface-1)] flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
              No upload tokens yet
            </h3>
            <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto mb-6">
              Create your first token to start uploading files from CLI, browser extension, or mobile.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all"
            >
              Create First Token
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tokens.map(token => (
              <TokenCard
                key={token.id}
                token={token}
                selected={selectedToken?.id === token.id}
                onSelect={() => setSelectedToken(token)}
                onToggle={() => handleToggleActive(token)}
                onDelete={() => handleDelete(token.id)}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Detail Panel */}
      {selectedToken && (
        <div className="w-96 border-l border-[var(--border-subtle)] bg-[var(--surface-1)] overflow-y-auto">
          <TokenDetailPanel
            token={selectedToken}
            usage={usage}
            onClose={() => setSelectedToken(null)}
          />
        </div>
      )}
      
      {/* Create Modal */}
      {showCreateModal && (
        <CreateTokenModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleTokenCreated}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Token Card Component
   ═══════════════════════════════════════════════════════════════════════════ */

function TokenCard({
  token,
  selected,
  onSelect,
  onToggle,
  onDelete,
}: {
  token: UploadToken;
  selected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const isExpired = token.expires_at && new Date(token.expires_at) < new Date();
  
  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-xl border cursor-pointer transition-all ${
        selected
          ? "bg-[var(--electric-lime)]/5 border-[var(--electric-lime)]/30"
          : "bg-[var(--surface-1)] border-[var(--border-subtle)] hover:border-[var(--border)]"
      } ${!token.is_active || isExpired ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--surface-2)] flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-[var(--text-primary)]">
                {token.name}
              </h3>
              {!token.is_active && (
                <span className="px-1.5 py-0.5 text-xs rounded bg-[var(--surface-2)] text-[var(--text-muted)]">
                  Disabled
                </span>
              )}
              {isExpired && (
                <span className="px-1.5 py-0.5 text-xs rounded bg-[var(--error)]/10 text-[var(--error)]">
                  Expired
                </span>
              )}
              {token.permissions?.auto_approve && (
                <span className="px-1.5 py-0.5 text-xs rounded bg-[var(--success)]/10 text-[var(--success)]">
                  Auto-approve
                </span>
              )}
            </div>
            <code className="text-xs text-[var(--text-muted)] font-mono">
              {formatTokenForDisplay(token.token_prefix)}
            </code>
            <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
              <span>{token.upload_count} uploads</span>
              {token.last_used_at && (
                <span>Last used {new Date(token.last_used_at).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onToggle}
            className="p-1.5 rounded hover:bg-[var(--surface-2)] text-[var(--text-muted)]"
            title={token.is_active ? "Disable" : "Enable"}
          >
            {token.is_active ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9v6m-4.5 0V9M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
              </svg>
            )}
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded hover:bg-[var(--error)]/10 text-[var(--text-muted)] hover:text-[var(--error)]"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Token Detail Panel
   ═══════════════════════════════════════════════════════════════════════════ */

function TokenDetailPanel({
  token,
  usage,
  onClose,
}: {
  token: UploadToken;
  usage: UploadTokenUsage[];
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <h3 className="text-sm font-medium text-[var(--text-primary)]">
          Token Details
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
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Token Info */}
        <div className="p-4 rounded-lg bg-[var(--surface-2)]">
          <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Token
          </h4>
          <code className="text-sm font-mono text-[var(--text-primary)]">
            {formatTokenForDisplay(token.token_prefix)}
          </code>
          <p className="text-xs text-[var(--text-muted)] mt-2">
            Token was shown once on creation. If lost, delete and create a new one.
          </p>
        </div>
        
        {/* Settings */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            Settings
          </h4>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[var(--text-muted)]">Max file size</p>
              <p className="text-[var(--text-primary)]">{token.max_file_size_mb} MB</p>
            </div>
            <div>
              <p className="text-[var(--text-muted)]">Rate limit</p>
              <p className="text-[var(--text-primary)]">{token.rate_limit_per_hour}/hr</p>
            </div>
            <div>
              <p className="text-[var(--text-muted)]">Auto-approve</p>
              <p className="text-[var(--text-primary)]">
                {token.permissions?.auto_approve ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <p className="text-[var(--text-muted)]">Allowed types</p>
              <p className="text-[var(--text-primary)]">
                {token.allowed_types?.length ? token.allowed_types.length + " types" : "All"}
              </p>
            </div>
          </div>
        </div>
        
        {/* Usage */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            Recent Uploads
          </h4>
          
          {usage.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No uploads yet</p>
          ) : (
            <div className="space-y-2">
              {usage.slice(0, 10).map(u => (
                <div
                  key={u.id}
                  className="p-3 rounded-lg bg-[var(--surface-2)] text-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-[var(--text-primary)] truncate">
                      {u.filename}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${u.success ? "bg-[var(--success)]" : "bg-[var(--error)]"}`} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <span>{u.client_type}</span>
                    <span>•</span>
                    <span>{new Date(u.created_at).toLocaleString()}</span>
                  </div>
                  {u.ai_category && (
                    <span className="mt-1 inline-block px-1.5 py-0.5 text-xs rounded bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]">
                      {u.ai_category}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* CLI Usage */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            CLI Usage
          </h4>
          <div className="p-3 rounded-lg bg-[var(--surface-2)]">
            <code className="text-xs text-[var(--text-muted)] break-all">
              curl -X POST &quot;{typeof window !== "undefined" ? window.location.origin : ""}/api/vault/quick-upload&quot; \<br/>
              &nbsp;&nbsp;-H &quot;x-vault-token: YOUR_TOKEN&quot; \<br/>
              &nbsp;&nbsp;-F &quot;file=@document.pdf&quot;
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Create Token Modal
   ═══════════════════════════════════════════════════════════════════════════ */

function CreateTokenModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (token: UploadToken) => void;
}) {
  const [name, setName] = useState("");
  const [maxSize, setMaxSize] = useState(100);
  const [rateLimit, setRateLimit] = useState(60);
  const [autoApprove, setAutoApprove] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdToken, setCreatedToken] = useState<{ token: UploadToken; plainToken: string } | null>(null);
  const [copied, setCopied] = useState(false);
  
  async function handleCreate() {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/vault/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          max_file_size_mb: maxSize,
          rate_limit_per_hour: rateLimit,
          auto_approve: autoApprove,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to create token");
      }
      
      setCreatedToken({ token: data.token, plainToken: data.plain_token });
      onCreated(data.token);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create token");
    } finally {
      setLoading(false);
    }
  }
  
  function handleCopy() {
    if (createdToken) {
      navigator.clipboard.writeText(createdToken.plainToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }
  
  // Success view
  if (createdToken) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-md mx-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-xl">
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Token Created
            </h2>
            
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Copy your token now. It won&apos;t be shown again.
            </p>
            
            <div className="p-4 rounded-lg bg-[var(--surface-2)] mb-4">
              <code className="text-sm font-mono text-[var(--text-primary)] break-all">
                {createdToken.plainToken}
              </code>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                className="flex-1 py-2.5 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Token
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Form view
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md mx-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-xl">
        <div className="p-6 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Create Upload Token
          </h2>
        </div>
        
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/20">
              <p className="text-sm text-[var(--error)]">{error}</p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., MacBook Pro, iPhone, CLI"
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Identify which device or use case this token is for
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Max file size
              </label>
              <select
                value={maxSize}
                onChange={(e) => setMaxSize(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm"
              >
                <option value={10}>10 MB</option>
                <option value={50}>50 MB</option>
                <option value={100}>100 MB</option>
                <option value={250}>250 MB</option>
                <option value={500}>500 MB</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Rate limit (per hour)
              </label>
              <select
                value={rateLimit}
                onChange={(e) => setRateLimit(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm"
              >
                <option value={10}>10 uploads</option>
                <option value={30}>30 uploads</option>
                <option value={60}>60 uploads</option>
                <option value={120}>120 uploads</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--surface-2)]">
            <div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Auto-approve uploads</p>
              <p className="text-xs text-[var(--text-muted)]">
                Skip inbox review, files go directly to vault
              </p>
            </div>
            <button
              onClick={() => setAutoApprove(!autoApprove)}
              className={`w-10 h-6 rounded-full transition-colors ${
                autoApprove ? "bg-[var(--electric-lime)]" : "bg-[var(--border)]"
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                autoApprove ? "translate-x-5" : "translate-x-1"
              }`} />
            </button>
          </div>
        </div>
        
        <div className="p-6 border-t border-[var(--border-subtle)] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className="flex-1 py-2.5 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Token"}
          </button>
        </div>
      </div>
    </div>
  );
}
