"use client";

import { useState } from "react";
import type { AiCompanyGroup, AiCompanyGroupSuggestion } from "@/types/ai-companies";

type Props = {
  groups: (AiCompanyGroup & { memberCount?: number })[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
  onCreateGroup: (input: {
    name: string;
    tags?: string[];
    description?: string;
    strategy?: string;
    companyIds?: string[];
  }) => Promise<void>;
  suggestions: AiCompanyGroupSuggestion[];
  onSuggestGroups: (prompt: string) => Promise<void>;
  onAdoptSuggestion: (suggestion: AiCompanyGroupSuggestion) => Promise<void>;
};

export function GroupsPanel({
  groups,
  selectedGroupId,
  onSelectGroup,
  onCreateGroup,
  suggestions,
  onSuggestGroups,
  onAdoptSuggestion,
}: Props) {
  const [prompt, setPrompt] = useState("");
  const [newGroup, setNewGroup] = useState({ name: "", tags: "" });
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleSuggest = async () => {
    setLoadingSuggest(true);
    await onSuggestGroups(prompt);
    setLoadingSuggest(false);
  };

  const handleCreate = async () => {
    if (!newGroup.name) return;
    setCreating(true);
    try {
      await onCreateGroup({
        name: newGroup.name,
        tags: newGroup.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setNewGroup({ name: "", tags: "" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Groups</h2>
        <span className="text-xs text-[var(--text-muted)]">{groups.length} groups</span>
      </div>

      <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => onSelectGroup(group.id === selectedGroupId ? null : group.id)}
            className={`text-left p-3 rounded-lg border ${
              selectedGroupId === group.id
                ? "border-[var(--electric-lime)] bg-[var(--electric-lime)]/5"
                : "border-[var(--border-subtle)] hover:border-[var(--border-strong)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-[var(--text-primary)]">{group.name}</div>
              {group.memberCount !== undefined && (
                <span className="text-[10px] px-2 py-1 rounded-full bg-[var(--surface-2)] text-[var(--text-secondary)]">
                  {group.memberCount} members
                </span>
              )}
            </div>
            {group.tags?.length ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {group.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-1 rounded-full bg-[var(--surface-2)] text-[var(--text-secondary)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            {group.description && (
              <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{group.description}</p>
            )}
          </button>
        ))}
        {groups.length === 0 && (
          <div className="text-xs text-[var(--text-muted)]">No groups yet. Add or ask AI below.</div>
        )}
      </div>

      <div className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] space-y-2">
        <div className="text-xs font-semibold text-[var(--text-secondary)]">Ask AI for group ideas</div>
        <textarea
          className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm"
          rows={2}
          placeholder="eg. prioritize devtools with generous free tiers"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          onClick={handleSuggest}
          disabled={loadingSuggest || !prompt}
          className="w-full px-3 py-2 rounded-lg bg-[var(--surface-3)] text-[var(--text-secondary)] text-sm font-medium disabled:opacity-50"
        >
          {loadingSuggest ? "Thinking..." : "Suggest groups"}
        </button>
        {suggestions.length > 0 && (
          <div className="space-y-2 mt-2">
            {suggestions.map((s, idx) => (
              <div key={`${s.name}-${idx}`} className="p-3 rounded-lg border border-[var(--border-subtle)]">
                <div className="text-sm font-semibold text-[var(--text-primary)]">{s.name}</div>
                {s.description && <p className="text-xs text-[var(--text-muted)] mt-1">{s.description}</p>}
                {s.companies?.length ? (
                  <ul className="text-xs text-[var(--text-secondary)] list-disc list-inside mt-1">
                    {s.companies.map((c) => (
                      <li key={c.name}>{c.name}{c.why ? ` — ${c.why}` : ""}</li>
                    ))}
                  </ul>
                ) : null}
                <button
                  onClick={() => onAdoptSuggestion(s)}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] text-xs font-semibold"
                >
                  Save as group
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] space-y-2">
        <div className="text-xs font-semibold text-[var(--text-secondary)]">Create group</div>
        <input
          className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm"
          placeholder="Group name"
          value={newGroup.name}
          onChange={(e) => setNewGroup((prev) => ({ ...prev, name: e.target.value }))}
        />
        <input
          className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm"
          placeholder="Tags (comma separated)"
          value={newGroup.tags}
          onChange={(e) => setNewGroup((prev) => ({ ...prev, tags: e.target.value }))}
        />
        <button
          onClick={handleCreate}
          disabled={creating || !newGroup.name}
          className="w-full px-3 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] text-sm font-medium disabled:opacity-50"
        >
          {creating ? "Saving..." : "Save group"}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { AiCompanyGroup, AiCompanyGroupSuggestion } from "@/types/ai-companies";

type Props = {
  groups: (AiCompanyGroup & { memberCount?: number })[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
  onCreateGroup: (input: {
    name: string;
    tags?: string[];
    description?: string;
    strategy?: string;
    companyIds?: string[];
  }) => Promise<void>;
  suggestions: AiCompanyGroupSuggestion[];
  onSuggestGroups: (prompt: string) => Promise<void>;
  onAdoptSuggestion: (suggestion: AiCompanyGroupSuggestion) => Promise<void>;
};

export function GroupsPanel({
  groups,
  selectedGroupId,
  onSelectGroup,
  onCreateGroup,
  suggestions,
  onSuggestGroups,
  onAdoptSuggestion,
}: Props) {
  const [prompt, setPrompt] = useState("");
  const [newGroup, setNewGroup] = useState({ name: "", tags: "" });
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleSuggest = async () => {
    setLoadingSuggest(true);
    await onSuggestGroups(prompt);
    setLoadingSuggest(false);
  };

  const handleCreate = async () => {
    if (!newGroup.name) return;
    setCreating(true);
    try {
      await onCreateGroup({
        name: newGroup.name,
        tags: newGroup.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setNewGroup({ name: "", tags: "" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Groups</h2>
        <span className="text-xs text-[var(--text-muted)]">{groups.length} groups</span>
      </div>

      <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => onSelectGroup(group.id === selectedGroupId ? null : group.id)}
            className={`text-left p-3 rounded-lg border ${
              selectedGroupId === group.id
                ? "border-[var(--electric-lime)] bg-[var(--electric-lime)]/5"
                : "border-[var(--border-subtle)] hover:border-[var(--border-strong)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-[var(--text-primary)]">{group.name}</div>
              {group.memberCount !== undefined && (
                <span className="text-[10px] px-2 py-1 rounded-full bg-[var(--surface-2)] text-[var(--text-secondary)]">
                  {group.memberCount} members
                </span>
              )}
            </div>
            {group.tags?.length ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {group.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-1 rounded-full bg-[var(--surface-2)] text-[var(--text-secondary)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            {group.description && (
              <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{group.description}</p>
            )}
          </button>
        ))}
        {groups.length === 0 && (
          <div className="text-xs text-[var(--text-muted)]">No groups yet. Add or ask AI below.</div>
        )}
      </div>

      <div className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] space-y-2">
        <div className="text-xs font-semibold text-[var(--text-secondary)]">Ask AI for group ideas</div>
        <textarea
          className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm"
          rows={2}
          placeholder="eg. prioritize devtools with generous free tiers"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          onClick={handleSuggest}
          disabled={loadingSuggest || !prompt}
          className="w-full px-3 py-2 rounded-lg bg-[var(--surface-3)] text-[var(--text-secondary)] text-sm font-medium disabled:opacity-50"
        >
          {loadingSuggest ? "Thinking..." : "Suggest groups"}
        </button>
        {suggestions.length > 0 && (
          <div className="space-y-2 mt-2">
            {suggestions.map((s, idx) => (
              <div key={`${s.name}-${idx}`} className="p-3 rounded-lg border border-[var(--border-subtle)]">
                <div className="text-sm font-semibold text-[var(--text-primary)]">{s.name}</div>
                {s.description && <p className="text-xs text-[var(--text-muted)] mt-1">{s.description}</p>}
                {s.companies?.length ? (
                  <ul className="text-xs text-[var(--text-secondary)] list-disc list-inside mt-1">
                    {s.companies.map((c) => (
                      <li key={c.name}>{c.name}{c.why ? ` — ${c.why}` : ""}</li>
                    ))}
                  </ul>
                ) : null}
                <button
                  onClick={() => onAdoptSuggestion(s)}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] text-xs font-semibold"
                >
                  Save as group
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] space-y-2">
        <div className="text-xs font-semibold text-[var(--text-secondary)]">Create group</div>
        <input
          className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm"
          placeholder="Group name"
          value={newGroup.name}
          onChange={(e) => setNewGroup((prev) => ({ ...prev, name: e.target.value }))}
        />
        <input
          className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm"
          placeholder="Tags (comma separated)"
          value={newGroup.tags}
          onChange={(e) => setNewGroup((prev) => ({ ...prev, tags: e.target.value }))}
        />
        <button
          onClick={handleCreate}
          disabled={creating || !newGroup.name}
          className="w-full px-3 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] text-sm font-medium disabled:opacity-50"
        >
          {creating ? "Saving..." : "Save group"}
        </button>
      </div>
    </div>
  );
}

