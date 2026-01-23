"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import type { Note, NoteCategory, NoteFilters } from "@/types/notes";
import { LoadingText, EmptyState } from "@/lib/ui";

/* ═══════════════════════════════════════════════════════════════════════════
   Notes List View - Shared component for Notes UI
   Used by both super-admin and tenant admin pages
   ═══════════════════════════════════════════════════════════════════════════ */

interface NotesListViewProps {
  basePath: string; // e.g., "/super-admin" or "/admin"
}

interface TemplatePreset {
  id: string;
  label: string;
  title: string;
  content: string;
}

const NOTE_TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: "meeting",
    label: "Meeting Notes",
    title: "Meeting Notes",
    content: "# Meeting Notes\n\n## Attendees\n\n- \n\n## Agenda\n\n- \n\n## Notes\n\n- \n\n## Action Items\n\n- [ ] \n",
  },
  {
    id: "api-docs",
    label: "API Docs",
    title: "API Documentation",
    content: "# API Documentation\n\n## Overview\n\n## Endpoints\n\n## Auth\n\n## Examples\n",
  },
  {
    id: "decision",
    label: "Decision Log",
    title: "Decision Log",
    content: "# Decision Log\n\n## Context\n\n## Decision\n\n## Alternatives\n\n## Risks\n",
  },
];

