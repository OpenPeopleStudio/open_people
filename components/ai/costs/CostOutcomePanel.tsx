"use client";

import { useState, useEffect } from "react";

interface CostOutcomeSummary {
  total_cost_usd: string;
  total_requests: number;
  avg_cost_per_request_usd: string;
  avg_cost_per_success_usd: string;
  avg_cost_per_high_quality_usd: string;
  success_rate: string;
}

interface ChangeEvent {
  id: string;
  change_type: string;
  change_description: string;
  occurred_at: string;
  cost_impact_detected?: boolean;
}

export function CostOutcomePanel() {
  const [summary, setSummary] = useState<CostOutcomeSummary | null>(null);
  const [recentChanges, setRecentChanges] = useState<ChangeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [groupBy, setGroupBy] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [days, groupBy]);

  async function fetchData() {
    setLoading(true);
    try {
      const [outcomeRes, changesRes] = await Promise.all([
        fetch(`/api/ai/costs/outcomes?days=${days}${groupBy ? `&group_by=${groupBy}` : ""}`),
        fetch("/api/ai/costs/change-events?hours=168"), // Last 7 days
      ]);

      if (outcomeRes.ok) {
        const data = await outcomeRes.json();
        setSummary(data.summary);
      }

      if (changesRes.ok) {
        const data = await changesRes.json();
        setRecentChanges(data.events?.slice(0, 5) || []);
      }
    } catch (err) {
      console.error("Error fetching cost data:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-center text-[var(--text-muted)]">
        Loading cost analytics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)]">
        <label className="text-sm text-[var(--text-muted)]">Time range:</label>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value, 10))}
          className="px-3 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)]"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
        <label className="text-sm text-[var(--text-muted)] ml-4">Group by:</label>
        <select
          value={groupBy || ""}
          onChange={(e) => setGroupBy(e.target.value || null)}
          className="px-3 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)]"
        >
          <option value="">None</option>
          <option value="application">Application</option>
          <option value="model">Model</option>
          <option value="prompt">Prompt</option>
        </select>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard
            label="Total Cost"
            value={`$${summary.total_cost_usd}`}
            subtext="USD"
          />
          <MetricCard
            label="Total Requests"
            value={summary.total_requests.toLocaleString()}
          />
          <MetricCard
            label="Cost/Request"
            value={`$${summary.avg_cost_per_request_usd}`}
            highlight
          />
          <MetricCard
            label="Cost/Success"
            value={`$${summary.avg_cost_per_success_usd}`}
            highlight
            color="success"
          />
          <MetricCard
            label="Cost/High Quality"
            value={`$${summary.avg_cost_per_high_quality_usd}`}
            highlight
            color="info"
          />
          <MetricCard
            label="Success Rate"
            value={summary.success_rate}
            color="success"
          />
        </div>
      )}

      {/* Explanation */}
      <div className="p-4 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)]">
        <h3 className="font-semibold text-[var(--text-primary)] mb-2">
          Cost-per-Outcome Metrics
        </h3>
        <div className="space-y-2 text-sm text-[var(--text-muted)]">
          <p>
            <strong>Cost/Request</strong>: Average cost of all AI requests, regardless
            of outcome.
          </p>
          <p>
            <strong>Cost/Success</strong>: Average cost of requests that resulted in a
            successful outcome (positive feedback or met success criteria).
          </p>
          <p>
            <strong>Cost/High Quality</strong>: Average cost of requests with quality
            score &gt;= 0.8.
          </p>
        </div>
      </div>

      {/* Recent changes */}
      <div className="p-4 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[var(--text-primary)]">
            Recent Changes
          </h3>
          <span className="text-xs text-[var(--text-muted)]">
            Correlated with cost anomalies
          </span>
        </div>

        {recentChanges.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            No recent change events recorded.
          </p>
        ) : (
          <div className="space-y-2">
            {recentChanges.map((change) => (
              <div
                key={change.id}
                className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0"
              >
                <div className="flex items-center gap-3">
                  <ChangeTypeIcon type={change.change_type} />
                  <div>
                    <p className="text-sm text-[var(--text-primary)]">
                      {change.change_description}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {new Date(change.occurred_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {change.cost_impact_detected && (
                  <span className="px-2 py-0.5 rounded text-xs bg-[var(--warning)]/10 text-[var(--warning)]">
                    Cost impact
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  subtext,
  highlight,
  color,
}: {
  label: string;
  value: string;
  subtext?: string;
  highlight?: boolean;
  color?: "success" | "warning" | "error" | "info";
}) {
  const colorClasses = {
    success: "text-[var(--success)]",
    warning: "text-[var(--warning)]",
    error: "text-[var(--error)]",
    info: "text-[var(--info)]",
  };

  return (
    <div
      className={`p-4 rounded-xl ${
        highlight
          ? "bg-gradient-to-br from-[var(--surface-1)] to-[var(--surface-2)] border-2 border-[var(--border)]"
          : "bg-[var(--surface-1)] border border-[var(--border-subtle)]"
      }`}
    >
      <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
      <p
        className={`text-xl font-bold ${
          color ? colorClasses[color] : "text-[var(--text-primary)]"
        }`}
      >
        {value}
      </p>
      {subtext && <p className="text-xs text-[var(--text-muted)]">{subtext}</p>}
    </div>
  );
}

function ChangeTypeIcon({ type }: { type: string }) {
  const icons: Record<string, { icon: string; color: string }> = {
    prompt_deploy: {
      icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z",
      color: "text-blue-500",
    },
    model_change: {
      icon: "M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5",
      color: "text-purple-500",
    },
    routing_change: {
      icon: "M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5",
      color: "text-orange-500",
    },
    cache_config: {
      icon: "M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125",
      color: "text-green-500",
    },
    feature_rollout: {
      icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
      color: "text-cyan-500",
    },
  };

  const config = icons[type] || {
    icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
    color: "text-[var(--text-muted)]",
  };

  return (
    <svg
      className={`w-5 h-5 ${config.color}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
    </svg>
  );
}
