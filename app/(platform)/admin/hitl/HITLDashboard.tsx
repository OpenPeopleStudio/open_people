"use client";

import { useState } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   HITL Dashboard Client Component
   Queue overview and item list
   ═══════════════════════════════════════════════════════════════════════════ */

type Queue = {
  id: string;
  name: string;
  description: string | null;
  pending: number;
  in_progress: number;
  sla_minutes: number | null;
};

type HITLItem = {
  id: string;
  source_type: string;
  trigger_type: string;
  priority: string;
  status: string;
  review_content: {
    input: string;
    output: string;
    risk_score?: number;
    risk_level?: string;
  };
  created_at: string;
  due_at: string | null;
  queue: { id: string; name: string };
};

type Decision = {
  id: string;
  decision: string;
  decision_reason: string | null;
  review_duration_seconds: number | null;
  created_at: string;
  item: {
    id: string;
    source_type: string;
    review_content: { input: string; output: string };
  };
};

type Props = {
  queues: Queue[];
  myItems: HITLItem[];
  recentDecisions: Decision[];
  userId: string;
  isAdmin: boolean;
};

export function HITLDashboard({
  queues,
  myItems: initialMyItems,
  recentDecisions,
  userId,
  isAdmin,
}: Props) {
  const [myItems, setMyItems] = useState(initialMyItems);
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
  const [queueItems, setQueueItems] = useState<HITLItem[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [activeTab, setActiveTab] = useState<"my_items" | "queues" | "history">(
    myItems.length > 0 ? "my_items" : "queues"
  );

  const loadQueueItems = async (queueId: string) => {
    setLoadingQueue(true);
    setSelectedQueue(queueId);
    try {
      const res = await fetch(`/api/hitl/items?queue_id=${queueId}&status=pending`);
      const data = await res.json();
      if (res.ok) {
        setQueueItems(data.items || []);
      }
    } catch (error) {
      console.error("Load queue error:", error);
    } finally {
      setLoadingQueue(false);
    }
  };

  const claimItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/hitl/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim" }),
      });

      if (res.ok) {
        // Move item from queue to my items
        const claimed = queueItems.find((i) => i.id === itemId);
        if (claimed) {
          setQueueItems((prev) => prev.filter((i) => i.id !== itemId));
          setMyItems((prev) => [{ ...claimed, status: "assigned" }, ...prev]);
        }
      }
    } catch (error) {
      console.error("Claim error:", error);
    }
  };

  const releaseItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/hitl/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "release" }),
      });

      if (res.ok) {
        setMyItems((prev) => prev.filter((i) => i.id !== itemId));
      }
    } catch (error) {
      console.error("Release error:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--surface-1)] w-fit">
        {[
          { id: "my_items" as const, label: `My Items (${myItems.length})` },
          { id: "queues" as const, label: "Queues" },
          { id: "history" as const, label: "History" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-[var(--electric-lime)] text-[var(--void)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* My Items Tab */}
      {activeTab === "my_items" && (
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          {myItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--text-muted)]">No items assigned to you</p>
              <button
                onClick={() => setActiveTab("queues")}
                className="mt-4 text-sm text-[var(--electric-lime)] hover:underline"
              >
                Browse queues to claim items
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {myItems.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  showQueue
                  onRelease={() => releaseItem(item.id)}
                  onReview
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Queues Tab */}
      {activeTab === "queues" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Queue List */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
              Review Queues
            </h3>
            {queues.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No queues configured</p>
            ) : (
              queues.map((queue) => (
                <button
                  key={queue.id}
                  onClick={() => loadQueueItems(queue.id)}
                  className={`w-full p-4 rounded-lg text-left transition-colors ${
                    selectedQueue === queue.id
                      ? "bg-[var(--electric-lime)]/10 border border-[var(--electric-lime)]"
                      : "bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-[var(--text-muted)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {queue.name}
                    </p>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        queue.pending > 10
                          ? "bg-[var(--error)]/20 text-[var(--error)]"
                          : queue.pending > 0
                          ? "bg-[var(--warning)]/20 text-[var(--warning)]"
                          : "bg-[var(--success)]/20 text-[var(--success)]"
                      }`}
                    >
                      {queue.pending} pending
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {queue.in_progress} in progress
                    {queue.sla_minutes && ` · ${queue.sla_minutes}min SLA`}
                  </p>
                </button>
              ))
            )}
          </div>

          {/* Queue Items */}
          <div className="lg:col-span-2">
            {selectedQueue ? (
              <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
                <div className="p-4 border-b border-[var(--border-subtle)]">
                  <h3 className="text-sm font-medium text-[var(--text-primary)]">
                    Pending Items
                  </h3>
                </div>
                {loadingQueue ? (
                  <div className="p-8 text-center text-[var(--text-muted)]">
                    Loading...
                  </div>
                ) : queueItems.length === 0 ? (
                  <div className="p-8 text-center text-[var(--text-muted)]">
                    No pending items in this queue
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border-subtle)]">
                    {queueItems.map((item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        onClaim={() => claimItem(item.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-12 text-center">
                <p className="text-[var(--text-muted)]">
                  Select a queue to view pending items
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <div className="p-4 border-b border-[var(--border-subtle)]">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">
              Recent Decisions
            </h3>
          </div>
          {recentDecisions.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)]">
              No decisions yet
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {recentDecisions.map((decision) => (
                <div key={decision.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        decision.decision === "approve"
                          ? "bg-[var(--success)]/20 text-[var(--success)]"
                          : decision.decision === "reject"
                          ? "bg-[var(--error)]/20 text-[var(--error)]"
                          : "bg-[var(--warning)]/20 text-[var(--warning)]"
                      }`}
                    >
                      {decision.decision}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {new Date(decision.created_at).toLocaleString()}
                      {decision.review_duration_seconds &&
                        ` · ${decision.review_duration_seconds}s`}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-primary)] line-clamp-2">
                    {decision.item?.review_content?.input?.slice(0, 150)}...
                  </p>
                  {decision.decision_reason && (
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Reason: {decision.decision_reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Item Row Component
// ─────────────────────────────────────────────────────────────────────────────

function ItemRow({
  item,
  showQueue,
  onClaim,
  onRelease,
  onReview,
}: {
  item: HITLItem;
  showQueue?: boolean;
  onClaim?: () => void;
  onRelease?: () => void;
  onReview?: boolean;
}) {
  const isOverdue = item.due_at && new Date(item.due_at) < new Date();

  return (
    <div className="p-4 hover:bg-[var(--surface-2)]/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                item.priority === "urgent"
                  ? "bg-[var(--error)]/20 text-[var(--error)]"
                  : item.priority === "high"
                  ? "bg-[var(--warning)]/20 text-[var(--warning)]"
                  : "bg-[var(--surface-2)] text-[var(--text-muted)]"
              }`}
            >
              {item.priority}
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              {item.source_type} · {item.trigger_type}
            </span>
            {showQueue && (
              <span className="text-xs text-[var(--text-muted)]">
                · {item.queue.name}
              </span>
            )}
            {item.review_content.risk_level && (
              <span
                className={`px-1.5 py-0.5 rounded text-xs ${
                  item.review_content.risk_level === "critical"
                    ? "bg-[var(--error)]/20 text-[var(--error)]"
                    : item.review_content.risk_level === "high"
                    ? "bg-[var(--warning)]/20 text-[var(--warning)]"
                    : "bg-[var(--surface-2)] text-[var(--text-muted)]"
                }`}
              >
                Risk: {item.review_content.risk_level}
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--text-primary)] line-clamp-2">
            <span className="font-medium">Input:</span>{" "}
            {item.review_content.input.slice(0, 150)}...
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-1">
            <span className="font-medium">Output:</span>{" "}
            {item.review_content.output.slice(0, 100)}...
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
            <span>{new Date(item.created_at).toLocaleString()}</span>
            {isOverdue && (
              <span className="text-[var(--error)]">SLA breached</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          {onClaim && (
            <button
              onClick={onClaim}
              className="px-3 py-1.5 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Claim
            </button>
          )}
          {onRelease && (
            <button
              onClick={onRelease}
              className="px-3 py-1.5 rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)] text-xs hover:text-[var(--text-primary)] transition-colors"
            >
              Release
            </button>
          )}
          {onReview && (
            <a
              href={`/admin/hitl/items/${item.id}`}
              className="px-3 py-1.5 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Review
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
