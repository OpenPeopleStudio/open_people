"use client";

import { useState } from "react";
import Link from "next/link";
import type { EmailAccount, ManagedEmailDomain } from "@/types/email";
import { AccountsManager } from "@/components/email/AccountsManager";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin Email Accounts Client Component
   Platform-wide account management with tenant filtering
   ═══════════════════════════════════════════════════════════════════════════ */

type Tenant = {
  id: string;
  name: string;
  slug: string;
};

type Props = {
  accounts: EmailAccount[];
  managedDomains: ManagedEmailDomain[];
  tenants: Tenant[];
};

export function SuperAdminEmailAccountsClient({ 
  accounts: initialAccounts, 
  managedDomains, 
  tenants 
}: Props) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  // Filter accounts by tenant
  const filteredAccounts = selectedTenantId
    ? accounts.filter(a => a.tenant_id === selectedTenantId)
    : accounts;

  // Platform accounts (no tenant)
  const platformAccounts = accounts.filter(a => !a.tenant_id);
  const tenantAccounts = accounts.filter(a => a.tenant_id);

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
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">Email Accounts</h1>
            <p className="text-sm text-[var(--text-muted)]">
              Manage email accounts across the platform
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
            <option value="">All Accounts</option>
            <option value="__platform__">Platform Only</option>
            <optgroup label="Tenants">
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name} ({tenant.slug})
                </option>
              ))}
            </optgroup>
          </select>
          <span className="text-sm text-[var(--text-muted)]">
            {filteredAccounts.length} account{filteredAccounts.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-6 py-3 border-b border-[var(--border-subtle)] bg-[var(--surface-1)]/50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--electric-lime)]" />
            <span className="text-sm text-[var(--text-secondary)]">
              {platformAccounts.length} Platform Accounts
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--info)]" />
            <span className="text-sm text-[var(--text-secondary)]">
              {tenantAccounts.length} Tenant Accounts
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--warning)]" />
            <span className="text-sm text-[var(--text-secondary)]">
              {managedDomains.length} Managed Domains
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AccountsManager
          accounts={selectedTenantId === "__platform__" ? platformAccounts : filteredAccounts}
          onAccountsChange={(newAccounts) => {
            // Merge changes back into full accounts list
            const updatedIds = new Set(newAccounts.map(a => a.id));
            const unchanged = accounts.filter(a => !updatedIds.has(a.id));
            setAccounts([...unchanged, ...newAccounts]);
          }}
          tenantId={selectedTenantId === "__platform__" ? undefined : (selectedTenantId || undefined)}
          isSuperAdmin={true}
        />
      </div>
    </div>
  );
}
