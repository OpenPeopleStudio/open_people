"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTenant } from "@/context/TenantContext";

/* ═══════════════════════════════════════════════════════════════════════════
   Tenant Admin Dashboard
   Overview of workspace status and quick actions
   ═══════════════════════════════════════════════════════════════════════════ */

type DashboardStats = {
  storage: { totalBytes: number; totalFiles: number } | null;
  notifications: { unread: number } | null;
  email: { unread: number; total: number } | null;
  notes: { total: number } | null;
  conversations: { total: number } | null;
  tasks: { active: number; overdue: number } | null;
  vault: { files: number; size: number } | null;
  apiKeys: { total: number } | null;
};

function isDemoEnabled(tenantSlug: string): boolean {
  if (tenantSlug === "demo") return true;
  if (typeof window === "undefined") return false;
  const demo = new URLSearchParams(window.location.search).get("demo");
  return demo === "1" || demo === "true";
}

export default function AdminDashboard() {
  const tenant = useTenant();
  const [stats, setStats] = useState<DashboardStats>({
    storage: null,
    notifications: null,
    email: null,
    notes: null,
    conversations: null,
    tasks: null,
    vault: null,
    apiKeys: null,
  });
  const [loading, setLoading] = useState(true);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ ok: boolean; message: string } | null>(null);

  const brandName = tenant.settings.theme?.brand_name || tenant.name || "Workspace";
  const features = tenant.settings.features || {};
  const demoMode = isDemoEnabled(tenant.slug);
  const showSeedButton = process.env.NODE_ENV === "development" && demoMode;

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      
      // Load stats in parallel
      const promises: Promise<void>[] = [];
      const updates: Partial<DashboardStats> = {};
  
      // Notifications
      promises.push(
        fetch("/api/notifications/inbox?limit=3")
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data) {
              updates.notifications = { unread: data.unread || 0 };
            }
          })
          .catch(() => {})
      );

      // Email inbox stats
      if (features.email !== false) {
        promises.push(
          fetch("/api/email/inbox/stats")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              const s = data?.stats;
              if (s) {
                updates.email = {
                  unread: s.unread_messages || 0,
                  total: s.total_messages || 0,
                };
              }
            })
            .catch(() => {})
        );
      }

      // Storage (buckets aggregate)
      if (features.storage !== false) {
        promises.push(
          fetch("/api/storage/buckets")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              const buckets = (data?.buckets || []) as { file_count?: number; total_size?: number }[];
              if (Array.isArray(buckets)) {
                const totalFiles = buckets.reduce((sum, b) => sum + (b.file_count || 0), 0);
                const totalBytes = buckets.reduce((sum, b) => sum + (b.total_size || 0), 0);
                updates.storage = { totalBytes, totalFiles };
              }
            })
            .catch(() => {})
        );
      }
  
      // Notes
      if (features.notes !== false) {
        promises.push(
          fetch("/api/notes?limit=1")
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data) {
                updates.notes = { total: data.total || 0 };
              }
            })
            .catch(() => {})
        );
      }
  
      // AI Conversations
      if (features.ai_chat !== false) {
        promises.push(
          fetch("/api/chat/conversations?limit=1")
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data) {
                updates.conversations = { total: data.conversations?.length || 0 };
              }
            })
            .catch(() => {})
        );
      }
  
      // Tasks
      if (features.workflows !== false) {
        promises.push(
          fetch("/api/workflows/tasks?status=active&limit=100")
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data) {
                const tasks = data.tasks || [];
                const overdue = tasks.filter((t: { due_date: string }) => 
                  t.due_date && new Date(t.due_date) < new Date()
                ).length;
                updates.tasks = { active: tasks.length, overdue };
              }
            })
            .catch(() => {})
        );
      }
  
      // API keys
      if (features.api_keys !== false) {
        promises.push(
          fetch("/api/keys")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (data) {
                updates.apiKeys = { total: data.total || 0 };
              }
            })
            .catch(() => {})
        );
      }

      // Vault status
      if (features.vault !== false) {
        promises.push(
          fetch("/api/vault/status")
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data?.vault) {
                updates.vault = {
                  files: data.vault.total_files || 0,
                  size: data.vault.total_size_bytes || 0,
                };
              }
            })
            .catch(() => {})
        );
      }
  
      await Promise.all(promises);

      // Apply updates (and demo fallbacks if enabled)
      setStats((prev) => {
        const merged: DashboardStats = { ...prev, ...updates };
        if (!demoMode) return merged;
        return {
          storage: merged.storage ?? { totalBytes: 1_420_000_000, totalFiles: 128 },
          notifications: merged.notifications ?? { unread: 3 },
          email: merged.email ?? { unread: 5, total: 24 },
          notes: merged.notes ?? { total: 12 },
          conversations: merged.conversations ?? { total: 7 },
          tasks: merged.tasks ?? { active: 9, overdue: 1 },
          vault: merged.vault ?? { files: 18, size: 84_000_000 },
          apiKeys: merged.apiKeys ?? { total: 4 },
        };
      });

      setLoading(false);
    }

    loadStats();
  }, [
    tenant.slug,
    refreshNonce,
    demoMode,
    features.storage,
    features.notifications,
    features.email,
    features.notes,
    features.ai_chat,
    features.workflows,
    features.vault,
    features.api_keys,
  ]);

  async function seedDemoData() {
    if (seeding) return;
    setSeeding(true);
    setSeedResult(null);

    try {
      // Get current user id (needed for in-app notifications)
      const profileRes = await fetch("/api/profile");
      const profileJson = profileRes.ok ? await profileRes.json() : null;
      const userId: string | undefined = profileJson?.profile?.user_id;
      if (!userId) {
        throw new Error("Could not resolve current user id (profile not available).");
      }

      const now = new Date();
      const stamp = now.toISOString().slice(0, 16).replace("T", " ");
      const dueSoon = new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString();
      const dueLater = new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString();

      const noteBodies = [
        {
          title: `Demo: Weekly plan (${stamp})`,
          content: [
            "## Outcomes",
            "- Ship onboarding polish",
            "- Add demo data seeding",
            "",
            "## Top priorities",
            "- Make the dashboard feel real",
            "- Validate email + notifications flows",
            "",
            "## Notes",
            "- This is seeded demo content.",
          ].join("\n"),
          status: "published",
          tags: ["demo", "planning"],
        },
        {
          title: `Demo: Customer meeting notes (${stamp})`,
          content: [
            "## Attendees",
            "- Customer: Acme Capital",
            "- OpenPeople: You",
            "",
            "## Key takeaways",
            "- They want faster onboarding and better inbox triage",
            "- Security + audit trails are a priority",
            "",
            "## Follow-ups",
            "- Send recap email",
            "- Create a pilot plan",
          ].join("\n"),
          status: "draft",
          tags: ["demo", "meeting"],
        },
      ] as const;

      const taskBodies = [
        {
          title: "Demo: Send recap email to Acme Capital",
          priority: "high",
          due_date: dueSoon,
          tags: ["demo", "email"],
        },
        {
          title: "Demo: Create pilot onboarding checklist",
          priority: "normal",
          due_date: dueLater,
          tags: ["demo", "ops"],
          checklist: [{ title: "Confirm domain setup" }, { title: "Invite 2 teammates" }, { title: "Run first workflow" }],
        },
      ] as const;

      // Create notes + tasks
      const creates = [
        ...noteBodies.map((body) =>
          fetch("/api/notes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }).then(async (res) => {
            if (!res.ok) {
              const j = await res.json().catch(() => ({}));
              throw new Error(j.error || "Failed to create note");
            }
          })
        ),
        ...taskBodies.map((body) =>
          fetch("/api/workflows/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }).then(async (res) => {
            if (!res.ok) {
              const j = await res.json().catch(() => ({}));
              throw new Error(j.error || "Failed to create task");
            }
          })
        ),
      ];

      await Promise.all(creates);

      // Send an in-app notification to the current user
      const notifyRes = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "in_app",
          recipient: userId,
          recipientUserId: userId,
          subject: "Demo data seeded",
          body: "Created demo notes + tasks so your workspace looks real.",
          metadata: { action_url: "/admin" },
        }),
      });
      if (!notifyRes.ok) {
        const j = await notifyRes.json().catch(() => ({}));
        throw new Error(j.error || "Failed to send in-app notification");
      }

      setSeedResult({ ok: true, message: "Seeded demo notes, tasks, and a notification." });
      setRefreshNonce((n) => n + 1);
    } catch (err) {
      setSeedResult({
        ok: false,
        message: err instanceof Error ? err.message : "Failed to seed demo data.",
      });
    } finally {
      setSeeding(false);
    }
  }

  const goToLinks = [
    { label: "Open inbox", href: "/admin/email/inbox", feature: "email" },
    { label: "Notifications", href: "/admin/notifications", feature: "notifications" },
    { label: "Tasks", href: "/admin/workflows", feature: "workflows" },
  ].filter((link) => features[link.feature as keyof typeof features] !== false);

  const signalCards = [
    {
      label: "Unread email",
      value: stats.email?.unread ?? 0,
      href: "/admin/email/inbox",
      tone: "lime",
      feature: "email",
      helper: "Stay on top of inbound",
    },
    {
      label: "Notifications",
      value: stats.notifications?.unread ?? 0,
      href: "/admin/notifications",
      tone: "cyan",
      feature: "notifications",
      helper: "New updates waiting",
    },
    {
      label: "Overdue tasks",
      value: stats.tasks?.overdue ?? 0,
      href: "/admin/workflows",
      tone: "amber",
      feature: "workflows",
      helper: "Close the loop",
    },
  ].filter(card => features[card.feature as keyof typeof features] !== false);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]">
              Welcome to {brandName}
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Your workspace dashboard
            </p>
          </div>

          {showSeedButton && (
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <button
                onClick={seedDemoData}
                disabled={seeding}
                className="btn-secondary text-sm disabled:opacity-50"
                title="Dev-only: seed demo notes/tasks/notifications"
              >
                {seeding ? "Seeding…" : "Seed demo data"}
              </button>
              {seedResult && (
                <p
                  className={`text-xs ${
                    seedResult.ok ? "text-[var(--success)]" : "text-[var(--error)]"
                  }`}
                >
                  {seedResult.message}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Signals */}
      {signalCards.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-[var(--text-secondary)]">
              Signals
            </h2>
            <span className="text-xs text-[var(--text-muted)]">
              Quick pulse on today
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {signalCards.map((signal) => (
              <Link
                key={signal.label}
                href={signal.href}
                className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] hover:border-[var(--border)] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[var(--text-secondary)]">{signal.label}</p>
                  <span
                    className={`text-[10px] px-2 py-1 rounded-full border ${
                      signal.tone === "amber"
                        ? "border-[var(--warning)]/40 text-[var(--warning)]"
                        : signal.tone === "cyan"
                          ? "border-[var(--electric-cyan)]/40 text-[var(--electric-cyan)]"
                          : "border-[var(--electric-lime)]/40 text-[var(--electric-lime)]"
                    }`}
                  >
                    Live
                  </span>
                </div>
                <div className="mt-3 text-2xl font-semibold text-[var(--text-primary)]">
                  {loading ? (
                    <span className="inline-block w-10 h-6 bg-[var(--surface-2)] rounded animate-pulse" />
                  ) : (
                    signal.value
                  )}
                </div>
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  {signal.helper}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {goToLinks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {goToLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 rounded-full border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border)] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
