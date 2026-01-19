"use client";

import { useState } from "react";
import type { EmailPlan, EmailTemplate, EmailDomain, EmailLog } from "@/types/email";
import { DEFAULT_TEMPLATES } from "@/types/email";

/* ═══════════════════════════════════════════════════════════════════════════
   Email Dashboard Client Component
   Handles templates, domains, sending, and logs
   ═══════════════════════════════════════════════════════════════════════════ */

type Props = {
  templates: EmailTemplate[];
  domains: EmailDomain[];
  recentLogs: (EmailLog & { template?: { name: string } | null })[];
  plan: EmailPlan;
  tenantSlug: string;
};

export function EmailDashboard({
  templates: initialTemplates,
  domains: initialDomains,
  recentLogs,
  plan,
  tenantSlug,
}: Props) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [domains, setDomains] = useState(initialDomains);
  const [activeTab, setActiveTab] = useState<"send" | "templates" | "domains" | "logs">("send");
  
  // Send email state
  const [sendTo, setSendTo] = useState("");
  const [sendSubject, setSendSubject] = useState("");
  const [sendHtml, setSendHtml] = useState("");
  const [sendTemplateId, setSendTemplateId] = useState("");
  const [sendVariables, setSendVariables] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  // Template state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    slug: "",
    subject: "",
    htmlBody: "",
    textBody: "",
    category: "transactional" as const,
    variables: [] as string[],
  });
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Domain state
  const [newDomain, setNewDomain] = useState("");
  const [addingDomain, setAddingDomain] = useState(false);

  const handleSendEmail = async () => {
    if (!sendTo) {
      setSendResult({ success: false, message: "Recipient email is required" });
      return;
    }

    if (!sendSubject && !sendTemplateId) {
      setSendResult({ success: false, message: "Subject is required when not using a template" });
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: sendTo,
          subject: sendSubject,
          html: sendHtml || undefined,
          templateId: sendTemplateId || undefined,
          templateVariables: Object.keys(sendVariables).length > 0 ? sendVariables : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSendResult({ success: true, message: "Email sent successfully!" });
        setSendTo("");
        setSendSubject("");
        setSendHtml("");
        setSendTemplateId("");
        setSendVariables({});
      } else {
        setSendResult({ success: false, message: data.error || "Failed to send email" });
      }
    } catch (error) {
      setSendResult({ success: false, message: "An error occurred" });
    } finally {
      setSending(false);
    }
  };

  const handleSaveTemplate = async () => {
    setSavingTemplate(true);

    try {
      const method = editingTemplate ? "PUT" : "POST";
      const body = editingTemplate
        ? { id: editingTemplate.id, ...templateForm }
        : templateForm;

      const res = await fetch("/api/email/templates", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        if (editingTemplate) {
          setTemplates((prev) =>
            prev.map((t) => (t.id === data.template.id ? data.template : t))
          );
        } else {
          setTemplates((prev) => [data.template, ...prev]);
        }
        setShowTemplateModal(false);
        resetTemplateForm();
      } else {
        alert(data.error || "Failed to save template");
      }
    } catch (error) {
      alert("An error occurred");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const res = await fetch("/api/email/templates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete template");
      }
    } catch (error) {
      alert("An error occurred");
    }
  };

  const handleAddDomain = async () => {
    if (!newDomain) return;

    setAddingDomain(true);

    try {
      const res = await fetch("/api/email/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: newDomain }),
      });

      const data = await res.json();

      if (res.ok) {
        setDomains((prev) => [data.domain, ...prev]);
        setNewDomain("");
      } else {
        alert(data.error || "Failed to add domain");
      }
    } catch (error) {
      alert("An error occurred");
    } finally {
      setAddingDomain(false);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm("Are you sure you want to remove this domain?")) return;

    try {
      const res = await fetch("/api/email/domains", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId }),
      });

      if (res.ok) {
        setDomains((prev) => prev.filter((d) => d.id !== domainId));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete domain");
      }
    } catch (error) {
      alert("An error occurred");
    }
  };

  const resetTemplateForm = () => {
    setEditingTemplate(null);
    setTemplateForm({
      name: "",
      slug: "",
      subject: "",
      htmlBody: "",
      textBody: "",
      category: "transactional",
      variables: [],
    });
  };

  const openEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      slug: template.slug,
      subject: template.subject,
      htmlBody: template.html_body,
      textBody: template.text_body || "",
      category: template.category as "transactional",
      variables: template.variables,
    });
    setShowTemplateModal(true);
  };

  const applyDefaultTemplate = (key: keyof typeof DEFAULT_TEMPLATES) => {
    const template = DEFAULT_TEMPLATES[key];
    setTemplateForm({
      name: template.name,
      slug: template.slug,
      subject: template.subject,
      htmlBody: template.html_body,
      textBody: template.text_body,
      category: template.category,
      variables: template.variables,
    });
  };

  const selectedTemplate = templates.find((t) => t.id === sendTemplateId);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--surface-1)] w-fit">
        {[
          { id: "send" as const, label: "Send Email" },
          { id: "templates" as const, label: "Templates" },
          { id: "domains" as const, label: "Domains" },
          { id: "logs" as const, label: "Logs" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-[var(--electric-lime)] text-[var(--void)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Send Email Tab */}
      {activeTab === "send" && (
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            Send Email
          </h2>

          <div className="space-y-4 max-w-2xl">
            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Use Template (Optional)
              </label>
              <select
                value={sendTemplateId}
                onChange={(e) => {
                  setSendTemplateId(e.target.value);
                  if (e.target.value) {
                    const t = templates.find((t) => t.id === e.target.value);
                    if (t) {
                      setSendSubject(t.subject);
                      // Initialize variables
                      const vars: Record<string, string> = {};
                      t.variables.forEach((v) => (vars[v] = ""));
                      setSendVariables(vars);
                    }
                  }
                }}
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
              >
                <option value="">No template (custom email)</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Template Variables */}
            {selectedTemplate && selectedTemplate.variables.length > 0 && (
              <div className="p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]">
                <p className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                  Template Variables
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {selectedTemplate.variables.map((v) => (
                    <div key={v}>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">
                        {`{{${v}}}`}
                      </label>
                      <input
                        type="text"
                        value={sendVariables[v] || ""}
                        onChange={(e) =>
                          setSendVariables((prev) => ({ ...prev, [v]: e.target.value }))
                        }
                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface-3)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* To */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                To
              </label>
              <input
                type="email"
                value={sendTo}
                onChange={(e) => setSendTo(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
              />
            </div>

            {/* Subject */}
            {!sendTemplateId && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={sendSubject}
                  onChange={(e) => setSendSubject(e.target.value)}
                  placeholder="Email subject"
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
                />
              </div>
            )}

            {/* HTML Body (only if no template) */}
            {!sendTemplateId && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  HTML Body
                </label>
                <textarea
                  value={sendHtml}
                  onChange={(e) => setSendHtml(e.target.value)}
                  placeholder="<p>Your email content...</p>"
                  rows={8}
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)] font-mono"
                />
              </div>
            )}

            {/* Sender Info */}
            <div className="p-3 rounded-lg bg-[var(--surface-2)] text-sm text-[var(--text-muted)]">
              Sending from:{" "}
              <span className="text-[var(--text-primary)]">
                {domains.find((d) => d.status === "verified")
                  ? `${tenantSlug}@${domains.find((d) => d.status === "verified")?.domain}`
                  : `${tenantSlug}@mail.openpeople.ai`}
              </span>
            </div>

            {/* Result */}
            {sendResult && (
              <div
                className={`p-4 rounded-lg text-sm ${
                  sendResult.success
                    ? "bg-[var(--success)]/10 text-[var(--success)]"
                    : "bg-[var(--error)]/10 text-[var(--error)]"
                }`}
              >
                {sendResult.message}
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={handleSendEmail}
              disabled={sending || !sendTo}
              className="btn-primary disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send Email"}
            </button>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Email Templates
            </h2>
            <button
              onClick={() => {
                resetTemplateForm();
                setShowTemplateModal(true);
              }}
              className="btn-primary text-sm"
            >
              Create Template
            </button>
          </div>

          {templates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--text-muted)]">No templates yet</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Create your first email template
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {template.name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {template.slug} · {template.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditTemplate(template)}
                      className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--surface-3)] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Domains Tab */}
      {activeTab === "domains" && (
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            Custom Domains
          </h2>

          {plan.customDomains === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--text-muted)]">
                Custom domains are not available on the free plan
              </p>
              <a href="/admin/email/upgrade" className="btn-primary text-sm mt-4 inline-block">
                Upgrade to add domains
              </a>
            </div>
          ) : (
            <>
              {/* Add Domain */}
              <div className="flex items-center gap-3 mb-6">
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="yourdomain.com"
                  className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
                />
                <button
                  onClick={handleAddDomain}
                  disabled={!newDomain || addingDomain}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {addingDomain ? "Adding..." : "Add Domain"}
                </button>
              </div>

              {/* Domain List */}
              {domains.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] text-center py-8">
                  No custom domains added yet
                </p>
              ) : (
                <div className="space-y-3">
                  {domains.map((domain) => (
                    <div
                      key={domain.id}
                      className="p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {domain.domain}
                        </p>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              domain.status === "verified"
                                ? "bg-[var(--success)]/10 text-[var(--success)]"
                                : domain.status === "pending"
                                ? "bg-[var(--warning)]/10 text-[var(--warning)]"
                                : "bg-[var(--error)]/10 text-[var(--error)]"
                            }`}
                          >
                            {domain.status}
                          </span>
                          <button
                            onClick={() => handleDeleteDomain(domain.id)}
                            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--error)] transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {domain.status === "pending" && domain.dns_records && (
                        <div className="mt-3 p-3 rounded bg-[var(--surface-3)] text-xs">
                          <p className="text-[var(--text-secondary)] mb-2">
                            Add these DNS records to verify your domain:
                          </p>
                          <div className="space-y-2 font-mono">
                            {(domain.dns_records as { type: string; name: string; value: string }[]).map((record, i) => (
                              <div key={i} className="text-[var(--text-muted)]">
                                <span className="text-[var(--electric-cyan)]">{record.type}</span>{" "}
                                {record.name} → {record.value}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === "logs" && (
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            Recent Email Logs
          </h2>

          {recentLogs.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">
              No emails sent yet
            </p>
          ) : (
            <div className="space-y-2">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <StatusIcon status={log.status} />
                    <div>
                      <p className="text-sm text-[var(--text-primary)]">
                        {log.to_email}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {log.subject} · {log.template?.name || "Custom"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        log.status === "delivered" || log.status === "opened" || log.status === "clicked"
                          ? "bg-[var(--success)]/10 text-[var(--success)]"
                          : log.status === "sent" || log.status === "queued"
                          ? "bg-[var(--warning)]/10 text-[var(--warning)]"
                          : "bg-[var(--error)]/10 text-[var(--error)]"
                      }`}
                    >
                      {log.status}
                    </span>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[var(--void)]/80 backdrop-blur-sm"
            onClick={() => setShowTemplateModal(false)}
          />
          <div className="relative bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              {editingTemplate ? "Edit Template" : "Create Template"}
            </h3>

            {/* Quick Start Templates */}
            {!editingTemplate && (
              <div className="mb-6">
                <p className="text-sm text-[var(--text-muted)] mb-2">Quick start:</p>
                <div className="flex gap-2">
                  {Object.keys(DEFAULT_TEMPLATES).map((key) => (
                    <button
                      key={key}
                      onClick={() => applyDefaultTemplate(key as keyof typeof DEFAULT_TEMPLATES)}
                      className="px-3 py-1 text-xs rounded-full bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)] transition-colors"
                    >
                      {DEFAULT_TEMPLATES[key as keyof typeof DEFAULT_TEMPLATES].name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={templateForm.slug}
                    onChange={(e) => setTemplateForm((p) => ({ ...p, slug: e.target.value }))}
                    disabled={!!editingTemplate}
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)] disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm((p) => ({ ...p, subject: e.target.value }))}
                  placeholder="Use {{variable}} for dynamic content"
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  HTML Body
                </label>
                <textarea
                  value={templateForm.htmlBody}
                  onChange={(e) => setTemplateForm((p) => ({ ...p, htmlBody: e.target.value }))}
                  rows={10}
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)] font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Variables (comma-separated)
                </label>
                <input
                  type="text"
                  value={templateForm.variables.join(", ")}
                  onChange={(e) =>
                    setTemplateForm((p) => ({
                      ...p,
                      variables: e.target.value.split(",").map((v) => v.trim()).filter(Boolean),
                    }))
                  }
                  placeholder="name, company, link"
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!templateForm.name || !templateForm.slug || !templateForm.subject || !templateForm.htmlBody || savingTemplate}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {savingTemplate ? "Saving..." : editingTemplate ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  const icons: Record<string, { path: string; color: string }> = {
    sent: {
      path: "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5",
      color: "var(--warning)",
    },
    delivered: {
      path: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      color: "var(--success)",
    },
    opened: {
      path: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
      color: "var(--electric-cyan)",
    },
    clicked: {
      path: "M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5",
      color: "var(--electric-violet)",
    },
    bounced: {
      path: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z",
      color: "var(--error)",
    },
    failed: {
      path: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
      color: "var(--error)",
    },
  };

  const icon = icons[status] || icons.sent;

  return (
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center"
      style={{ backgroundColor: `${icon.color}15` }}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        style={{ color: icon.color }}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={icon.path} />
      </svg>
    </div>
  );
}
