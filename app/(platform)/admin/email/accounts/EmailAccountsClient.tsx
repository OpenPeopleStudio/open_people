"use client";

import { useState } from "react";
import Link from "next/link";
import type { EmailAccount } from "@/types/email";
import { AccountsManager } from "@/components/email/AccountsManager";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Accounts Client Component
   Full-page accounts management with navigation back to email dashboard
   ═══════════════════════════════════════════════════════════════════════════ */

type Props = {
  accounts: EmailAccount[];
  tenantId: string;
};

export function EmailAccountsClient({ accounts: initialAccounts, tenantId }: Props) {
  const [accounts, setAccounts] = useState(initialAccounts);

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
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">Email Accounts</h1>
            <p className="text-sm text-[var(--text-muted)]">
              Manage your email accounts and sending configurations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--text-muted)]">
            {accounts.length} account{accounts.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AccountsManager
          accounts={accounts}
          onAccountsChange={setAccounts}
          tenantId={tenantId}
          isSuperAdmin={false}
        />
      </div>
    </div>
  );
}
