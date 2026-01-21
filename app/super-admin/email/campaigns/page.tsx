import { Suspense } from "react";
import { CampaignsClient } from "@/components/super-admin/email-campaigns";
import Link from "next/link";

export const metadata = {
  title: "Email Campaign Drafts",
};

export default function EmailCampaignsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Campaign Drafts</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Curate AI companies, group them, and draft emails without sending.
          </p>
        </div>
        <Link
          href="/super-admin/email"
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          ← Back to email workspace
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="p-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] text-sm text-[var(--text-muted)]">
            Loading campaigns...
          </div>
        }
      >
        <CampaignsClient />
      </Suspense>
    </div>
  );
}

import { Suspense } from "react";
import { CampaignsClient } from "@/components/super-admin/email-campaigns";
import Link from "next/link";

export const metadata = {
  title: "Email Campaign Drafts",
};

export default function EmailCampaignsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Campaign Drafts</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Curate AI companies, group them, and draft emails without sending.
          </p>
        </div>
        <Link
          href="/super-admin/email"
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          ← Back to email workspace
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="p-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] text-sm text-[var(--text-muted)]">
            Loading campaigns...
          </div>
        }
      >
        <CampaignsClient />
      </Suspense>
    </div>
  );
}

