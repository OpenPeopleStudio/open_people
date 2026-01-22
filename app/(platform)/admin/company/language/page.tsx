"use client";

import { useEffect, useState } from "react";

type LexiconEntry = {
  id: string;
  pattern: string;
  match_kind: string;
  meaning: string | null;
  trigger_payload: { value?: number } | null;
  is_active: boolean;
  is_case_sensitive: boolean;
  priority: number;
  created_at: string;
};

type TestResult = {
  matches: { id: string; pattern: string; match_kind: string; meaning: string | null }[];
  created: number;
};

const MATCH_KINDS = ["exact", "contains", "prefix", "suffix", "like"];

const emptyForm = {
  pattern: "",
  match_kind: "contains",
  meaning: "",
  priority: 0,
  is_active: true,
  is_case_sensitive: false,
  trigger_value: 1,
};

export default function LanguageDashboard() {
  const [entries, setEntries] = useState<LexiconEntry[]>([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testText, setTestText] = useState("");
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const loadEntries = async () => {
    const res = await fetch("/api/company/lexicon");
    if (!res.ok) {
      setError("Failed to load lexicon");
      return;
    }
    const data = await res.json();
    setEntries(data.entries || []);
  };

  useEffect(() => {
    loadEntries().catch(() => setError("Failed to load lexicon"));
  }, []);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
  };

  const submitEntry = async () => {
    setLoading(true);
    setError(null);
    const payload = {
      pattern: form.pattern,
      match_kind: form.match_kind,
      meaning: form.meaning,
      priority: Number(form.priority) || 0,
      is_active: form.is_active,
      is_case_sensitive: form.is_case_sensitive,
      trigger_type: "vibe",
      trigger_payload: { value: Number(form.trigger_value) || 1 },
    };

    const res = await fetch(
      editingId ? `/api/company/lexicon/${editingId}` : "/api/company/lexicon",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      setError("Failed to save entry");
      setLoading(false);
      return;
    }

    resetForm();
    await loadEntries();
    setLoading(false);
  };

  const editEntry = (entry: LexiconEntry) => {
    setEditingId(entry.id);
    setForm({
      pattern: entry.pattern,
      match_kind: entry.match_kind,
      meaning: entry.meaning || "",
      priority: entry.priority || 0,
      is_active: entry.is_active,
      is_case_sensitive: entry.is_case_sensitive,
      trigger_value: entry.trigger_payload?.value ?? 1,
    });
  };

  const deleteEntry = async (entryId: string) => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/company/lexicon/${entryId}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Failed to delete entry");
      setLoading(false);
      return;
    }
    await loadEntries();
    setLoading(false);
  };

  const runTest = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/company/lexicon/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: testText, source: "manual-test" }),
    });

    if (!res.ok) {
      setError("Failed to evaluate text");
      setLoading(false);
      return;
    }

    const data = await res.json();
    setTestResult(data);
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Company Language</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Define meaning-bearing phrases that trigger vibes.
        </p>
      </div>

      {error && <div className="mb-4 text-sm text-red-400">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            {editingId ? "Edit entry" : "Add entry"}
          </h2>
          <div className="space-y-3">
            <input
              value={form.pattern}
              onChange={(event) => setForm({ ...form, pattern: event.target.value })}
              placeholder="Pattern"
              className="w-full rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] p-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
            />
            <select
              value={form.match_kind}
              onChange={(event) => setForm({ ...form, match_kind: event.target.value })}
              className="w-full rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] p-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
            >
              {MATCH_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {kind}
                </option>
              ))}
            </select>
            <input
              value={form.meaning}
              onChange={(event) => setForm({ ...form, meaning: event.target.value })}
              placeholder="Meaning"
              className="w-full rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] p-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={form.priority}
                onChange={(event) => setForm({ ...form, priority: Number(event.target.value) })}
                placeholder="Priority"
                className="w-full rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] p-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
              />
              <input
                type="number"
                value={form.trigger_value}
                onChange={(event) => setForm({ ...form, trigger_value: Number(event.target.value) })}
                placeholder="Vibe value"
                className="w-full rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] p-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
              />
            </div>
            <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
                />
                Active
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_case_sensitive}
                  onChange={(event) =>
                    setForm({ ...form, is_case_sensitive: event.target.checked })
                  }
                />
                Case sensitive
              </label>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={submitEntry}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] text-sm font-medium disabled:opacity-60"
            >
              {editingId ? "Update entry" : "Create entry"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Test language</h2>
          <textarea
            value={testText}
            onChange={(event) => setTestText(event.target.value)}
            placeholder="Paste text to evaluate"
            rows={6}
            className="w-full rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] p-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
          />
          <button
            type="button"
            onClick={runTest}
            disabled={loading}
            className="mt-3 px-4 py-2 rounded-lg bg-[var(--surface-2)] text-sm text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--border)] disabled:opacity-60"
          >
            Evaluate text
          </button>
          {testResult && (
            <div className="mt-4 text-sm text-[var(--text-primary)]">
              <p className="text-xs uppercase text-[var(--text-muted)] mb-2">
                Matches ({testResult.matches.length}) · Vibes created ({testResult.created})
              </p>
              <div className="space-y-2">
                {testResult.matches.map((match) => (
                  <div
                    key={match.id}
                    className="p-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]"
                  >
                    <p className="font-medium">{match.pattern}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {match.match_kind} · {match.meaning || "No meaning set"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 p-5 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Entries</h2>
        {entries.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No entries yet.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {entry.pattern}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {entry.match_kind} · priority {entry.priority} ·{" "}
                    {entry.is_active ? "active" : "inactive"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => editEntry(entry)}
                    className="px-3 py-1.5 rounded-lg text-xs text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--border)]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteEntry(entry.id)}
                    className="px-3 py-1.5 rounded-lg text-xs text-red-300 border border-red-500/40 hover:border-red-500/70"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
