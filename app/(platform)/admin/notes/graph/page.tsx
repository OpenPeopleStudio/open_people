"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/* ═══════════════════════════════════════════════════════════════════════════
   Notes Graph Page - Tenant Admin
   Visual knowledge graph showing note connections
   ═══════════════════════════════════════════════════════════════════════════ */

interface GraphNode {
  id: string;
  title: string;
  category?: { name: string; color: string };
  connections: number;
}

export default function NotesGraphPage() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadGraph();
  }, []);
  
  async function loadGraph() {
    try {
      setLoading(true);
      const res = await fetch("/api/notes/graph");
      if (res.ok) {
        const data = await res.json();
        setNodes(data.nodes || []);
      }
    } catch (err) {
      console.error("Failed to load graph:", err);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="p-8 h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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
              Knowledge Graph
            </h1>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Visual representation of note connections and relationships
          </p>
        </div>
      </div>
      
      {/* Graph Area */}
      <div className="flex-1 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-3 text-[var(--text-muted)]">
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Loading graph...</span>
            </div>
          </div>
        ) : nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--surface-2)] flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                No connections yet
              </h3>
              <p className="text-sm text-[var(--text-muted)] max-w-md">
                Create notes and link them together to see the knowledge graph
              </p>
            </div>
          </div>
        ) : (
          <div className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {nodes.map(node => (
                <Link
                  key={node.id}
                  href={`/admin/notes/${node.id}`}
                  className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] hover:border-[var(--electric-lime)] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-3 h-3 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: node.category?.color || "var(--text-muted)" }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-[var(--text-primary)] truncate">
                        {node.title}
                      </h3>
                      {node.category && (
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {node.category.name}
                        </p>
                      )}
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {node.connections} connections
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
