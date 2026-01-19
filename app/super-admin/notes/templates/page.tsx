"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { NoteTemplate, TemplateVariable } from "@/types/notes";

/* ═══════════════════════════════════════════════════════════════════════════
   Templates Page
   ═══════════════════════════════════════════════════════════════════════════ */

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<NoteTemplate | null>(null);
  const [showUseModal, setShowUseModal] = useState(false);
  
  useEffect(() => {
    loadTemplates();
  }, []);
  
  async function loadTemplates() {
    try {
      setLoading(true);
      const res = await fetch("/api/notes/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error("Failed to load templates:", err);
    } finally {
      setLoading(false);
    }
  }
  
  function handleUseTemplate(template: NoteTemplate) {
    setSelectedTemplate(template);
    setShowUseModal(true);
  }
  
  // Group templates by category
  const templatesByCategory = templates.reduce((acc, template) => {
    const category = template.category || "other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, NoteTemplate[]>);
  
  const categoryLabels: Record<string, string> = {
    project: "Project Documentation",
    api: "API Documentation",
    architecture: "Architecture Decisions",
    meeting: "Meeting Notes",
    ai: "AI Context",
    other: "Other",
  };
  
  const categoryIcons: Record<string, string> = {
    project: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
    api: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    architecture: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    meeting: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    ai: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    other: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  };
  
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/super-admin/notes"
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </Link>
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                Templates
              </h1>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              Start with a template to quickly create structured notes
            </p>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3 text-[var(--text-muted)]">
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Loading templates...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={categoryIcons[category] || categoryIcons.other} />
                  </svg>
                  <h2 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                    {categoryLabels[category] || category}
                  </h2>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  {categoryTemplates.map(template => (
                    <div
                      key={template.id}
                      className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] hover:border-[var(--border)] transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-sm font-medium text-[var(--text-primary)]">
                            {template.name}
                          </h3>
                          {template.is_system && (
                            <span className="text-xs text-[var(--text-muted)]">System template</span>
                          )}
                        </div>
                        {template.use_count > 0 && (
                          <span className="text-xs text-[var(--text-muted)]">
                            Used {template.use_count}x
                          </span>
                        )}
                      </div>
                      
                      {template.description && (
                        <p className="text-sm text-[var(--text-muted)] mb-3">
                          {template.description}
                        </p>
                      )}
                      
                      {template.variables?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {template.variables.map((v: TemplateVariable) => (
                            <span
                              key={v.name}
                              className="px-1.5 py-0.5 text-xs rounded bg-[var(--surface-2)] text-[var(--text-muted)]"
                            >
                              {`{{${v.name}}}`}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <button
                        onClick={() => handleUseTemplate(template)}
                        className="w-full py-2 rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium transition-colors"
                      >
                        Use Template
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Use Template Modal */}
      {showUseModal && selectedTemplate && (
        <UseTemplateModal
          template={selectedTemplate}
          onClose={() => {
            setShowUseModal(false);
            setSelectedTemplate(null);
          }}
          onCreated={(noteId) => {
            router.push(`/super-admin/notes/${noteId}`);
          }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Use Template Modal
   ═══════════════════════════════════════════════════════════════════════════ */

function UseTemplateModal({
  template,
  onClose,
  onCreated,
}: {
  template: NoteTemplate;
  onClose: () => void;
  onCreated: (noteId: string) => void;
}) {
  const [variables, setVariables] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    template.variables?.forEach((v: TemplateVariable) => {
      initial[v.name] = v.default || "";
    });
    return initial;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  function interpolate(text: string): string {
    let result = text;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
    });
    return result;
  }
  
  async function handleCreate() {
    // Check required variables
    const missing = template.variables?.filter(
      (v: TemplateVariable) => v.required && !variables[v.name]?.trim()
    );
    
    if (missing?.length) {
      setError(`Missing required fields: ${missing.map((v: TemplateVariable) => v.name).join(", ")}`);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const title = template.title_template 
        ? interpolate(template.title_template)
        : `New ${template.name}`;
      
      const content = interpolate(template.content_template);
      
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          tags: template.default_tags,
          metadata: {
            ...template.default_metadata,
            template_id: template.id,
            template_name: template.name,
          },
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to create note");
      }
      
      onCreated(data.note.id);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create note");
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg mx-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Use Template: {template.name}
          </h2>
          {template.description && (
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {template.description}
            </p>
          )}
        </div>
        
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/20">
              <p className="text-sm text-[var(--error)]">{error}</p>
            </div>
          )}
          
          {template.variables?.length > 0 ? (
            template.variables.map((v: TemplateVariable) => (
              <div key={v.name}>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  {v.name}
                  {v.required && <span className="text-[var(--error)] ml-1">*</span>}
                </label>
                {v.description && (
                  <p className="text-xs text-[var(--text-muted)] mb-1.5">{v.description}</p>
                )}
                <input
                  type={v.type === "date" ? "date" : "text"}
                  value={variables[v.name] || ""}
                  onChange={(e) => setVariables(prev => ({ ...prev, [v.name]: e.target.value }))}
                  placeholder={v.default || `Enter ${v.name}...`}
                  className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                />
              </div>
            ))
          ) : (
            <p className="text-sm text-[var(--text-muted)]">
              This template has no variables. Click Create to use it as-is.
            </p>
          )}
          
          {/* Preview */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Preview
            </label>
            <div className="p-4 rounded-lg bg-[var(--surface-2)] max-h-48 overflow-y-auto">
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">
                {template.title_template 
                  ? interpolate(template.title_template)
                  : `New ${template.name}`}
              </h4>
              <pre className="text-xs text-[var(--text-muted)] whitespace-pre-wrap font-mono">
                {interpolate(template.content_template).slice(0, 500)}
                {template.content_template.length > 500 && "..."}
              </pre>
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-[var(--border-subtle)] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Note"}
          </button>
        </div>
      </div>
    </div>
  );
}
