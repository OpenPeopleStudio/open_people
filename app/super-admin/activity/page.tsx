"use client";

import { useState, useEffect } from "react";
import type { ActivityEntry } from "@/types/mlf";

/* ═══════════════════════════════════════════════════════════════════════════
   Activity Ledger Page
   View all platform activities
   ═══════════════════════════════════════════════════════════════════════════ */

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    byCategory: Record<string, number>;
    byDay: { date: string; count: number }[];
    recentFailures: ActivityEntry[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  
  useEffect(() => {
    loadData();
  }, [selectedCategory]);
  
  async function loadData() {
    setLoading(true);
    try {
      // Load summary
      const summaryRes = await fetch("/api/mlf/activity?summary=true");
      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data);
      }
      
      // Load activities
      let url = "/api/mlf/activity?limit=100";
      if (selectedCategory) {
        url += `&category=${selectedCategory}`;
      }
      
      const activitiesRes = await fetch(url);
      if (activitiesRes.ok) {
        const data = await activitiesRes.json();
        setActivities(data.activities || []);
      }
    } catch (err) {
      console.error("Failed to load activity data:", err);
    } finally {
      setLoading(false);
    }
  }
  
  const categoryColors: Record<string, string> = {
    auth: "#6366f1",
    data: "var(--electric-cyan)",
    ai: "var(--electric-lime)",
    admin: "var(--warning)",
    security: "#ef4444",
  };
  
  const actionIcons: Record<string, string> = {
    "auth.login": "M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1",
    "auth.logout": "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
    "file.upload": "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12",
    "file.download": "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
    "file.delete": "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
    "chat.send": "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    "memory.create": "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    "fact.create": "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  };
  
  function getActionIcon(action: string): string {
    return actionIcons[action] || "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
  }
  
  function formatAction(action: string): string {
    return action.replace(/\./g, " → ").replace(/_/g, " ");
  }
  
  function formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  }
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Activity Ledger
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Track all actions across the platform
        </p>
      </div>
      
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
            <p className="text-2xl font-semibold text-[var(--text-primary)]">
              {summary.total}
            </p>
            <p className="text-sm text-[var(--text-muted)]">Total (7 days)</p>
          </div>
          
          {Object.entries(summary.byCategory).slice(0, 3).map(([category, count]) => (
            <div
              key={category}
              className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: categoryColors[category] || "var(--text-muted)" }}
                />
                <p className="text-2xl font-semibold text-[var(--text-primary)]">
                  {count}
                </p>
              </div>
              <p className="text-sm text-[var(--text-muted)] capitalize">
                {category}
              </p>
            </div>
          ))}
        </div>
      )}
      
      {/* Recent Failures Alert */}
      {summary && summary.recentFailures.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-[var(--error)]/10 border border-[var(--error)]/30">
          <h3 className="text-sm font-medium text-[var(--error)] mb-2">
            Recent Failures ({summary.recentFailures.length})
          </h3>
          <div className="space-y-1">
            {summary.recentFailures.slice(0, 3).map(failure => (
              <p key={failure.id} className="text-sm text-[var(--text-secondary)]">
                {formatAction(failure.action)}: {failure.error_message || "Unknown error"}
              </p>
            ))}
          </div>
        </div>
      )}
      
      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory("")}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            selectedCategory === ""
              ? "bg-[var(--electric-lime)] text-[var(--void)]"
              : "bg-[var(--surface-1)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          All
        </button>
        {["auth", "data", "ai", "admin", "security"].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1.5 ${
              selectedCategory === cat
                ? "bg-[var(--electric-lime)] text-[var(--void)]"
                : "bg-[var(--surface-1)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: categoryColors[cat] }}
            />
            {cat}
          </button>
        ))}
      </div>
      
      {/* Activity List */}
      {loading ? (
        <div className="text-center py-12 text-[var(--text-muted)]">
          Loading...
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[var(--text-muted)]">No activities found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map(activity => (
            <div
              key={activity.id}
              className={`p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] ${
                !activity.success ? "border-[var(--error)]/30" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: `${categoryColors[activity.action_category || "data"]}20`,
                  }}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke={categoryColors[activity.action_category || "data"]}
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={getActionIcon(activity.action)} />
                  </svg>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {formatAction(activity.action)}
                    </span>
                    {!activity.success && (
                      <span className="px-1.5 py-0.5 text-xs rounded bg-[var(--error)]/20 text-[var(--error)]">
                        failed
                      </span>
                    )}
                  </div>
                  
                  {activity.resource_name && (
                    <p className="text-sm text-[var(--text-secondary)] truncate">
                      {activity.resource_name}
                    </p>
                  )}
                  
                  {activity.error_message && (
                    <p className="text-sm text-[var(--error)]">
                      {activity.error_message}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-muted)]">
                    <span>{formatTime(activity.created_at)}</span>
                    {activity.actor_type && activity.actor_type !== "user" && (
                      <span className="px-1.5 py-0.5 rounded bg-[var(--surface-2)]">
                        {activity.actor_type}
                      </span>
                    )}
                    {activity.ip_address && (
                      <span>{activity.ip_address}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
