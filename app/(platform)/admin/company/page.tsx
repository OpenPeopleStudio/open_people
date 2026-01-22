"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type VibeEvent = {
  id: string;
  created_at: string;
  note: string | null;
  source: string;
  value: number;
};

type VibeSummary = {
  counts: { last7Days: number; last30Days: number };
  lastVibeAt: string | null;
  recent: VibeEvent[];
  balance?: number;
  tokenStats?: {
    today: { in: number; out: number };
    last7Days: { in: number; out: number };
    last14Days: { in: number; out: number };
    last30Days: { in: number; out: number };
  };
};

function formatTimestamp(value: string | null) {
  if (!value) return "No vibes yet";
  const date = new Date(value);
  return date.toLocaleString();
}

export default function CompanyDashboard() {
  const [summary, setSummary] = useState<VibeSummary | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = async () => {
    const res = await fetch("/api/company/vibes");
    if (!res.ok) {
      setError("Failed to load vibe summary");
      return;
    }
    const data = await res.json();
    setSummary(data);
  };

  useEffect(() => {
    loadSummary().catch(() => setError("Failed to load vibe summary"));
  }, []);

  const submitVibe = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/company/vibes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      if (!res.ok) {
        setError("Failed to create vibe");
        return;
      }
      setNote("");
      await loadSummary();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--electric-cyan)] to-[var(--electric-lime)] flex items-center justify-center">
            <svg
              className="w-5 h-5 text-[var(--void)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18.75a6.75 6.75 0 006.364-4.5H5.636A6.75 6.75 0 0012 18.75zm6-7.5A6 6 0 006 11.25v.75h12v-.75z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Company</h1>
            <p className="text-sm text-[var(--text-muted)]">
              Shareholder vibes and language signals
            </p>
          </div>
        </div>
        <Link
          href="/admin/company/language"
          className="text-sm text-[var(--electric-lime)] hover:underline"
        >
          Manage language
        </Link>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-400">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <p className="text-xs uppercase text-[var(--text-muted)]">Vibes (7d)</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
            {summary?.counts.last7Days ?? "—"}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <p className="text-xs uppercase text-[var(--text-muted)]">Vibes (30d)</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
            {summary?.counts.last30Days ?? "—"}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <p className="text-xs uppercase text-[var(--text-muted)]">Last Vibe</p>
          <p className="mt-2 text-sm text-[var(--text-primary)]">
            {formatTimestamp(summary?.lastVibeAt ?? null)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <p className="text-xs uppercase text-[var(--text-muted)]">Vibe Balance</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
            {summary?.balance ?? "—"}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] space-y-2">
          <p className="text-xs uppercase text-[var(--text-muted)]">Tokens</p>
          <p className="text-sm text-[var(--text-primary)]">
            Today: In {summary?.tokenStats?.today.in ?? "—"} · Out{" "}
            {summary?.tokenStats?.today.out ?? "—"}
          </p>
          <p className="text-sm text-[var(--text-primary)]">
            7d: In {summary?.tokenStats?.last7Days.in ?? "—"} · Out{" "}
            {summary?.tokenStats?.last7Days.out ?? "—"}
          </p>
          <p className="text-sm text-[var(--text-primary)]">
            14d: In {summary?.tokenStats?.last14Days.in ?? "—"} · Out{" "}
            {summary?.tokenStats?.last14Days.out ?? "—"}
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] mb-6">
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="text-xs uppercase text-[var(--text-muted)]">Org Market Update</p>
          <a
            href="/docs/company/market.md"
            className="text-xs text-[var(--electric-lime)] hover:underline"
          >
            View docs
          </a>
        </div>
        <p className="text-sm text-[var(--text-primary)]">
          Market is steady. Vibe balance is stable, with early token flow pending.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Give a vibe</h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Vibes are positive feedback signals. Keep it short and honest.
          </p>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="What feels good right now?"
            rows={4}
            className="w-full rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] p-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
          />
          <button
            type="button"
            onClick={submitVibe}
            disabled={submitting}
            className="mt-3 px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] text-sm font-medium disabled:opacity-60"
          >
            {submitting ? "Sending..." : "Send vibe"}
          </button>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Recent vibes</h2>
          {summary?.recent?.length ? (
            <div className="space-y-3">
              {summary.recent.map((vibe) => (
                <div
                  key={vibe.id}
                  className="p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)]"
                >
                  <p className="text-xs text-[var(--text-muted)] mb-1">
                    {new Date(vibe.created_at).toLocaleString()} · {vibe.source}
                  </p>
                  <p className="text-sm text-[var(--text-primary)]">
                    {vibe.note || "Vibe received"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">No vibes yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
