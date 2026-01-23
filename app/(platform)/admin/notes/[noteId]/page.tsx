"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Note, NoteVersion, NoteCategory } from "@/types/notes";

/* ═══════════════════════════════════════════════════════════════════════════
   Note Detail Page - Tenant Admin
   ═══════════════════════════════════════════════════════════════════════════ */

export default function NoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const noteId = params.noteId as string;
  
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const [editedContent, setEditedContent] = useState("");
  const [editedTitle, setEditedTitle] = useState("");
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [focusMode, setFocusMode] = useState(false);
  const [editorMode, setEditorMode] = useState<"edit" | "split" | "preview">("edit");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [openSections, setOpenSections] = useState({
    status: true,
    taxonomy: true,
    history: false,
    meta: true,
    danger: false,
  });
  
  const hasChanges = editedContent !== note?.content || editedTitle !== note?.title;
  
  const loadNote = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/notes/${noteId}`);
      if (res.ok) {
        const data = await res.json();
        setNote(data.note);
        setEditedContent(data.note.content || "");
        setEditedTitle(data.note.title || "");
      } else if (res.status === 404) {
        router.push("/admin/notes");
      }
    } catch (err) {
      console.error("Failed to load note:", err);
    } finally {
      setLoading(false);
    }
  }, [noteId, router]);
  
  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/notes/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  }, []);

  useEffect(() => {
    loadNote();
    loadCategories();
  }, [loadNote, loadCategories]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isTyping = target?.isContentEditable || tagName === "input" || tagName === "textarea" || tagName === "select";
      const isMeta = event.metaKey || event.ctrlKey;

      if (isMeta && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (!hasChanges || saving) return;
        saveNote();
      }

      if (!isTyping && isMeta && event.shiftKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setFocusMode(prev => !prev);
      }

      if (!isTyping && isMeta && event.shiftKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        setEditorMode(prev => {
          const order: Array<"edit" | "split" | "preview"> = ["edit", "split", "preview"];
          const nextIndex = (order.indexOf(prev) + 1) % order.length;
          return order[nextIndex];
        });
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasChanges, saving, saveNote]);
  
  async function loadVersions() {
    try {
      const res = await fetch(`/api/notes/${noteId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
      }
    } catch (err) {
      console.error("Failed to load versions:", err);
    }
  }
  
  async function saveNote() {
    if (!note) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editedTitle,
          content: editedContent,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setNote(data.note);
      }
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setSaving(false);
    }
  }
  
  async function updateStatus(status: string) {
    if (!note) return;
    
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setNote(data.note);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  }
  
  async function togglePin() {
    if (!note) return;
    
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_pinned: !note.is_pinned }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setNote(data.note);
      }
    } catch (err) {
      console.error("Failed to toggle pin:", err);
    }
  }
  
  async function deleteNote() {
    if (!confirm("Are you sure you want to delete this note?")) return;
    
    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/notes");
      }
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  }

  function toggleSection(section: keyof typeof openSections) {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  }

  function exportNote() {
    window.open(`/api/notes/${noteId}/export`, "_blank");
  }
  
  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-[var(--text-muted)]">
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Loading note...</span>
          </div>
        </div>
      </div>
    );
  }
  
  if (!note) {
    return (
      <div className="p-8">
        <div className="text-center py-16">
          <h2 className="text-lg font-medium text-[var(--text-primary)]">
            Note not found
          </h2>
          <Link
            href="/admin/notes"
            className="mt-4 inline-block text-[var(--electric-lime)] hover:underline"
          >
            Back to notes
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex flex-col gap-3 bg-[var(--surface-0)]/90 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/notes"
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </Link>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="text-lg font-semibold text-[var(--text-primary)] bg-transparent border-none focus:outline-none min-w-[220px]"
              />
              <span className={`px-2 py-0.5 text-xs rounded ${
                note.status === "published" 
                  ? "bg-[var(--success)]/10 text-[var(--success)]"
                  : note.status === "draft"
                  ? "bg-[var(--warning)]/10 text-[var(--warning)]"
                  : "bg-[var(--text-muted)]/10 text-[var(--text-muted)]"
              }`}>
                {note.status}
              </span>
            </div>
            
            <div className="flex items-center gap-2 relative">
              <div className="flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-1)] p-1">
                {(["edit", "split", "preview"] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setEditorMode(mode)}
                    className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                      editorMode === mode
                        ? "bg-[var(--electric-lime)]/15 text-[var(--electric-lime)]"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowShortcuts((prev) => !prev)}
                className="px-3 py-2 rounded-lg border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Shortcuts
              </button>
              {showShortcuts && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3 shadow-lg">
                  <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">
                    Editor Shortcuts
                  </div>
                  <div className="space-y-2 text-xs text-[var(--text-secondary)]">
                    <div className="flex items-center justify-between">
                      <span>Save note</span>
                      <span className="text-[var(--text-muted)]">Cmd/Ctrl + S</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Toggle focus</span>
                      <span className="text-[var(--text-muted)]">Cmd/Ctrl + Shift + F</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Cycle preview</span>
                      <span className="text-[var(--text-muted)]">Cmd/Ctrl + Shift + P</span>
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={() => setFocusMode(!focusMode)}
                className="px-3 py-2 rounded-lg border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {focusMode ? "Show Sidebar" : "Focus"}
              </button>
              <button
                onClick={exportNote}
                className="px-3 py-2 rounded-lg border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Export
              </button>
              <button
                onClick={() => updateStatus(note.status === "published" ? "draft" : "published")}
                className="px-3 py-2 rounded-lg border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {note.status === "published" ? "Unpublish" : "Publish"}
              </button>
              <button
                onClick={saveNote}
                disabled={!hasChanges || saving}
                className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all disabled:opacity-50"
              >
                {saving ? "Saving..." : hasChanges ? "Save changes" : "Saved"}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>Markdown supported - use # for headings, [] for checklists.</span>
            <span>{hasChanges ? "Unsaved changes" : "All changes saved"}</span>
          </div>
        </div>
        
        {/* Editor */}
        <div className="flex-1 p-6 overflow-y-auto">
          {editorMode === "preview" ? (
            <div className="w-full h-full min-h-[500px] p-5 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
              <MarkdownPreview content={editedContent || ""} />
            </div>
          ) : editorMode === "split" ? (
            <div className="flex flex-col lg:flex-row gap-4 h-full">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full lg:w-1/2 h-full min-h-[400px] p-5 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono text-sm resize-none focus:outline-none focus:border-[var(--electric-lime)]"
                placeholder="Start writing..."
              />
              <div className="w-full lg:w-1/2 h-full min-h-[400px] p-5 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] overflow-y-auto">
                <MarkdownPreview content={editedContent || ""} />
              </div>
            </div>
          ) : (
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-full min-h-[500px] p-5 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono text-sm resize-none focus:outline-none focus:border-[var(--electric-lime)]"
              placeholder="Start writing..."
            />
          )}
        </div>
      </div>
      
      {/* Sidebar */}
      {!focusMode && (
        <div className="w-80 border-l border-[var(--border-subtle)] p-4 overflow-y-auto">
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">
            Note Details
          </h3>
          
          <div className="space-y-4">
            {/* Status */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3">
              <button
                onClick={() => toggleSection("status")}
                className="w-full flex items-center justify-between text-xs uppercase tracking-wider text-[var(--text-muted)]"
              >
                Status
                <span>{openSections.status ? "-" : "+"}</span>
              </button>
              {openSections.status && (
                <div className="mt-3 space-y-3">
                  <select
                    value={note.status}
                    onChange={(e) => updateStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-0)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                  <button
                    onClick={togglePin}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      note.is_pinned
                        ? "bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]"
                        : "bg-[var(--surface-0)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <svg className="w-4 h-4" fill={note.is_pinned ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    {note.is_pinned ? "Pinned" : "Pin Note"}
                  </button>
                </div>
              )}
            </div>
            
            {/* Taxonomy */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3">
              <button
                onClick={() => toggleSection("taxonomy")}
                className="w-full flex items-center justify-between text-xs uppercase tracking-wider text-[var(--text-muted)]"
              >
                Taxonomy
                <span>{openSections.taxonomy ? "-" : "+"}</span>
              </button>
              {openSections.taxonomy && (
                <div className="mt-3">
                  <label className="block text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={note.category_id || ""}
                    onChange={async (e) => {
                      const res = await fetch(`/api/notes/${noteId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ category_id: e.target.value || null }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        setNote(data.note);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-0)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm"
                  >
                    <option value="">None</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            {/* Version History */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3">
              <button
                onClick={() => {
                  toggleSection("history");
                  if (!openSections.history) loadVersions();
                }}
                className="w-full flex items-center justify-between text-xs uppercase tracking-wider text-[var(--text-muted)]"
              >
                Version History
                <span className="text-[var(--text-muted)]">v{note.version}</span>
              </button>
              {openSections.history && (
                <div className="mt-3 space-y-2">
                  {versions.map(v => (
                    <div key={v.id} className="text-xs text-[var(--text-muted)]">
                      v{v.version} - {new Date(v.created_at).toLocaleDateString()}
                    </div>
                  ))}
                  {versions.length === 0 && (
                    <div className="text-xs text-[var(--text-muted)]">No previous versions</div>
                  )}
                </div>
              )}
            </div>
            
            {/* Meta */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3">
              <button
                onClick={() => toggleSection("meta")}
                className="w-full flex items-center justify-between text-xs uppercase tracking-wider text-[var(--text-muted)]"
              >
                Metadata
                <span>{openSections.meta ? "-" : "+"}</span>
              </button>
              {openSections.meta && (
                <div className="mt-3 space-y-2 text-xs text-[var(--text-muted)]">
                  <div className="flex justify-between">
                    <span>Created</span>
                    <span>{new Date(note.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Updated</span>
                    <span>{new Date(note.updated_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Words</span>
                    <span>{note.content?.split(/\s+/).filter(Boolean).length || 0}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Delete */}
            <div className="rounded-xl border border-[var(--error)]/20 bg-[var(--surface-1)] p-3">
              <button
                onClick={() => toggleSection("danger")}
                className="w-full flex items-center justify-between text-xs uppercase tracking-wider text-[var(--error)]"
              >
                Danger Zone
                <span>{openSections.danger ? "-" : "+"}</span>
              </button>
              {openSections.danger && (
                <button
                  onClick={deleteNote}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[var(--error)]/30 text-[var(--error)] text-sm hover:bg-[var(--error)]/10 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 0 00-7.5 0" />
                  </svg>
                  Delete Note
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Simple Markdown Preview (basic rendering)
   ═══════════════════════════════════════════════════════════════════════════ */

function MarkdownPreview({ content }: { content: string }) {
  const html = content
    // Headers
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, "<pre><code>$2</code></pre>")
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Lists
    .replace(/^\- (.*$)/gim, "<li>$1</li>")
    // Paragraphs
    .replace(/\n\n/g, "</p><p>")
    // Line breaks
    .replace(/\n/g, "<br>");

  return (
    <div
      className="prose-headings:text-[var(--text-primary)] prose-p:text-[var(--text-secondary)] prose-a:text-[var(--electric-lime)] prose-code:bg-[var(--surface-2)] prose-code:px-1 prose-code:rounded prose-pre:bg-[var(--surface-2)] prose-pre:p-4 prose-pre:rounded-lg"
      dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }}
    />
  );
}
