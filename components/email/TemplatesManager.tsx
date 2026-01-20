"use client";

import { useState } from "react";
import type { EmailTemplate, EmailPlan } from "@/types/email";
import { DEFAULT_TEMPLATES } from "@/types/email";

type Props = {
  templates: EmailTemplate[];
  plan: EmailPlan;
  onTemplatesChange: (templates: EmailTemplate[]) => void;
};

export function TemplatesManager({ templates, plan, onTemplatesChange }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    subject: "",
    htmlBody: "",
    textBody: "",
    category: "transactional" as const,
    variables: [] as string[],
  });
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setForm({
      name: "",
      slug: "",
      subject: "",
      htmlBody: "",
      textBody: "",
      category: "transactional",
      variables: [],
    });
    setEditingTemplate(null);
  };

  const openEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setForm({
      name: template.name,
      slug: template.slug,
      subject: template.subject,
      htmlBody: template.html_body,
      textBody: template.text_body || "",
      category: template.category as "transactional",
      variables: template.variables,
    });
    setShowModal(true);
  };

  const applyDefault = (key: keyof typeof DEFAULT_TEMPLATES) => {
    const t = DEFAULT_TEMPLATES[key];
    setForm({
      name: t.name,
      slug: t.slug,
      subject: t.subject,
      htmlBody: t.html_body,
      textBody: t.text_body,
      category: t.category,
      variables: t.variables,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const method = editingTemplate ? "PUT" : "POST";
      const body = editingTemplate
        ? { id: editingTemplate.id, ...form }
        : form;

      const res = await fetch("/api/email/templates", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        if (editingTemplate) {
          onTemplatesChange(templates.map(t => t.id === data.template.id ? data.template : t));
        } else {
          onTemplatesChange([data.template, ...templates]);
        }
        setShowModal(false);
        resetForm();
      }
    } catch (error) {
      console.error("Save template error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;

    try {
      const res = await fetch("/api/email/templates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        onTemplatesChange(templates.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error("Delete template error:", error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Email Templates</h2>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Template
        </button>
      </div>

      {/* Templates List */}
      <div className="flex-1 overflow-y-auto p-4">
        {templates.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
            <p className="text-[var(--text-muted)]">No templates yet</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Create reusable email templates
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {template.name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {template.slug} · {template.category}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-2 truncate max-w-md">
                      {template.subject}
                    </p>
                    {template.variables.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {template.variables.map(v => (
                          <span key={v} className="px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-xs text-[var(--text-muted)]">
                            {`{{${v}}}`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(template)}
                      className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--surface-2)] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[var(--void)]/80 backdrop-blur-sm"
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
          />
          <div className="relative bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              {editingTemplate ? "Edit Template" : "Create Template"}
            </h3>

            {/* Quick Start */}
            {!editingTemplate && (
              <div className="mb-4">
                <p className="text-xs text-[var(--text-muted)] mb-2">Quick start:</p>
                <div className="flex gap-2">
                  {Object.keys(DEFAULT_TEMPLATES).map(key => (
                    <button
                      key={key}
                      onClick={() => applyDefault(key as keyof typeof DEFAULT_TEMPLATES)}
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
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Slug</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))}
                    disabled={!!editingTemplate}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)] disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Subject</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="Use {{variable}} for dynamic content"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
                />
              </div>

              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">HTML Body</label>
                <textarea
                  value={form.htmlBody}
                  onChange={(e) => setForm(f => ({ ...f, htmlBody: e.target.value }))}
                  rows={10}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Variables (comma-separated)</label>
                <input
                  type="text"
                  value={form.variables.join(", ")}
                  onChange={(e) => setForm(f => ({
                    ...f,
                    variables: e.target.value.split(",").map(v => v.trim()).filter(Boolean),
                  }))}
                  placeholder="name, company, link"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-4 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.slug || !form.subject || !form.htmlBody}
                className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? "Saving..." : editingTemplate ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
