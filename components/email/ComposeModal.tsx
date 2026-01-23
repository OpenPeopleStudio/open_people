"use client";

import { useEffect, useState } from "react";
import type { EmailAccount, EmailMessage, EmailTemplate } from "@/types/email";

type Props = {
  accounts: EmailAccount[];
  selectedAccountId: string | null;
  replyTo: EmailMessage | null;
  templates: EmailTemplate[];
  onClose: () => void;
  onSent: () => void;
  variant?: "modal" | "inline";
  prefill?: {
    to?: string[];
    subject?: string;
    body?: string;
    accountId?: string | null;
  };
};

export function ComposeModal({
  accounts,
  selectedAccountId,
  replyTo,
  templates,
  onClose,
  onSent,
  variant = "modal",
  prefill,
}: Props) {
  const [accountId, setAccountId] = useState(
    prefill?.accountId || selectedAccountId || accounts[0]?.id || "",
  );
  const [to, setTo] = useState(
    prefill?.to?.join(", ") || (replyTo ? replyTo.from_address : ""),
  );
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState(
    prefill?.subject || (replyTo ? `Re: ${replyTo.subject || ""}` : "")
  );
  const [body, setBody] = useState(
    prefill?.body
      ? prefill.body
      : replyTo
        ? `\n\n\n---\nOn ${new Date(replyTo.received_at || replyTo.created_at).toLocaleString()}, ${replyTo.from_name || replyTo.from_address} wrote:\n\n${replyTo.body_text || ""}`
        : ""
  );
  const [templateId, setTemplateId] = useState("");
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [draftStatus, setDraftStatus] = useState<"idle" | "saving" | "saved">("idle");

  const selectedAccount = accounts.find(a => a.id === accountId);
  const selectedTemplate = templates.find(t => t.id === templateId);
  const isInline = variant === "inline";

  useEffect(() => {
    if (sending) return;
    setDraftStatus("saving");
    const timer = setTimeout(() => setDraftStatus("saved"), 700);
    return () => clearTimeout(timer);
  }, [to, cc, bcc, subject, body, templateId, templateVariables, sending]);

  const handleTemplateChange = (id: string) => {
    setTemplateId(id);
    const template = templates.find(t => t.id === id);
    if (template) {
      setSubject(template.subject);
      // Initialize variables
      const vars: Record<string, string> = {};
      template.variables.forEach(v => (vars[v] = ""));
      setTemplateVariables(vars);
    }
  };

  const handleSend = async () => {
    if (!to) {
      setError("Recipient is required");
      return;
    }
    if (!subject && !templateId) {
      setError("Subject is required");
      return;
    }

    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: accountId || undefined,
          to: to.split(",").map(e => e.trim()).filter(Boolean),
          cc: cc ? cc.split(",").map(e => e.trim()).filter(Boolean) : undefined,
          bcc: bcc ? bcc.split(",").map(e => e.trim()).filter(Boolean) : undefined,
          subject,
          html: body ? `<p>${body.replace(/\n/g, "<br>")}</p>` : undefined,
          text: body,
          templateId: templateId || undefined,
          templateVariables: Object.keys(templateVariables).length > 0 ? templateVariables : undefined,
          inReplyTo: replyTo?.message_id,
          threadId: replyTo?.thread_id,
          saveToSent: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send email");
        return;
      }

      onSent();
    } catch (err) {
      setError("An error occurred while sending");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={
        isInline
          ? "h-full"
          : "fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      }
    >
      {!isInline && (
        <div
          className="absolute inset-0 bg-[var(--void)]/80 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <div
        className={`relative bg-[var(--surface-1)] border border-[var(--border-subtle)] flex flex-col shadow-xl ${
          isInline
            ? "w-full h-full rounded-xl"
            : "rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl mx-0 sm:mx-4 max-h-[92vh] sm:max-h-[90vh]"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {replyTo ? "Reply" : "New Message"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close compose"
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status */}
        <div
          className={`flex items-center justify-between px-4 py-2 text-xs border-b border-[var(--border-subtle)] ${
            error ? "bg-[var(--error)]/10 text-[var(--error)]" : "text-[var(--text-muted)]"
          }`}
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                error
                  ? "bg-[var(--error)]"
                  : sending
                    ? "bg-[var(--warning)] animate-pulse"
                    : "bg-[var(--success)]"
              }`}
            />
            {error
              ? "Send failed — check details below"
              : sending
                ? "Sending…"
                : draftStatus === "saving"
                  ? "Saving draft…"
                  : "Draft saved locally"}
          </div>
          <div className="hidden sm:block">
            {selectedAccount ? `From ${selectedAccount.email_address}` : "Choose an account"}
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Account Selector */}
          {accounts.length > 0 && (
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">From</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} &lt;{account.email_address}&gt;
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* To */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-[var(--text-muted)]">To</label>
              <div className="flex gap-2">
                {!showCc && (
                  <button
                    onClick={() => setShowCc(true)}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  >
                    Cc
                  </button>
                )}
                {!showBcc && (
                  <button
                    onClick={() => setShowBcc(true)}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  >
                    Bcc
                  </button>
                )}
              </div>
            </div>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
            />
          </div>

          {/* Cc */}
          {showCc && (
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Cc</label>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="cc@example.com"
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
              />
            </div>
          )}

          {/* Bcc */}
          {showBcc && (
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Bcc</label>
              <input
                type="text"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="bcc@example.com"
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
              />
            </div>
          )}

          {/* Template */}
          {templates.length > 0 && !replyTo && (
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Template (optional)</label>
              <select
                value={templateId}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
              >
                <option value="">No template</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Template Variables */}
          {selectedTemplate && selectedTemplate.variables.length > 0 && (
            <div className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]">
              <p className="text-xs text-[var(--text-muted)] mb-2">Template Variables</p>
              <div className="grid grid-cols-2 gap-2">
                {selectedTemplate.variables.map((v) => (
                  <div key={v}>
                    <label className="block text-xs text-[var(--text-muted)] mb-1">{`{{${v}}}`}</label>
                    <input
                      type="text"
                      value={templateVariables[v] || ""}
                      onChange={(e) => setTemplateVariables(prev => ({ ...prev, [v]: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-lg bg-[var(--surface-3)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subject */}
          {!templateId && (
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
              />
            </div>
          )}

          {/* Body */}
          {!templateId && (
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={12}
                placeholder="Write your message..."
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)] resize-none"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-[var(--error)]/10 text-[var(--error)] text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-subtle)]">
          <div className="text-xs text-[var(--text-muted)]">
            {selectedAccount && (
              <>Sending from {selectedAccount.email_address}</>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !to}
              className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
