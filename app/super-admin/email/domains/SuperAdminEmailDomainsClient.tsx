"use client";

import { useState } from "react";
import Link from "next/link";
import type { ManagedEmailDomain } from "@/types/email";
import { DNSRecordsPanel } from "@/components/email/DNSRecordsPanel";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin Email Domains Client Component
   Platform-wide domain management with tenant filtering
   ═══════════════════════════════════════════════════════════════════════════ */

type Tenant = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  managedDomains: ManagedEmailDomain[];
  tenants: Tenant[];
};

export function SuperAdminEmailDomainsClient({ 
  managedDomains: initialDomains, 
  tenants 
}: Props) {
  const [domains, setDomains] = useState(initialDomains);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [newDomainTenantId, setNewDomainTenantId] = useState<string>("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

  // Filter domains by tenant
  const filteredDomains = selectedTenantId
    ? domains.filter(d => d.tenant_id === selectedTenantId)
    : domains;

  // Platform domains (no tenant)
  const platformDomains = domains.filter(d => !d.tenant_id);
  const tenantDomains = domains.filter(d => d.tenant_id);

  // Stats
  const verifiedCount = domains.filter(d => d.status === "verified").length;
  const pendingCount = domains.filter(d => d.status === "pending").length;

  const handleAddDomain = async () => {
    if (!newDomain.trim()) {
      setError("Domain is required");
      return;
    }

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
          tenant_id: newDomainTenantId || null,
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
      setNewDomainTenantId("");
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
    if (!confirm("Are you sure you want to delete this domain?")) return;

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
            Pending
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

  const getTenantName = (tenantId: string | null) => {
    if (!tenantId) return "Platform";
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant?.name || "Unknown";
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[var(--void)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-4">
          <Link
            href="/super-admin/email"
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
              Manage email domains across the platform
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Tenant Filter */}
          <select
            value={selectedTenantId || ""}
            onChange={(e) => setSelectedTenantId(e.target.value || null)}
            className="px-3 py-1.5 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
          >
            <option value="">All Domains</option>
            <option value="__platform__">Platform Only</option>
            <optgroup label="Tenants">
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </optgroup>
          </select>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium text-sm hover:opacity-90 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Domain
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-6 py-3 border-b border-[var(--border-subtle)] bg-[var(--surface-1)]/50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--success)]" />
            <span className="text-sm text-[var(--text-secondary)]">
              {verifiedCount} Verified
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--warning)]" />
            <span className="text-sm text-[var(--text-secondary)]">
              {pendingCount} Pending
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--electric-lime)]" />
            <span className="text-sm text-[var(--text-secondary)]">
              {platformDomains.length} Platform
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--info)]" />
            <span className="text-sm text-[var(--text-secondary)]">
              {tenantDomains.length} Tenant
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredDomains.length === 0 ? (
          <div className="text-center py-12 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)]">
            <svg className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3" />
            </svg>
            <p className="text-[var(--text-muted)]">No domains found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDomains.map((domain) => (
              <div key={domain.id} className="bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] overflow-hidden">
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
                          {getTenantName(domain.tenant_id)} · Added {new Date(domain.created_at).toLocaleDateString()}
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
              setNewDomainTenantId("");
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
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-2">Assign to</label>
                <select
                  value={newDomainTenantId}
                  onChange={(e) => setNewDomainTenantId(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                >
                  <option value="">Platform (openpeople.ai)</option>
                  <optgroup label="Tenants">
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name} ({tenant.slug})
                      </option>
                    ))}
                  </optgroup>
                </select>
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
                  setNewDomainTenantId("");
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
