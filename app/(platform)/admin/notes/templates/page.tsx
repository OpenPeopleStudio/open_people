"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Note, NoteCategory } from "@/types/notes";

/* ═══════════════════════════════════════════════════════════════════════════
   Note Templates Page - Tenant Admin
   ═══════════════════════════════════════════════════════════════════════════ */

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Note[]>([]);
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  useEffect(() => {
    loadTemplates();
    loadCategories();
  }, []);
  
  async function loadTemplates() {
    try {
      setLoading(true);
      const res = await fetch("/api/notes?is_template=true");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.notes || []);
      }
    } catch (err) {
      console.error("Failed to load templates:", err);
    } finally {
      setLoading(false);
    }
  }
  
  async function loadCategories() {
    try {
      const res = await fetch("/api/notes/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  }
  
  async function createFromTemplate(template: Note) {
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Copy of ${template.title}`,
          content: template.content,
          category_id: template.category_id,
          tags: template.tags,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        window.location.href = `/admin/notes/${data.note.id}`;
      }
    } catch (err) {
      console.error("Failed to create from template:", err);
    }
  }
  
  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/admin/notes"
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Templates
            </h1>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Reusable note templates for common documentation patterns
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Template
        </button>
      </div>
      
      {/* Templates Grid */}
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
      ) : templates.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--surface-1)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
            No templates yet
          </h3>
          <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto mb-6">
            Create templates for API documentation, meeting notes, architecture decisions, and more.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all"
          >
            Create First Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <div
              key={template.id}
              className="p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-[var(--border)] transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-[var(--text-primary)] truncate">
                    {template.title}
                  </h3>
                  {template.category && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: template.category.color }}
                      />
                      <span className="text-xs text-[var(--text-muted)]">
                        {template.category.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {template.excerpt && (
                <p className="text-sm text-[var(--text-muted)] line-clamp-2 mb-4">
                  {template.excerpt}
                </p>
              )}
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => createFromTemplate(template)}
                  className="flex-1 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] text-sm font-medium hover:brightness-110 transition-all"
                >
                  Use Template
                </button>
                <Link
                  href={`/admin/notes/${template.id}`}
                  className="px-3 py-2 rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)] text-sm hover:text-[var(--text-primary)] transition-colors"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Create Template Modal */}
      {showCreateModal && (
        <CreateTemplateModal
          categories={categories}
          onClose={() => setShowCreateModal(false)}
          onCreated={(template) => {
            setTemplates(prev => [template, ...prev]);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

function CreateTemplateModal({
  categories,
  onClose,
  onCreated,
}: {
  categories: NoteCategory[];
  onClose: () => void;
  onCreated: (template: Note) => void;
}) {
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  async function handleCreate() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: `# ${title.trim()}\n\n## Overview\n\n## Details\n\n## Notes\n`,
          category_id: categoryId || undefined,
          is_template: true,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to create template");
      }
      
      onCreated(data.note);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create template");
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md mx-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-xl">
        <div className="p-6 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            New Template
          </h2>
        </div>
        
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/20">
              <p className="text-sm text-[var(--error)]">{error}</p>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Template Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., API Documentation"
              autoFocus
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
            >
              <option value="">None</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
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
            disabled={loading || !title.trim()}
            className="flex-1 py-2.5 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Template"}
          </button>
        </div>
      </div>
    </div>
  );
}
