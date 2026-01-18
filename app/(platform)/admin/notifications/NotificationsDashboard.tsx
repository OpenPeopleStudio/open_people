"use client";

import { useState } from "react";
import type {
  NotificationPlan,
  NotificationTemplate,
  NotificationDelivery,
  NotificationChannel,
} from "@/types/notifications";
import { DEFAULT_NOTIFICATION_TEMPLATES } from "@/types/notifications";

/* ═══════════════════════════════════════════════════════════════════════════
   Notifications Dashboard Client Component
   Manages templates, sending, and delivery logs
   ═══════════════════════════════════════════════════════════════════════════ */

type Props = {
  templates: NotificationTemplate[];
  recentDeliveries: (NotificationDelivery & { template?: { name: string } | null })[];
  plan: NotificationPlan;
  fromNumber: string | null;
  tenantId: string;
};

export function NotificationsDashboard({
  templates: initialTemplates,
  recentDeliveries,
  plan,
  fromNumber,
  tenantId,
}: Props) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [activeTab, setActiveTab] = useState<"send" | "templates" | "logs">("send");

  // Send form state
  const [sendChannel, setSendChannel] = useState<NotificationChannel>("sms");
  const [sendRecipient, setSendRecipient] = useState("");
  const [sendSubject, setSendSubject] = useState("");
  const [sendBody, setSendBody] = useState("");
  const [sendTemplateId, setSendTemplateId] = useState("");
  const [sendVariables, setSendVariables] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  // Template form state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    slug: "",
    channel: "sms" as NotificationChannel,
    subject: "",
    body: "",
    variables: [] as string[],
  });
  const [savingTemplate, setSavingTemplate] = useState(false);

  const handleSendNotification = async () => {
    if (!sendRecipient) {
      setSendResult({ success: false, message: "Recipient is required" });
      return;
    }

    if (!sendBody && !sendTemplateId) {
      setSendResult({ success: false, message: "Message body is required when not using a template" });
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: sendChannel,
          recipient: sendRecipient,
          subject: sendSubject || undefined,
          body: sendBody || undefined,
          templateId: sendTemplateId || undefined,
          templateVariables: Object.keys(sendVariables).length > 0 ? sendVariables : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSendResult({ success: true, message: "Notification sent successfully!" });
        setSendRecipient("");
        setSendSubject("");
        setSendBody("");
        setSendTemplateId("");
        setSendVariables({});
      } else {
        setSendResult({ success: false, message: data.error || "Failed to send" });
      }
    } catch (error) {
      setSendResult({ success: false, message: "An error occurred" });
    } finally {
      setSending(false);
    }
  };

  const handleCreateTemplate = async () => {
    setSavingTemplate(true);

    try {
      const res = await fetch("/api/notifications/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateForm),
      });

      const data = await res.json();

      if (res.ok) {
        setTemplates((prev) => [data.template, ...prev]);
        setShowTemplateModal(false);
        setTemplateForm({
          name: "",
          slug: "",
          channel: "sms",
          subject: "",
          body: "",
          variables: [],
        });
      } else {
        alert(data.error || "Failed to create template");
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
      const res = await fetch("/api/notifications/templates", {
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

  const useDefaultTemplate = (key: keyof typeof DEFAULT_NOTIFICATION_TEMPLATES) => {
    const template = DEFAULT_NOTIFICATION_TEMPLATES[key];
    setTemplateForm({
      name: template.name,
      slug: template.slug,
      channel: template.channel,
      subject: template.subject || "",
      body: template.body,
      variables: template.variables,
    });
  };

  const selectedTemplate = templates.find((t) => t.id === sendTemplateId);
  const channelTemplates = templates.filter((t) => t.channel === sendChannel);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--surface-1)] w-fit">
        {[
          { id: "send" as const, label: "Send Notification" },
          { id: "templates" as const, label: "Templates" },
          { id: "logs" as const, label: "Delivery Logs" },
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

      {/* Send Tab */}
      {activeTab === "send" && (
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            Send Notification
          </h2>

          <div className="space-y-4 max-w-2xl">
            {/* Channel Selection */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Channel
              </label>
              <div className="flex gap-2">
                {[
                  { id: "sms" as const, label: "SMS", icon: "📱" },
                  { id: "in_app" as const, label: "In-App", icon: "🔔" },
                ].map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setSendChannel(ch.id);
                      setSendTemplateId("");
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                      sendChannel === ch.id
                        ? "border-[var(--electric-lime)] bg-[var(--electric-lime)]/10 text-[var(--text-primary)]"
                        : "border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--text-muted)]"
                    }`}
                  >
                    <span>{ch.icon}</span>
                    <span>{ch.label}</span>
                  </button>
                ))}
              </div>
            </div>

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
                      setSendSubject(t.subject || "");
                      const vars: Record<string, string> = {};
                      t.variables.forEach((v) => (vars[v] = ""));
                      setSendVariables(vars);
                    }
                  }
                }}
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
              >
                <option value="">No template (custom message)</option>
                {channelTemplates.map((t) => (
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

            {/* Recipient */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                {sendChannel === "sms" ? "Phone Number" : "User ID"}
              </label>
              <input
                type={sendChannel === "sms" ? "tel" : "text"}
                value={sendRecipient}
                onChange={(e) => setSendRecipient(e.target.value)}
                placeholder={sendChannel === "sms" ? "+1234567890" : "user-uuid"}
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
              />
            </div>

            {/* Subject (for in-app) */}
            {sendChannel === "in_app" && !sendTemplateId && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={sendSubject}
                  onChange={(e) => setSendSubject(e.target.value)}
                  placeholder="Notification title"
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
                />
              </div>
            )}

            {/* Body (only if no template) */}
            {!sendTemplateId && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Message
                </label>
                <textarea
                  value={sendBody}
                  onChange={(e) => setSendBody(e.target.value)}
                  placeholder="Your notification message..."
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
                />
              </div>
            )}

            {/* Sender Info (SMS) */}
            {sendChannel === "sms" && (
              <div className="p-3 rounded-lg bg-[var(--surface-2)] text-sm text-[var(--text-muted)]">
                Sending from:{" "}
                <span className="text-[var(--text-primary)]">
                  {fromNumber || "Platform number"}
                </span>
              </div>
            )}

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
              onClick={handleSendNotification}
              disabled={sending || !sendRecipient}
              className="btn-primary disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send Notification"}
            </button>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Notification Templates
            </h2>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="btn-primary text-sm"
            >
              Create Template
            </button>
          </div>

          {templates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--text-muted)]">No templates yet</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Create your first notification template
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
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {template.channel === "sms" ? "📱" : template.channel === "in_app" ? "🔔" : "📣"}
                      </span>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {template.name}
                      </p>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {template.slug} · {template.channel}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--surface-3)] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === "logs" && (
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            Recent Deliveries
          </h2>

          {recentDeliveries.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">
              No notifications sent yet
            </p>
          ) : (
            <div className="space-y-2">
              {recentDeliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {delivery.channel === "sms" ? "📱" : delivery.channel === "in_app" ? "🔔" : "📣"}
                    </span>
                    <div>
                      <p className="text-sm text-[var(--text-primary)]">
                        {delivery.recipient}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {delivery.template?.name || "Custom"} ·{" "}
                        {delivery.body.length > 50
                          ? delivery.body.substring(0, 50) + "..."
                          : delivery.body}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        delivery.status === "delivered" || delivery.status === "read"
                          ? "bg-[var(--success)]/10 text-[var(--success)]"
                          : delivery.status === "sent" || delivery.status === "queued"
                          ? "bg-[var(--warning)]/10 text-[var(--warning)]"
                          : "bg-[var(--error)]/10 text-[var(--error)]"
                      }`}
                    >
                      {delivery.status}
                    </span>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {new Date(delivery.created_at).toLocaleString()}
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
              Create Template
            </h3>

            {/* Quick Start */}
            <div className="mb-6">
              <p className="text-sm text-[var(--text-muted)] mb-2">Quick start:</p>
              <div className="flex gap-2 flex-wrap">
                {Object.keys(DEFAULT_NOTIFICATION_TEMPLATES).map((key) => (
                  <button
                    key={key}
                    onClick={() => useDefaultTemplate(key as keyof typeof DEFAULT_NOTIFICATION_TEMPLATES)}
                    className="px-3 py-1 text-xs rounded-full bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)] transition-colors"
                  >
                    {DEFAULT_NOTIFICATION_TEMPLATES[key as keyof typeof DEFAULT_NOTIFICATION_TEMPLATES].name}
                  </button>
                ))}
              </div>
            </div>

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
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Channel
                </label>
                <select
                  value={templateForm.channel}
                  onChange={(e) =>
                    setTemplateForm((p) => ({ ...p, channel: e.target.value as NotificationChannel }))
                  }
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                >
                  <option value="sms">SMS</option>
                  <option value="in_app">In-App</option>
                  <option value="push">Push</option>
                </select>
              </div>

              {templateForm.channel !== "sms" && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Title/Subject
                  </label>
                  <input
                    type="text"
                    value={templateForm.subject}
                    onChange={(e) => setTemplateForm((p) => ({ ...p, subject: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Message Body
                </label>
                <textarea
                  value={templateForm.body}
                  onChange={(e) => setTemplateForm((p) => ({ ...p, body: e.target.value }))}
                  rows={4}
                  placeholder="Use {{variable}} for dynamic content"
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
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
                  placeholder="name, order_number, total"
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
                onClick={handleCreateTemplate}
                disabled={!templateForm.name || !templateForm.slug || !templateForm.body || savingTemplate}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {savingTemplate ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
