"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Note, NoteVersion, NoteCategory } from "@/types/notes";

/* ═══════════════════════════════════════════════════════════════════════════
   Note Editor Page
   ═══════════════════════════════════════════════════════════════════════════ */

export default function NoteEditorPage({ params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = use(params);
  const router = useRouter();
  
  const [note, setNote] = useState<Note | null>(null);
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Editor state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  useEffect(() => {
    loadNote();
    loadCategories();
  }, [noteId]);
  
  async function loadNote() {
    try {
      setLoading(true);
      const res = await fetch(`/api/notes/${noteId}`);
      
      if (!res.ok) {
        router.push("/super-admin/notes");
        return;
      }
      
      const data = await res.json();
      setNote(data.note);
      setVersions(data.versions || []);
      setTitle(data.note.title);
      setContent(data.note.content);
    } catch (err) {
      console.error("Failed to load note:", err);
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
  
  const saveNote = useCallback(async (updates: Partial<Note>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      
      if (res.ok) {
        const data = await res.json();
        setNote(data.note);
        setLastSaved(new Date());
      }
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setSaving(false);
    }
  }, [noteId]);
  
  // Auto-save on content change (debounced)
  useEffect(() => {
    if (!note || loading) return;
    
    const timer = setTimeout(() => {
      if (title !== note.title || content !== note.content) {
        saveNote({ title, content });
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [title, content, note, loading, saveNote]);
  
  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this note?")) return;
    
    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/super-admin/notes");
      }
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  }
  
  async function handleExport() {
    window.open(`/api/notes/${noteId}/export`, "_blank");
  }
  
  async function handleRestoreVersion(version: number) {
    try {
      const res = await fetch(`/api/notes/${noteId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setNote(data.note);
        setTitle(data.note.title);
        setContent(data.note.content);
        setShowVersions(false);
      }
    } catch (err) {
      console.error("Failed to restore version:", err);
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex items-center gap-3 text-[var(--text-muted)]">
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Loading note...</span>
        </div>
      </div>
    );
  }
  
  if (!note) return null;
  
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-4">
          <Link
            href="/super-admin/notes"
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          
          <div className="flex items-center gap-2 text-sm">
            {saving ? (
              <span className="text-[var(--text-muted)]">Saving...</span>
            ) : lastSaved ? (
              <span className="text-[var(--success)]">Saved</span>
            ) : null}
            <span className="text-[var(--text-muted)]">v{note.version}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <select
            value={note.status}
            onChange={(e) => saveNote({ status: e.target.value as Note["status"] })}
            className="px-2 py-1 rounded text-xs bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-secondary)]"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          
          {/* Toggle Preview */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`p-2 rounded-lg transition-colors ${
              showPreview 
                ? "bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]" 
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)]"
            }`}
            title="Preview"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          
          {/* Version History */}
          <button
            onClick={() => setShowVersions(!showVersions)}
            className={`p-2 rounded-lg transition-colors ${
              showVersions 
                ? "bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]" 
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)]"
            }`}
            title="Version History"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          
          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${
              showSettings 
                ? "bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]" 
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)]"
            }`}
            title="Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          
          {/* Export */}
          <button
            onClick={handleExport}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)] transition-colors"
            title="Export as .md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className={`flex-1 flex flex-col overflow-hidden ${showPreview ? "w-1/2" : ""}`}>
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title..."
            className="px-8 pt-6 pb-2 text-2xl font-semibold text-[var(--text-primary)] bg-transparent border-0 focus:outline-none"
          />
          
          {/* Content Editor */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing..."
            className="flex-1 px-8 py-4 text-[var(--text-primary)] bg-transparent border-0 focus:outline-none resize-none font-mono text-sm leading-relaxed"
          />
        </div>
        
        {/* Preview */}
        {showPreview && (
          <div className="w-1/2 border-l border-[var(--border-subtle)] overflow-y-auto p-8">
            <div className="prose prose-invert max-w-none">
              <h1>{title}</h1>
              <MarkdownPreview content={content} />
            </div>
          </div>
        )}
        
        {/* Version History Panel */}
        {showVersions && (
          <div className="w-80 border-l border-[var(--border-subtle)] overflow-y-auto">
            <div className="p-4 border-b border-[var(--border-subtle)]">
              <h3 className="text-sm font-medium text-[var(--text-primary)]">Version History</h3>
            </div>
            <div className="p-4 space-y-2">
              {/* Current Version */}
              <div className="p-3 rounded-lg bg-[var(--electric-lime)]/5 border border-[var(--electric-lime)]/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    v{note.version} (current)
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {new Date(note.updated_at).toLocaleString()}
                  </span>
                </div>
              </div>
              
              {/* Past Versions */}
              {versions.map(version => (
                <div
                  key={version.id}
                  className="p-3 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-[var(--border)] transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      v{version.version}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {new Date(version.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-2">
                    {version.title}
                  </p>
                  <button
                    onClick={() => handleRestoreVersion(version.version)}
                    className="text-xs text-[var(--electric-lime)] hover:underline"
                  >
                    Restore this version
                  </button>
                </div>
              ))}
              
              {versions.length === 0 && (
                <p className="text-sm text-[var(--text-muted)] text-center py-4">
                  No previous versions yet
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Settings Panel */}
        {showSettings && (
          <div className="w-80 border-l border-[var(--border-subtle)] overflow-y-auto">
            <div className="p-4 border-b border-[var(--border-subtle)]">
              <h3 className="text-sm font-medium text-[var(--text-primary)]">Note Settings</h3>
            </div>
            <div className="p-4 space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={note.category_id || ""}
                  onChange={(e) => saveNote({ category_id: e.target.value || null })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm"
                >
                  <option value="">None</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Project */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                  Project
                </label>
                <input
                  type="text"
                  value={note.project_name || ""}
                  onChange={(e) => saveNote({ project_name: e.target.value || null })}
                  placeholder="e.g., open_people"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm"
                />
              </div>
              
              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                  Tags
                </label>
                <input
                  type="text"
                  value={note.tags?.join(", ") || ""}
                  onChange={(e) => saveNote({ tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                  placeholder="tag1, tag2, tag3"
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm"
                />
              </div>
              
              {/* Pin */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-[var(--text-secondary)]">Pin note</label>
                <button
                  onClick={() => saveNote({ is_pinned: !note.is_pinned })}
                  className={`w-10 h-6 rounded-full transition-colors ${
                    note.is_pinned ? "bg-[var(--electric-lime)]" : "bg-[var(--surface-2)]"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    note.is_pinned ? "translate-x-5" : "translate-x-1"
                  }`} />
                </button>
              </div>
              
              {/* API Access */}
              <div className="pt-4 border-t border-[var(--border-subtle)]">
                <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
                  API Access
                </h4>
                
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-[var(--text-secondary)]">Enable API access</label>
                  <button
                    onClick={() => saveNote({ is_api_accessible: !note.is_api_accessible })}
                    className={`w-10 h-6 rounded-full transition-colors ${
                      note.is_api_accessible ? "bg-[var(--electric-lime)]" : "bg-[var(--surface-2)]"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      note.is_api_accessible ? "translate-x-5" : "translate-x-1"
                    }`} />
                  </button>
                </div>
                
                {note.is_api_accessible && (
                  <div className="p-3 rounded-lg bg-[var(--surface-2)] text-xs">
                    <p className="text-[var(--text-muted)] mb-2">
                      Access via: <code className="text-[var(--electric-cyan)]">GET /api/v1/notes?slug={note.slug}</code>
                    </p>
                    <p className="text-[var(--text-muted)]">
                      Requires Bearer token (API key) with notes access.
                    </p>
                  </div>
                )}
              </div>
              
              {/* Danger Zone */}
              <div className="pt-4 border-t border-[var(--border-subtle)]">
                <button
                  onClick={handleDelete}
                  className="w-full py-2 rounded-lg bg-[var(--error)]/10 text-[var(--error)] text-sm font-medium hover:bg-[var(--error)]/20 transition-colors"
                >
                  Delete Note
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Simple Markdown Preview (basic rendering)
   ═══════════════════════════════════════════════════════════════════════════ */

function MarkdownPreview({ content }: { content: string }) {
  // Very basic markdown rendering
  // In production, use a proper library like react-markdown
  
  const html = content
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Lists
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    // Line breaks
    .replace(/\n/g, '<br>');
  
  return (
    <div 
      className="prose-headings:text-[var(--text-primary)] prose-p:text-[var(--text-secondary)] prose-a:text-[var(--electric-lime)] prose-code:bg-[var(--surface-2)] prose-code:px-1 prose-code:rounded prose-pre:bg-[var(--surface-2)] prose-pre:p-4 prose-pre:rounded-lg"
      dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }} 
    />
  );
}
