"use client";

import { useState } from "react";
import type { EmailCampaignRecipient } from "@/types/email";

type Props = {
  recipients: EmailCampaignRecipient[];
  onRemove: (id: string) => void;
  onAddManual: (input: { email: string; name?: string }) => void;
};

export function RecipientsReview({ recipients, onRemove, onAddManual }: Props) {
  const [manual, setManual] = useState({ email: "", name: "" });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Recipients</h2>
        <span className="text-xs text-[var(--text-muted)]">{recipients.length} total</span>
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {recipients.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)]"
          >
            <div>
              <div className="text-sm text-[var(--text-primary)]">{r.to_name || r.to_email}</div>
              <div className="text-xs text-[var(--text-muted)]">{r.to_email}</div>
            </div>
            {r.id.startsWith("sel-") ? (
              <span className="text-[10px] text-[var(--text-muted)]">From selection</span>
            ) : (
              <button
                onClick={() => onRemove(r.id)}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        {recipients.length === 0 && <div className="text-xs text-[var(--text-muted)]">No recipients selected.</div>}
      </div>

      <div className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] space-y-2">
        <div className="text-xs font-semibold text-[var(--text-secondary)]">Add manual recipient</div>
        <input
          className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm"
          placeholder="Email"
          value={manual.email}
          onChange={(e) => setManual((prev) => ({ ...prev, email: e.target.value }))}
        />
        <input
          className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm"
          placeholder="Name (optional)"
          value={manual.name}
          onChange={(e) => setManual((prev) => ({ ...prev, name: e.target.value }))}
        />
        <button
          onClick={() => {
            if (!manual.email) return;
            onAddManual({ email: manual.email, name: manual.name });
            setManual({ email: "", name: "" });
          }}
          disabled={!manual.email}
          className="w-full px-3 py-2 rounded-lg bg-[var(--surface-3)] text-[var(--text-secondary)] text-sm font-medium disabled:opacity-50"
        >
          Add recipient
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { EmailCampaignRecipient } from "@/types/email";

type Props = {
  recipients: EmailCampaignRecipient[];
  onRemove: (id: string) => void;
  onAddManual: (input: { email: string; name?: string }) => void;
};

export function RecipientsReview({ recipients, onRemove, onAddManual }: Props) {
  const [manual, setManual] = useState({ email: "", name: "" });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Recipients</h2>
        <span className="text-xs text-[var(--text-muted)]">{recipients.length} total</span>
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {recipients.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)]"
          >
            <div>
              <div className="text-sm text-[var(--text-primary)]">{r.to_name || r.to_email}</div>
              <div className="text-xs text-[var(--text-muted)]">{r.to_email}</div>
            </div>
            {r.id.startsWith("sel-") ? (
              <span className="text-[10px] text-[var(--text-muted)]">From selection</span>
            ) : (
              <button
                onClick={() => onRemove(r.id)}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        {recipients.length === 0 && <div className="text-xs text-[var(--text-muted)]">No recipients selected.</div>}
      </div>

      <div className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] space-y-2">
        <div className="text-xs font-semibold text-[var(--text-secondary)]">Add manual recipient</div>
        <input
          className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm"
          placeholder="Email"
          value={manual.email}
          onChange={(e) => setManual((prev) => ({ ...prev, email: e.target.value }))}
        />
        <input
          className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm"
          placeholder="Name (optional)"
          value={manual.name}
          onChange={(e) => setManual((prev) => ({ ...prev, name: e.target.value }))}
        />
        <button
          onClick={() => {
            if (!manual.email) return;
            onAddManual({ email: manual.email, name: manual.name });
            setManual({ email: "", name: "" });
          }}
          disabled={!manual.email}
          className="w-full px-3 py-2 rounded-lg bg-[var(--surface-3)] text-[var(--text-secondary)] text-sm font-medium disabled:opacity-50"
        >
          Add recipient
        </button>
      </div>
    </div>
  );
}

