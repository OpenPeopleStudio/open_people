"use client";

import type { ProposedChecklistItem } from "@/lib/ai/prompts/opsWorker";

interface ChecklistEditorProps {
  items: ProposedChecklistItem[];
  readOnly?: boolean;
  onChange?: (items: ProposedChecklistItem[]) => void;
}

export function ChecklistEditor({ items, readOnly, onChange }: ChecklistEditorProps) {
  return (
    <div className="space-y-1.5">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)]"
        >
          <div className="w-4 h-4 rounded border border-[var(--border)] shrink-0" />
          <span className="text-sm text-[var(--text-primary)] flex-1">{item.title}</span>
          {item.estimated_minutes && (
            <span className="text-xs text-[var(--text-muted)]">~{item.estimated_minutes}min</span>
          )}
        </div>
      ))}

      {!readOnly && onChange && (
        <button
          onClick={() => onChange([...items, { title: "" }])}
          className="w-full p-2 rounded-lg border border-dashed border-[var(--border-subtle)] text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--border)] transition-colors"
        >
          + Add step
        </button>
      )}
    </div>
  );
}
