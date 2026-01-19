"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Note, NoteCategory, NoteFilters } from "@/types/notes";

/* ═══════════════════════════════════════════════════════════════════════════
   Notes List Page
   ═══════════════════════════════════════════════════════════════════════════ */

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<NoteFilters>({});
  const [showNewModal, setShowNewModal] = useState(false);
  
  useEffect(() => {
    loadNotes();
    loadCategories();
  }, [filters]);
  
  async function loadNotes() {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (filters.category_id) params.set("category_id", filters.category_id);
      if (filters.project_name) params.set("project_name", filters.project_name);
      if (filters.status) params.set("status", filters.status);
      if (filters.search) params.set("search", filters.search);
      params.set("is_template", "false");
      
      const res = await fetch(`/api/notes?${params.toString()}`);
      
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
      }
    } catch (err) {
      console.error("Failed to load notes:", err);
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
  
  // Get unique projects from notes
  const projects = [...new Set(notes.filter(n => n.project_name).map(n => n.project_name!))];
  
  // Group notes by pinned status
  const pinnedNotes = notes.filter(n => n.is_pinned);
  const regularNotes = notes.filter(n => !n.is_pinned);
  
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-64 border-r border-[var(--border-subtle)] p-4 overflow-y-auto">
        {/* Quick Actions */}
        <button
          onClick={() => setShowNewModal(true)}
          className="w-full mb-6 px-4 py-2.5 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Note
        </button>
        
        {/* Search */}
        <div className="relative mb-4">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search notes..."
            value={filters.search || ""}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--electric-lime)]"
          />
        </div>
        
        {/* Filters */}
        <div className="space-y-4">
          {/* Status */}
          <div>
            <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Status
            </h3>
            <div className="space-y-1">
              {["all", "draft", "published", "archived"].map(status => (
                <button
                  key={status}
                  onClick={() => setFilters(prev => ({ ...prev, status: status === "all" ? undefined : status }))}
                  className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                    (status === "all" && !filters.status) || filters.status === status
                      ? "bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                Categories
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, category_id: undefined }))}
                  className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                    !filters.category_id
                      ? "bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
                  }`}
                >
                  All Categories
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setFilters(prev => ({ ...prev, category_id: cat.id }))}
                    className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-2 ${
                      filters.category_id === cat.id
                        ? "bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Projects */}
          {projects.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                Projects
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, project_name: undefined }))}
                  className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                    !filters.project_name
                      ? "bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
                  }`}
                >
                  All Projects
                </button>
                {projects.map(project => (
                  <button
                    key={project}
                    onClick={() => setFilters(prev => ({ ...prev, project_name: project }))}
                    className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors truncate ${
                      filters.project_name === project
                        ? "bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
                    }`}
                  >
                    {project}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Navigation Links */}
        <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] space-y-1">
          <Link
            href="/super-admin/notes/graph"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            Knowledge Graph
          </Link>
          <Link
            href="/super-admin/notes/templates"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            Templates
          </Link>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Notes
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Documentation, context, and knowledge for your projects
            </p>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-3 text-[var(--text-muted)]">
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Loading notes...</span>
              </div>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--surface-1)] flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                No notes yet
              </h3>
              <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto mb-6">
                Create your first note to start documenting your projects, APIs, and architecture decisions.
              </p>
              <button
                onClick={() => setShowNewModal(true)}
                className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all"
              >
                Create First Note
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pinned Notes */}
              {pinnedNotes.length > 0 && (
                <div>
                  <h2 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    Pinned
                  </h2>
                  <div className="space-y-2">
                    {pinnedNotes.map(note => (
                      <NoteCard key={note.id} note={note} />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Regular Notes */}
              <div>
                {pinnedNotes.length > 0 && (
                  <h2 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
                    All Notes
                  </h2>
                )}
                <div className="space-y-2">
                  {regularNotes.map(note => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* New Note Modal */}
      {showNewModal && (
        <NewNoteModal
          onClose={() => setShowNewModal(false)}
          onCreated={(note) => {
            setNotes(prev => [note, ...prev]);
            setShowNewModal(false);
          }}
          categories={categories}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Note Card Component
   ═══════════════════════════════════════════════════════════════════════════ */

function NoteCard({ note }: { note: Note }) {
  const statusColors = {
    draft: "bg-[var(--warning)]/10 text-[var(--warning)]",
    published: "bg-[var(--success)]/10 text-[var(--success)]",
    archived: "bg-[var(--text-muted)]/10 text-[var(--text-muted)]",
  };
  
  return (
    <Link
      href={`/super-admin/notes/${note.id}`}
      className="block p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] hover:border-[var(--border)] transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-[var(--text-primary)] truncate">
              {note.title}
            </h3>
            <span className={`px-1.5 py-0.5 text-xs rounded ${statusColors[note.status]}`}>
              {note.status}
            </span>
            {note.is_api_accessible && (
              <span className="px-1.5 py-0.5 text-xs rounded bg-[var(--electric-cyan)]/10 text-[var(--electric-cyan)]">
                API
              </span>
            )}
          </div>
          
          {note.excerpt && (
            <p className="text-sm text-[var(--text-muted)] line-clamp-2 mb-2">
              {note.excerpt}
            </p>
          )}
          
          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
            {note.category && (
              <span className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: note.category.color }}
                />
                {note.category.name}
              </span>
            )}
            {note.project_name && (
              <span className="px-1.5 py-0.5 rounded bg-[var(--surface-2)]">
                {note.project_name}
              </span>
            )}
            {note.tags?.length > 0 && (
              <span>
                {note.tags.slice(0, 3).join(", ")}
                {note.tags.length > 3 && ` +${note.tags.length - 3}`}
              </span>
            )}
            <span>v{note.version}</span>
            <span>
              {new Date(note.updated_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        
        <svg className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   New Note Modal
   ═══════════════════════════════════════════════════════════════════════════ */

function NewNoteModal({
  onClose,
  onCreated,
  categories,
}: {
  onClose: () => void;
  onCreated: (note: Note) => void;
  categories: NoteCategory[];
}) {
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [projectName, setProjectName] = useState("");
  const [useTemplate, setUseTemplate] = useState(false);
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
          category_id: categoryId || undefined,
          project_name: projectName.trim() || undefined,
          content: `# ${title.trim()}\n\n`,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to create note");
      }
      
      onCreated(data.note);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create note");
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md mx-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-xl">
        <div className="p-6 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            New Note
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
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title..."
              autoFocus
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--electric-lime)]"
              >
                <option value="">None</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Project
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., open_people"
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--electric-lime)]"
              />
            </div>
          </div>
          
          <Link
            href="/super-admin/notes/templates"
            className="flex items-center gap-2 text-sm text-[var(--electric-lime)] hover:underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            Start from template
          </Link>
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
            {loading ? "Creating..." : "Create Note"}
          </button>
        </div>
      </div>
    </div>
  );
}
