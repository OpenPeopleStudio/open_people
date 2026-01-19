"use client";

import { useState } from "react";
import type { AICategory } from "@/types/vault";
import { getCategoryLabel } from "@/types/vault";

/* ═══════════════════════════════════════════════════════════════════════════
   Search Bar Component
   Search input with category filter dropdown
   ═══════════════════════════════════════════════════════════════════════════ */

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  categoryFilter: AICategory | null;
  onCategoryChange: (category: AICategory | null) => void;
}

const CATEGORIES: (AICategory | null)[] = [
  null,
  "invoice",
  "receipt",
  "contract",
  "statement",
  "id_document",
  "tax_document",
  "correspondence",
  "report",
  "image",
  "other",
];

export function SearchBar({ value, onChange, categoryFilter, onCategoryChange }: SearchBarProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  
  return (
    <div className="flex items-center gap-2">
      {/* Search input */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search files..."
          className="w-64 pl-9 pr-3 py-1.5 text-sm rounded-lg bg-[var(--surface-2)] border border-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--electric-lime)]"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-[var(--surface-3)] text-[var(--text-muted)]"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Category filter */}
      <div className="relative">
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
            categoryFilter
              ? "bg-[var(--electric-lime)]/10 border-[var(--electric-lime)]/30 text-[var(--electric-lime)]"
              : "bg-[var(--surface-2)] border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
          {categoryFilter ? getCategoryLabel(categoryFilter) : "Filter"}
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {filterOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
            <div className="absolute top-full right-0 mt-1 w-48 py-1 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-xl z-20 max-h-64 overflow-y-auto">
              {CATEGORIES.map(cat => (
                <button
                  key={cat || "all"}
                  onClick={() => { onCategoryChange(cat); setFilterOpen(false); }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--surface-2)] ${
                    categoryFilter === cat ? "text-[var(--electric-lime)]" : "text-[var(--text-primary)]"
                  }`}
                >
                  {cat ? getCategoryLabel(cat) : "All Categories"}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* Active filter clear */}
      {categoryFilter && (
        <button
          onClick={() => onCategoryChange(null)}
          className="p-1.5 rounded hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          title="Clear filter"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
