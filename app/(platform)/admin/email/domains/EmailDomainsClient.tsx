"use client";

import { useState } from "react";
import Link from "next/link";
import type { ManagedEmailDomain, EmailDomain } from "@/types/email";
import { DNSRecordsPanel } from "@/components/email/DNSRecordsPanel";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Domains Client Component
   Full-page domain management with DNS records display
   ═══════════════════════════════════════════════════════════════════════════ */

type Props = {
  managedDomains: ManagedEmailDomain[];
  legacyDomains: EmailDomain[];
  tenantId: string;
};

export function EmailDomainsClient({ 
  managedDomains: initialDomains, 
  legacyDomains,
  tenantId 
}: Props) {
  const [domains, setDomains] = useState(initialDomains);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

  const handleAddDomain = async () => {
    if (!newDomain.trim()) {
      setError("Domain is required");
      return;
    }

    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(newDomain.trim())) {
      setError("Please enter a valid domain (e.g., example.com)");
      return;
    }

    setAdding(true);
    setError("");

    try {
      const res = await fetch("/api/email/domains/managed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          domain: newDomain.trim().toLowerCase(),
          tenant_id: tenantId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to add domain");
        return;
      }

      setDomains(prev => [data.domain, ...prev]);
      setShowAddModal(false);
      setNewDomain("");
      setExpandedDomain(data.domain.id);
    } catch (err) {
      console.error("Add domain error:", err);
      setError("An error occurred");
    } finally {
      setAdding(false);
    }
  };

  const handleVerifyDomain = async (domainId: string) => {
    try {
      const res = await fetch("/api/email/domains/managed", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: domainId, action: "verify" }),
      });
      const data = await res.json();
      if (data.domain) {
        setDomains(prev => prev.map(d => d.id === domainId ? data.domain : d));
      }
    } catch (error) {
      console.error("Failed to verify domain:", error);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm("Are you sure you want to delete this domain? This will remove all DNS records and you won't be able to send emails from this domain.")) return;

    try {
      const res = await fetch("/api/email/domains/managed", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: domainId }),
      });

      if (res.ok) {
        setDomains(prev => prev.filter(d => d.id !== domainId));
      }
    } catch (error) {
      console.error("Delete domain error:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[var(--success)]/10 text-[var(--success)]">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Verified
          </span>
        );
      case "pending":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[var(--warning)]/10 text-[var(--warning)]">
            <svg className="w-3 h-3 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Pending Verification
          </span>
        );
      case "failed":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[var(--error)]/10 text-[var(--error)]">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            Verification Failed
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--surface-2)] text-[var(--text-muted)]">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[var(--void)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/email"
            className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Email
          </Link>
          <div className="h-4 w-px bg-[var(--border-subtle)]" />
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">Email Domains</h1>
            <p className="text-sm text-[var(--text-muted)]">
              Configure custom domains for email sending and receiving
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Domain
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Info Box */}
        <div className="mb-6 p-4 rounded-xl bg-[var(--info)]/5 border border-[var(--info)]/20">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[var(--info)] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-[var(--info)]">How domain verification works</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Add your domain, then update your DNS records at your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.). 
                DNS changes can take up to 48 hours to propagate, but usually complete within a few minutes.
              </p>
            </div>
          </div>
        </div>

        {/* Domains List */}
        {domains.length === 0 ? (
          <div className="text-center py-12 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)]">
            <svg className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
            <p className="text-[var(--text-muted)]">No domains configured</p>
            <p className="text-sm text-[var(--text-muted)] mt-1 mb-4">
              Add a custom domain to send emails from your own address
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium text-sm hover:opacity-90 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Your First Domain
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {domains.map((domain) => (
              <div key={domain.id} className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
                {/* Domain Header */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--surface-2)] flex items-center justify-center">
                        <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{domain.domain}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          Added {new Date(domain.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(domain.status)}
                      <button
                        onClick={() => setExpandedDomain(expandedDomain === domain.id ? null : domain.id)}
                        className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
                      >
                        <svg 
                          className={`w-4 h-4 transition-transform ${expandedDomain === domain.id ? "rotate-180" : ""}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24" 
                          strokeWidth={1.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded DNS Records */}
                {expandedDomain === domain.id && (
                  <div className="border-t border-[var(--border-subtle)]">
                    <DNSRecordsPanel
                      domain={domain}
                      onVerify={() => handleVerifyDomain(domain.id)}
                      onDelete={() => handleDeleteDomain(domain.id)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Domain Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[var(--void)]/80 backdrop-blur-sm"
            onClick={() => {
              setShowAddModal(false);
              setNewDomain("");
              setError("");
            }}
          />
          <div className="relative bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Add Email Domain
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-2">Domain Name</label>
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => {
                    setNewDomain(e.target.value);
                    setError("");
                  }}
                  placeholder="example.com"
                  className="w-full px-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
                  onKeyDown={(e) => e.key === "Enter" && handleAddDomain()}
                />
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  Enter your domain without &quot;www&quot; or &quot;https://&quot;
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-[var(--error)]/10 text-[var(--error)] text-sm">
                  {error}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewDomain("");
                  setError("");
                }}
                className="px-4 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDomain}
                disabled={adding || !newDomain.trim()}
                className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {adding ? "Adding..." : "Add Domain"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
