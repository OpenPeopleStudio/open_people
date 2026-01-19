"use client";

import { useState, useEffect } from "react";
import type { KnowledgeFact, KnowledgeDocument, FactType } from "@/types/mlf";

/* ═══════════════════════════════════════════════════════════════════════════
   Knowledge Base Page - Tenant Admin
   Facts and documents management with semantic search
   ═══════════════════════════════════════════════════════════════════════════ */

export default function KnowledgePage() {
  const [activeTab, setActiveTab] = useState<"facts" | "documents">("facts");
  const [facts, setFacts] = useState<KnowledgeFact[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedFactType, setSelectedFactType] = useState<FactType | "">("");
  const [showAddFact, setShowAddFact] = useState(false);
  const [showAddDoc, setShowAddDoc] = useState(false);
  
  useEffect(() => {
    if (activeTab === "facts") {
      loadFacts();
    } else {
      loadDocuments();
    }
  }, [activeTab, selectedFactType]);
  
  async function loadFacts() {
    try {
      setLoading(true);
      let url = "/api/mlf/facts?limit=100";
      if (selectedFactType) {
        url += `&type=${selectedFactType}`;
      }
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setFacts(data.facts || []);
      }
    } catch (err) {
      console.error("Failed to load facts:", err);
    } finally {
      setLoading(false);
    }
  }
  
  async function loadDocuments() {
    try {
      setLoading(true);
      let url = "/api/mlf/knowledge?limit=100";
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  }
  
  async function deleteFact(id: string) {
    if (!confirm("Delete this fact?")) return;
    
    const res = await fetch(`/api/mlf/facts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setFacts(prev => prev.filter(f => f.id !== id));
    }
  }
  
  async function verifyFact(id: string) {
    const res = await fetch(`/api/mlf/facts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verify: true }),
    });
    
    if (res.ok) {
      const { fact } = await res.json();
      setFacts(prev => prev.map(f => f.id === id ? fact : f));
    }
  }
  
  const factTypes: FactType[] = [
    "user_preference", "project_detail", "business_rule", "contact",
    "date", "location", "relationship", "technical", "process",
    "decision", "goal", "constraint"
  ];
  
  const factTypeColors: Record<string, string> = {
    user_preference: "var(--electric-lime)",
    project_detail: "var(--electric-cyan)",
    business_rule: "var(--warning)",
    contact: "var(--electric-violet)",
    date: "#f97316",
    location: "#14b8a6",
    relationship: "#ec4899",
    technical: "#6366f1",
    process: "#8b5cf6",
    decision: "#f59e0b",
    goal: "#10b981",
    constraint: "#ef4444",
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Knowledge Base
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Facts and documents that inform AI responses
          </p>
        </div>
        
        <button
          onClick={() => activeTab === "facts" ? setShowAddFact(true) : setShowAddDoc(true)}
          className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all"
        >
          Add {activeTab === "facts" ? "Fact" : "Document"}
        </button>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("facts")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "facts"
              ? "bg-[var(--electric-lime)] text-[var(--void)]"
              : "bg-[var(--surface-1)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Facts ({facts.length})
        </button>
        <button
          onClick={() => setActiveTab("documents")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "documents"
              ? "bg-[var(--electric-lime)] text-[var(--void)]"
              : "bg-[var(--surface-1)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Documents ({documents.length})
        </button>
      </div>
      
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (activeTab === "facts" ? loadFacts() : loadDocuments())}
            placeholder={`Search ${activeTab}...`}
            className="w-full px-4 py-2 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
          />
        </div>
        
        {activeTab === "facts" && (
          <select
            value={selectedFactType}
            onChange={(e) => setSelectedFactType(e.target.value as FactType | "")}
            className="px-4 py-2 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
          >
            <option value="">All Types</option>
            {factTypes.map(type => (
              <option key={type} value={type}>
                {type.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        )}
      </div>
      
      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-[var(--text-muted)]">
          Loading...
        </div>
      ) : activeTab === "facts" ? (
        <div className="space-y-3">
          {facts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--text-muted)]">No facts found</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Facts are extracted from conversations or added manually
              </p>
            </div>
          ) : (
            facts.map(fact => (
              <div
                key={fact.id}
                className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-[var(--text-primary)]">{fact.fact}</p>
                    
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span
                        className="px-2 py-0.5 text-xs rounded"
                        style={{
                          backgroundColor: `${factTypeColors[fact.fact_type] || "var(--text-muted)"}20`,
                          color: factTypeColors[fact.fact_type] || "var(--text-muted)",
                        }}
                      >
                        {fact.fact_type.replace(/_/g, " ")}
                      </span>
                      
                      {fact.subject_name && (
                        <span className="text-xs text-[var(--text-muted)]">
                          about: {fact.subject_name}
                        </span>
                      )}
                      
                      {fact.is_verified && (
                        <span className="px-2 py-0.5 text-xs rounded bg-[var(--success)]/20 text-[var(--success)]">
                          verified
                        </span>
                      )}
                      
                      <span className="text-xs text-[var(--text-muted)]">
                        confidence: {(fact.confidence * 100).toFixed(0)}%
                      </span>
                      
                      <span className="text-xs text-[var(--text-muted)]">
                        used {fact.access_count}x
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!fact.is_verified && (
                      <button
                        onClick={() => verifyFact(fact.id)}
                        className="p-1.5 rounded hover:bg-[var(--success)]/10 text-[var(--text-muted)] hover:text-[var(--success)]"
                        title="Verify"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => deleteFact(fact.id)}
                      className="p-1.5 rounded hover:bg-[var(--error)]/10 text-[var(--text-muted)] hover:text-[var(--error)]"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-[var(--text-muted)]">No documents found</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Add documents for semantic search and RAG
              </p>
            </div>
          ) : (
            documents.map(doc => (
              <div
                key={doc.id}
                className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-[var(--electric-lime)] transition-colors cursor-pointer"
              >
                <h3 className="font-medium text-[var(--text-primary)] truncate">
                  {doc.title}
                </h3>
                <p className="text-sm text-[var(--text-muted)] mt-1 line-clamp-2">
                  {doc.content.slice(0, 150)}...
                </p>
                <div className="flex items-center gap-2 mt-3">
                  {doc.category && (
                    <span className="px-2 py-0.5 text-xs rounded bg-[var(--electric-cyan)]/20 text-[var(--electric-cyan)]">
                      {doc.category}
                    </span>
                  )}
                  <span className="text-xs text-[var(--text-muted)]">
                    {doc.word_count} words
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {/* Add Fact Modal */}
      {showAddFact && (
        <AddFactModal
          factTypes={factTypes}
          onClose={() => setShowAddFact(false)}
          onAdd={(fact) => {
            setFacts(prev => [fact, ...prev]);
            setShowAddFact(false);
          }}
        />
      )}
      
      {/* Add Document Modal */}
      {showAddDoc && (
        <AddDocModal
          onClose={() => setShowAddDoc(false)}
          onAdd={(doc) => {
            setDocuments(prev => [doc, ...prev]);
            setShowAddDoc(false);
          }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Add Fact Modal
   ═══════════════════════════════════════════════════════════════════════════ */

function AddFactModal({
  factTypes,
  onClose,
  onAdd,
}: {
  factTypes: FactType[];
  onClose: () => void;
  onAdd: (fact: KnowledgeFact) => void;
}) {
  const [fact, setFact] = useState("");
  const [factType, setFactType] = useState<FactType>("user_preference");
  const [subjectName, setSubjectName] = useState("");
  const [saving, setSaving] = useState(false);
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fact.trim()) return;
    
    setSaving(true);
    try {
      const res = await fetch("/api/mlf/facts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fact: fact.trim(),
          fact_type: factType,
          subject_name: subjectName || undefined,
          source_type: "manual",
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        onAdd(data.fact);
      }
    } catch (err) {
      console.error("Failed to add fact:", err);
    } finally {
      setSaving(false);
    }
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg mx-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-xl">
        <div className="p-6 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Add Fact
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Fact
            </label>
            <textarea
              value={fact}
              onChange={(e) => setFact(e.target.value)}
              rows={3}
              placeholder="Enter a fact to remember..."
              className="w-full px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Type
              </label>
              <select
                value={factType}
                onChange={(e) => setFactType(e.target.value as FactType)}
                className="w-full px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
              >
                {factTypes.map(type => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                About (optional)
              </label>
              <input
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="Person, project, etc."
                className="w-full px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!fact.trim() || saving}
              className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add Fact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Add Document Modal
   ═══════════════════════════════════════════════════════════════════════════ */

function AddDocModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (doc: KnowledgeDocument) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    
    setSaving(true);
    try {
      const res = await fetch("/api/mlf/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category: category || undefined,
          content_type: "markdown",
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        onAdd(data.document);
      }
    } catch (err) {
      console.error("Failed to add document:", err);
    } finally {
      setSaving(false);
    }
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl mx-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-xl max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Add Knowledge Document
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document title"
                className="w-full px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., technical, process"
                className="w-full px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Content (Markdown)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              placeholder="Enter document content in markdown..."
              className="w-full px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono text-sm focus:outline-none focus:border-[var(--electric-lime)]"
              required
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Content will be automatically chunked for semantic search
            </p>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !content.trim() || saving}
              className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add Document"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