export function NotesListView({ basePath }: NotesListViewProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<NoteFilters>({});
  const [showNewModal, setShowNewModal] = useState(false);
  const [templatePreset, setTemplatePreset] = useState<TemplatePreset | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "compact" | "cards">("list");
  const searchRef = useRef<HTMLInputElement | null>(null);
  
  useEffect(() => {
    loadNotes();
    loadCategories();
  }, [filters]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isTyping = target?.isContentEditable || tagName === "input" || tagName === "textarea" || tagName === "select";

      if (!isTyping && event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }

      if (!isTyping && event.key.toLowerCase() === "n") {
        event.preventDefault();
        setTemplatePreset(null);
        setShowNewModal(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  
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

  const statusCounts = useMemo(() => {
    return notes.reduce<Record<string, number>>((acc, note) => {
      acc[note.status] = (acc[note.status] || 0) + 1;
      return acc;
    }, {});
  }, [notes]);

  const categoryCounts = useMemo(() => {
    return notes.reduce<Record<string, number>>((acc, note) => {
      if (note.category_id) {
        acc[note.category_id] = (acc[note.category_id] || 0) + 1;
      }
      return acc;
    }, {});
  }, [notes]);

  const projectCounts = useMemo(() => {
    return notes.reduce<Record<string, number>>((acc, note) => {
      if (note.project_name) {
        acc[note.project_name] = (acc[note.project_name] || 0) + 1;
      }
      return acc;
    }, {});
  }, [notes]);

  const activeFilters = useMemo(() => {
    const items: Array<{ label: string; onClear: () => void }> = [];
    if (filters.search) {
      items.push({
        label: `Search: ${filters.search}`,
        onClear: () => setFilters(prev => {
          const next = { ...prev };
          delete next.search;
          return next;
        }),
      });
    }
    if (filters.status) {
      items.push({
        label: `Status: ${filters.status}`,
        onClear: () => setFilters(prev => {
          const next = { ...prev };
          delete next.status;
          return next;
        }),
      });
    }
    if (filters.category_id) {
      const category = categories.find(cat => cat.id === filters.category_id);
      items.push({
        label: `Category: ${category?.name || "Unknown"}`,
        onClear: () => setFilters(prev => {
          const next = { ...prev };
          delete next.category_id;
          return next;
        }),
      });
    }
    if (filters.project_name) {
      items.push({
        label: `Project: ${filters.project_name}`,
        onClear: () => setFilters(prev => {
          const next = { ...prev };
          delete next.project_name;
          return next;
        }),
      });
    }
    return items;
  }, [categories, filters]);

  function handleTemplatePreset(preset: TemplatePreset) {
    setTemplatePreset(preset);
    setShowNewModal(true);
  }
  
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-72 border-r border-[var(--border-subtle)] p-4 overflow-y-auto">
        {/* Quick Actions */}
        <button
          onClick={() => {
            setTemplatePreset(null);
            setShowNewModal(true);
          }}
          className="w-full mb-4 px-4 py-2.5 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Note
        </button>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="mb-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Active</span>
              <button
                onClick={() => setFilters({})}
                className="text-xs text-[var(--electric-lime)] hover:underline"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map(item => (
                <button
                  key={item.label}
                  onClick={item.onClear}
                  className="flex items-center gap-1 rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <span className="truncate max-w-[140px]">{item.label}</span>
                  <span className="text-[var(--text-muted)]">x</span>
                </button>
              ))}
            </div>
          </div>
        )}
        
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
                  onClick={() =>
                    setFilters(prev => {
                      const next = { ...prev };
                      if (status === "all") {
                        delete next.status;
                      } else {
                        next.status = status;
                      }
                      return next;
                    })
                  }
                  className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-2 ${
                    (status === "all" && !filters.status) || filters.status === status
                      ? "bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
                  }`}
                >
                  <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                  <span className="ml-auto text-xs text-[var(--text-muted)]">
                    {status === "all" ? notes.length : (statusCounts[status] || 0)}
                  </span>
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
                  onClick={() =>
                    setFilters(prev => {
                      const next = { ...prev };
                      delete next.category_id;
                      return next;
                    })
                  }
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
                    onClick={() =>
                      setFilters(prev => ({ ...prev, category_id: cat.id }))
                    }
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
                    <span>{cat.name}</span>
                    <span className="ml-auto text-xs text-[var(--text-muted)]">
                      {categoryCounts[cat.id] || 0}
                    </span>
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
                  onClick={() =>
                    setFilters(prev => {
                      const next = { ...prev };
                      delete next.project_name;
                      return next;
                    })
                  }
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
                    onClick={() =>
                      setFilters(prev => ({ ...prev, project_name: project }))
                    }
                    className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-2 ${
                      filters.project_name === project
                        ? "bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
                    }`}
                  >
                    <span className="truncate">{project}</span>
                    <span className="ml-auto text-xs text-[var(--text-muted)]">
                      {projectCounts[project] || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Navigation Links */}
        <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] space-y-1">
          <Link
            href={`${basePath}/notes/graph`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            Knowledge Graph
          </Link>
          <Link
            href={`${basePath}/notes/templates`}
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
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 border-b border-[var(--border-subtle)] bg-[var(--surface-0)]/90 backdrop-blur">
          <div className="max-w-6xl mx-auto px-8 py-4 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                  Notes
                </h1>
                <p className="text-sm text-[var(--text-muted)]">
                  Documentation, context, and knowledge for your projects
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setTemplatePreset(null);
                    setShowNewModal(true);
                  }}
                  className="px-4 py-2.5 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all"
                >
                  New Note
                </button>
                <div className="flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-1)] p-1">
                  {(["list", "compact", "cards"] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                        viewMode === mode
                          ? "bg-[var(--electric-lime)]/15 text-[var(--electric-lime)]"
                          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search notes by title, tags, or content..."
                value={filters.search || ""}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                ref={searchRef}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--electric-lime)]"
              />
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-8 py-8">
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingText text="Loading notes..." />
            </div>
          ) : notes.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              }
              title="No notes yet"
              description="Create your first note to start documenting your projects, APIs, and architecture decisions."
              action={
                <div className="flex flex-col items-center gap-3">
                  <button
                    onClick={() => {
                      setTemplatePreset(null);
                      setShowNewModal(true);
                    }}
                    className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all"
                  >
                    Create First Note
                  </button>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {NOTE_TEMPLATE_PRESETS.map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => handleTemplatePreset(preset)}
                        className="px-3 py-1.5 rounded-full border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--electric-lime)] transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              }
            />
          ) : (
            <div className="space-y-6">
              {/* Pinned Notes */}
              {pinnedNotes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    Pinned ({pinnedNotes.length})
                    </h2>
                    <span className="text-xs text-[var(--text-muted)]">Quick access</span>
                  </div>
                  <div className={viewMode === "cards" ? "grid gap-3 sm:grid-cols-2" : "space-y-2"}>
                    {pinnedNotes.map(note => (
                      <NoteCard key={note.id} note={note} basePath={basePath} viewMode={viewMode} />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Regular Notes */}
              <div>
                {pinnedNotes.length > 0 && (
                  <h2 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
                    All Notes ({regularNotes.length})
                  </h2>
                )}
                <div className={viewMode === "cards" ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "space-y-2"}>
                  {regularNotes.map(note => (
                    <NoteCard key={note.id} note={note} basePath={basePath} viewMode={viewMode} />
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
          onClose={() => {
            setShowNewModal(false);
            setTemplatePreset(null);
          }}
          onCreated={(note) => {
            setNotes(prev => [note, ...prev]);
            setShowNewModal(false);
            setTemplatePreset(null);
          }}
          categories={categories}
          basePath={basePath}
          preset={templatePreset}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Note Card Component
   ═══════════════════════════════════════════════════════════════════════════ */

function NoteCard({
  note,
  basePath,
  viewMode,
}: {
  note: Note;
  basePath: string;
  viewMode: "list" | "compact" | "cards";
}) {
  const statusColors = {
    draft: "bg-[var(--warning)]/10 text-[var(--warning)]",
    published: "bg-[var(--success)]/10 text-[var(--success)]",
    archived: "bg-[var(--text-muted)]/10 text-[var(--text-muted)]",
  };
  
  return (
    <Link
      href={`${basePath}/notes/${note.id}`}
      className={`group block rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] transition-all hover:-translate-y-[1px] hover:border-[var(--border)] ${
        viewMode === "compact" ? "p-3" : "p-4"
      } ${note.is_pinned ? "border-l-4 border-l-[var(--electric-lime)]" : "border-l-4 border-l-transparent"}`}
    >
      <div className={`flex items-start gap-4 ${viewMode === "cards" ? "flex-col" : "justify-between"}`}>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className={`font-semibold text-[var(--text-primary)] truncate ${viewMode === "compact" ? "text-sm" : "text-base"}`}>
              {note.title}
            </h3>
            <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[note.status]}`}>
              {note.status}
            </span>
            {note.is_api_accessible && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--electric-cyan)]/10 text-[var(--electric-cyan)]">
                API
              </span>
            )}
          </div>
          
          {note.excerpt && (
            <p className={`text-sm text-[var(--text-muted)] mb-2 ${viewMode === "compact" ? "line-clamp-1" : "line-clamp-2"}`}>
              {note.excerpt}
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
            {note.category && (
              <span className="flex items-center gap-1 text-[var(--text-primary)]">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: note.category.color }}
                />
                {note.category.name}
              </span>
            )}
            {note.project_name && (
              <span className="px-2 py-0.5 rounded-full bg-[var(--surface-2)]">
                {note.project_name}
              </span>
            )}
            {note.tags?.length > 0 && (
              <span>
                {note.tags.slice(0, 3).join(", ")}
                {note.tags.length > 3 && ` +${note.tags.length - 3}`}
              </span>
            )}
            <span className="text-[var(--text-muted)]">/</span>
            <span className="text-[var(--text-muted)]">
              Updated {new Date(note.updated_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        
        {viewMode !== "cards" && (
          <svg className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        )}
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
  basePath,
  preset,
}: {
  onClose: () => void;
  onCreated: (note: Note) => void;
  categories: NoteCategory[];
  basePath: string;
  preset: TemplatePreset | null;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preset) {
      setTitle(preset.title);
      setContent(preset.content);
    } else {
      setTitle("");
      setContent("");
    }
  }, [preset]);
  
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
          ...(categoryId ? { category_id: categoryId } : {}),
          ...(projectName.trim() ? { project_name: projectName.trim() } : {}),
          content: content.trim() ? content : `# ${title.trim()}\n\n`,
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
          {preset && (
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Starting from {preset.label}
            </p>
          )}
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
            href={`${basePath}/notes/templates`}
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
