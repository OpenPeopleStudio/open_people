"use client";

import { useState } from "react";
import type { AiCompany } from "@/types/ai-companies";

type Props = {
  companies: AiCompany[];
  selectedCompanyIds: string[];
  onSelectCompany: (ids: string[]) => void;
  onCreateCompany: (input: Partial<AiCompany> & { name: string }) => Promise<void>;
};

export function CompaniesPanel({
  companies,
  selectedCompanyIds,
  onSelectCompany,
  onCreateCompany,
}: Props) {
  const [newCompany, setNewCompany] = useState({
    name: "",
    contact_email: "",
    website: "",
    tags: "",
  });
  const [creating, setCreating] = useState(false);

  const toggleCompany = (id: string) => {
    if (selectedCompanyIds.includes(id)) {
      onSelectCompany(selectedCompanyIds.filter((c) => c !== id));
    } else {
      onSelectCompany([...selectedCompanyIds, id]);
    }
  };

  const handleCreate = async () => {
    if (!newCompany.name) return;
    setCreating(true);
    try {
      await onCreateCompany({
        name: newCompany.name,
        contact_email: newCompany.contact_email,
        website: newCompany.website,
        tags: newCompany.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setNewCompany({ name: "", contact_email: "", website: "", tags: "" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Companies</h2>
        <span className="text-xs text-[var(--text-muted)]">{companies.length} tracked</span>
      </div>

      <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
        {companies.map((company) => (
          <label
            key={company.id}
            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${
              selectedCompanyIds.includes(company.id)
                ? "border-[var(--electric-lime)] bg-[var(--electric-lime)]/5"
                : "border-[var(--border-subtle)] hover:border-[var(--border-strong)]"
            }`}
          >
            <input
              type="checkbox"
              className="mt-1 accent-[var(--electric-lime)]"
              checked={selectedCompanyIds.includes(company.id)}
              onChange={() => toggleCompany(company.id)}
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-[var(--text-primary)]">{company.name}</div>
              {company.contact_email && (
                <div className="text-xs text-[var(--text-muted)]">{company.contact_email}</div>
              )}
              {company.tags?.length ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {company.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-1 rounded-full bg-[var(--surface-2)] text-[var(--text-secondary)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </label>
        ))}
        {companies.length === 0 && (
          <div className="text-xs text-[var(--text-muted)]">No companies yet. Add one below.</div>
        )}
      </div>

      <div className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] space-y-2">
        <div className="text-xs font-semibold text-[var(--text-secondary)]">Add company</div>
        <input
          className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm"
          placeholder="Company name"
          value={newCompany.name}
          onChange={(e) => setNewCompany((prev) => ({ ...prev, name: e.target.value }))}
        />
        <input
          className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm"
          placeholder="Contact email"
          value={newCompany.contact_email}
          onChange={(e) => setNewCompany((prev) => ({ ...prev, contact_email: e.target.value }))}
        />
        <input
          className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm"
          placeholder="Website"
          value={newCompany.website}
          onChange={(e) => setNewCompany((prev) => ({ ...prev, website: e.target.value }))}
        />
        <input
          className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm"
          placeholder="Tags (comma separated)"
          value={newCompany.tags}
          onChange={(e) => setNewCompany((prev) => ({ ...prev, tags: e.target.value }))}
        />
        <button
          onClick={handleCreate}
          disabled={creating || !newCompany.name}
          className="w-full px-3 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] text-sm font-medium disabled:opacity-50"
        >
          {creating ? "Saving..." : "Save company"}
        </button>
      </div>
    </div>
  );
}

