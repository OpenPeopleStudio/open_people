"use client";

import type { EmailCampaignDraft } from "@/types/email";

type Props = {
  campaigns: (EmailCampaignDraft & { recipients?: { to_email: string; to_name?: string | null }[] })[];
  onOpenComposer?: (campaign: EmailCampaignDraft) => void;
};

export function CampaignsList({ campaigns, onOpenComposer }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Draft campaigns</h2>
        <span className="text-xs text-[var(--text-muted)]">{campaigns.length}</span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {campaigns.map((c) => (
          <div
            key={c.id}
            className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] space-y-1"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-[var(--text-primary)]">{c.name}</div>
              <span className="text-[10px] px-2 py-1 rounded-full bg-[var(--surface-2)] text-[var(--text-secondary)]">
                {c.total_recipients} recipients
              </span>
            </div>
            {c.subject && <div className="text-xs text-[var(--text-secondary)]">{c.subject}</div>}
            {c.audience_description && (
              <div className="text-[11px] text-[var(--text-muted)]">{c.audience_description}</div>
            )}
            {onOpenComposer && (
              <button
                onClick={() => onOpenComposer(c)}
                className="text-xs text-[var(--electric-lime)] underline"
              >
                Open in composer
              </button>
            )}
          </div>
        ))}
        {campaigns.length === 0 && (
          <div className="text-xs text-[var(--text-muted)]">No drafts yet.</div>
        )}
      </div>
    </div>
  );
}

"use client";

import type { EmailCampaignDraft } from "@/types/email";

type Props = {
  campaigns: (EmailCampaignDraft & { recipients?: { to_email: string; to_name?: string | null }[] })[];
  onOpenComposer?: (campaign: EmailCampaignDraft) => void;
};

export function CampaignsList({ campaigns, onOpenComposer }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Draft campaigns</h2>
        <span className="text-xs text-[var(--text-muted)]">{campaigns.length}</span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {campaigns.map((c) => (
          <div
            key={c.id}
            className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] space-y-1"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-[var(--text-primary)]">{c.name}</div>
              <span className="text-[10px] px-2 py-1 rounded-full bg-[var(--surface-2)] text-[var(--text-secondary)]">
                {c.total_recipients} recipients
              </span>
            </div>
            {c.subject && <div className="text-xs text-[var(--text-secondary)]">{c.subject}</div>}
            {c.audience_description && (
              <div className="text-[11px] text-[var(--text-muted)]">{c.audience_description}</div>
            )}
            {onOpenComposer && (
              <button
                onClick={() => onOpenComposer(c)}
                className="text-xs text-[var(--electric-lime)] underline"
              >
                Open in composer
              </button>
            )}
          </div>
        ))}
        {campaigns.length === 0 && (
          <div className="text-xs text-[var(--text-muted)]">No drafts yet.</div>
        )}
      </div>
    </div>
  );
}

