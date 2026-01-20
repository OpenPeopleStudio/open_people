"use client";

import { useState, useEffect } from "react";

interface QualitySlice {
  id: string;
  slice_key: {
    application_id?: string;
    model_name?: string;
    prompt_version?: number;
    topic_cluster?: string;
  };
  window_start: string;
  window_end: string;
  sample_count: number;
  low_quality_count: number;
  low_quality_rate: number;
  avg_quality_score: number | null;
  dimension_averages: Record<string, number> | null;
  cost_per_success_cents: number | null;
}

export function AutoSliceExplorer() {
  const [slices, setSlices] = useState<QualitySlice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minLowQualityRate, setMinLowQualityRate] = useState(0.1);

  useEffect(() => {
    fetchSlices();
  }, [minLowQualityRate]);

  async function fetchSlices() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/ai/quality/slices?min_low_quality_rate=${minLowQualityRate}&limit=20`
      );
      if (!res.ok) throw new Error("Failed to fetch slices");
      const data = await res.json();
      setSlices(data.slices || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function formatSliceKey(key: QualitySlice["slice_key"]): string {
    const parts: string[] = [];
    if (key.application_id) parts.push(`App: ${key.application_id}`);
    if (key.model_name) parts.push(`Model: ${key.model_name}`);
    if (key.prompt_version) parts.push(`v${key.prompt_version}`);
    if (key.topic_cluster) parts.push(`Topic: ${key.topic_cluster}`);
    return parts.length > 0 ? parts.join(" | ") : "Global";
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-[var(--text-muted)]">
        Loading quality slices...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-[var(--error)]">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter controls */}
      <div className="flex items-center gap-4 p-4 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)]">
        <label className="text-sm text-[var(--text-muted)]">
          Min low-quality rate:
        </label>
        <select
          value={minLowQualityRate}
          onChange={(e) => setMinLowQualityRate(parseFloat(e.target.value))}
          className="px-3 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)]"
        >
          <option value={0.05}>5%</option>
          <option value={0.1}>10%</option>
          <option value={0.2}>20%</option>
          <option value={0.3}>30%</option>
        </select>
        <button
          onClick={fetchSlices}
          className="ml-auto px-3 py-1.5 text-sm bg-[var(--electric-lime)] text-[var(--void)] rounded-lg hover:opacity-90 transition-opacity"
        >
          Refresh
        </button>
      </div>

      {/* Slices list */}
      {slices.length === 0 ? (
        <div className="p-8 text-center text-[var(--text-muted)] bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)]">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-[var(--success)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="font-medium text-[var(--text-primary)]">
            No low-quality clusters found
          </p>
          <p className="text-sm mt-1">
            Quality is looking good across all slices!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {slices.map((slice) => (
            <div
              key={slice.id}
              className="p-4 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border)] transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-[var(--text-primary)]">
                    {formatSliceKey(slice.slice_key)}
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {new Date(slice.window_start).toLocaleDateString()} -{" "}
                    {new Date(slice.window_end).toLocaleDateString()}
                  </p>
                </div>
                <div
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    slice.low_quality_rate > 0.3
                      ? "bg-[var(--error)]/10 text-[var(--error)]"
                      : slice.low_quality_rate > 0.2
                        ? "bg-[var(--warning)]/10 text-[var(--warning)]"
                        : "bg-yellow-500/10 text-yellow-500"
                  }`}
                >
                  {(slice.low_quality_rate * 100).toFixed(1)}% low quality
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-[var(--text-muted)]">Samples</p>
                  <p className="font-semibold text-[var(--text-primary)]">
                    {slice.sample_count}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--text-muted)]">Low Quality</p>
                  <p className="font-semibold text-[var(--error)]">
                    {slice.low_quality_count}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--text-muted)]">Avg Score</p>
                  <p className="font-semibold text-[var(--text-primary)]">
                    {slice.avg_quality_score?.toFixed(2) || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--text-muted)]">Cost/Success</p>
                  <p className="font-semibold text-[var(--text-primary)]">
                    {slice.cost_per_success_cents
                      ? `$${(slice.cost_per_success_cents / 100).toFixed(3)}`
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Dimension breakdown */}
              {slice.dimension_averages &&
                Object.keys(slice.dimension_averages).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
                    <p className="text-xs text-[var(--text-muted)] mb-2">
                      Dimension Scores
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(slice.dimension_averages).map(
                        ([dim, score]) => (
                          <span
                            key={dim}
                            className={`px-2 py-0.5 rounded text-xs ${
                              score < 0.5
                                ? "bg-[var(--error)]/10 text-[var(--error)]"
                                : score < 0.7
                                  ? "bg-[var(--warning)]/10 text-[var(--warning)]"
                                  : "bg-[var(--success)]/10 text-[var(--success)]"
                            }`}
                          >
                            {dim}: {score.toFixed(2)}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
