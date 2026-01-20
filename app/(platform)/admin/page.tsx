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

type InboxNotification = {
  id: string;
  title?: string | null;
  body?: string | null;
  created_at: string;
  is_read?: boolean | null;
  action_url?: string | null;
  priority?: string | null;
};

function isDemoEnabled(tenantSlug: string): boolean {
  if (tenantSlug === "demo") return true;
  if (typeof window === "undefined") return false;
  const demo = new URLSearchParams(window.location.search).get("demo");
  return demo === "1" || demo === "true";
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
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
  const [recentNotifications, setRecentNotifications] = useState<InboxNotification[]>([]);
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
      let recentFromApi: InboxNotification[] = [];
  
      // Notifications
      promises.push(
        fetch("/api/notifications/inbox?limit=3")
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data) {
              updates.notifications = { unread: data.unread || 0 };
              recentFromApi = (data.notifications || []) as InboxNotification[];
              setRecentNotifications(recentFromApi);
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

      if (demoMode && recentFromApi.length === 0) {
        setRecentNotifications([
          {
            id: "demo-1",
            title: "Onboarding complete",
            body: "Your workspace is ready. Add your first domain and invite your team.",
            created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
            is_read: false,
            action_url: "/admin/onboarding",
            priority: "medium",
          },
          {
            id: "demo-2",
            title: "Storage at 80%",
            body: "You’re approaching your storage limit. Review large files and archives.",
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
            is_read: false,
            action_url: "/admin/storage",
            priority: "high",
          },
          {
            id: "demo-3",
            title: "Email domain verified",
            body: "You can now send from your custom domain.",
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
            is_read: true,
            action_url: "/admin/email/domains",
            priority: "low",
          },
        ]);
      }

      setLoading(false);
    }

    loadStats();
  }, [tenant.slug, refreshNonce, features.storage, features.notifications, features.email, features.notes, features.ai_chat, features.workflows, features.vault, features.api_keys]);

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

  const quickActions = [
    {
      label: "New Note",
      href: "/admin/notes",
      icon: "M12 4v16m8-8H4",
      color: "from-blue-500 to-blue-600",
      feature: "notes",
    },
    {
      label: "Send Email",
      href: "/admin/email",
      icon: "M21.75 6.75v10.5A2.25 2.25 0 0119.5 19.5h-15A2.25 2.25 0 012.25 17.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.909A2.25 2.25 0 012.25 6.993V6.75",
      color: "from-cyan-500 to-cyan-600",
      feature: "email",
    },
    {
      label: "Notify",
      href: "/admin/notifications",
      icon: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0",
      color: "from-pink-500 to-pink-600",
      feature: "notifications",
    },
    {
      label: "Start Chat",
      href: "/admin/chat",
      icon: "M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z",
      color: "from-purple-500 to-purple-600",
      feature: "ai_chat",
    },
    {
      label: "Add Task",
      href: "/admin/workflows",
      icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      color: "from-green-500 to-green-600",
      feature: "workflows",
    },
    {
      label: "Upload File",
      href: "/admin/storage",
      icon: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5",
      color: "from-slate-500 to-slate-600",
      feature: "storage",
    },
    {
      label: "Vault Upload",
      href: "/admin/vault",
      icon: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5",
      color: "from-amber-500 to-amber-600",
      feature: "vault",
    },
  ].filter(action => features[action.feature as keyof typeof features] !== false);

  const statCards = [
    {
      label: "Unread Notifications",
      value: stats.notifications?.unread ?? "–",
      icon: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0",
      href: "/admin/notifications",
      feature: "notifications",
    },
    {
      label: "Unread Email",
      value: stats.email?.unread ?? "–",
      icon: "M21.75 6.75v10.5A2.25 2.25 0 0119.5 19.5h-15A2.25 2.25 0 012.25 17.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.909A2.25 2.25 0 012.25 6.993V6.75",
      href: "/admin/email/inbox",
      feature: "email",
    },
    {
      label: "Storage Used",
      value: stats.storage ? formatBytes(stats.storage.totalBytes) : "–",
      icon: "M2.25 12.75c0 1.8 1.2 3.375 3 3.375h13.5c1.8 0 3-1.575 3-3.375 0-1.8-1.2-3.375-3-3.375h-.75A3.375 3.375 0 0015.75 6H8.25a3.375 3.375 0 00-3.375 3.375H5.25c-1.8 0-3 1.575-3 3.375z",
      href: "/admin/storage",
      feature: "storage",
    },
    {
      label: "Notes",
      value: stats.notes?.total ?? "–",
      icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
      href: "/admin/notes",
      feature: "notes",
    },
    {
      label: "AI Conversations",
      value: stats.conversations?.total ?? "–",
      icon: "M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z",
      href: "/admin/chat",
      feature: "ai_chat",
    },
    {
      label: "Active Tasks",
      value: stats.tasks ? `${stats.tasks.active}${stats.tasks.overdue > 0 ? ` (${stats.tasks.overdue} overdue)` : ""}` : "–",
      icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      href: "/admin/workflows",
      feature: "workflows",
    },
    {
      label: "Vault Files",
      value: stats.vault?.files ?? "–",
      icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
      href: "/admin/vault",
      feature: "vault",
    },
    {
      label: "API Keys",
      value: stats.apiKeys?.total ?? "–",
      icon: "M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z",
      href: "/admin/keys",
      feature: "api_keys",
    },
  ].filter(card => features[card.feature as keyof typeof features] !== false);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Welcome to {brandName}
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Your workspace dashboard
            </p>
          </div>

          {showSeedButton && (
            <div className="flex flex-col items-end gap-2">
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

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-[var(--electric-lime)]/50 transition-all group"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={action.icon} />
                  </svg>
                </div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {action.label}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {statCards.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
            Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {statCards.map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className="p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-[var(--border)] transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--electric-lime)]/10 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-[var(--electric-lime)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-semibold text-[var(--text-primary)]">
                  {loading ? (
                    <span className="inline-block w-8 h-6 bg-[var(--surface-2)] rounded animate-pulse" />
                  ) : (
                    card.value
                  )}
                </p>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  {card.label}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Notifications */}
      {features.notifications !== false && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-[var(--text-secondary)]">
              Recent
            </h2>
            <Link
              href="/admin/notifications"
              className="text-xs text-[var(--electric-lime)] hover:underline"
            >
              View notifications →
            </Link>
          </div>
          <div className="rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] overflow-hidden">
            {loading ? (
              <div className="p-5">
                <div className="h-4 w-40 bg-[var(--surface-2)] rounded animate-pulse mb-2" />
                <div className="h-4 w-64 bg-[var(--surface-2)] rounded animate-pulse" />
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="p-5 text-sm text-[var(--text-muted)]">
                No notifications yet.
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {recentNotifications.slice(0, 3).map((n) => (
                  <Link
                    key={n.id}
                    href={n.action_url || "/admin/notifications"}
                    className="block p-4 hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {n.title || "Notification"}
                        </p>
                        {n.body && (
                          <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
                            {n.body}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-muted)] shrink-0">
                        {new Date(n.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Module Links */}
      <div>
        <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
          Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.email !== false && (
            <ModuleCard
              title="Email"
              description="Templates, sending, domains, and inbox"
              href="/admin/email"
              icon="M21.75 6.75v10.5A2.25 2.25 0 0119.5 19.5h-15A2.25 2.25 0 012.25 17.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.909A2.25 2.25 0 012.25 6.993V6.75"
            />
          )}
          {features.notifications !== false && (
            <ModuleCard
              title="Notifications"
              description="In-app, SMS, and delivery logs"
              href="/admin/notifications"
              icon="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
            />
          )}
          {features.storage !== false && (
            <ModuleCard
              title="Storage"
              description="Buckets, files, and presigned upload/download"
              href="/admin/storage"
              icon="M2.25 12.75c0 1.8 1.2 3.375 3 3.375h13.5c1.8 0 3-1.575 3-3.375 0-1.8-1.2-3.375-3-3.375h-.75A3.375 3.375 0 0015.75 6H8.25a3.375 3.375 0 00-3.375 3.375H5.25c-1.8 0-3 1.575-3 3.375z"
            />
          )}
          {features.vault !== false && (
            <ModuleCard
              title="Encrypted Vault"
              description="Secure, encrypted file storage with AI analysis"
              href="/admin/vault"
              icon="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          )}
          {features.notes !== false && (
            <ModuleCard
              title="Notes"
              description="Rich markdown documentation with versioning"
              href="/admin/notes"
              icon="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          )}
          {features.ai_chat !== false && (
            <ModuleCard
              title="AI Chat"
              description="Conversations with memory and context awareness"
              href="/admin/chat"
              icon="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
            />
          )}
          {features.knowledge !== false && (
            <ModuleCard
              title="Knowledge Base"
              description="Facts and documents for AI context"
              href="/admin/knowledge"
              icon="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
            />
          )}
          {features.api_keys !== false && (
            <ModuleCard
              title="API Keys"
              description="Secure storage for API credentials"
              href="/admin/keys"
              icon="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
            />
          )}
          {features.workflows !== false && (
            <ModuleCard
              title="Workflows"
              description="Projects, tasks, and operating rhythms"
              href="/admin/workflows"
              icon="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ModuleCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-[var(--electric-lime)]/50 transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--electric-lime)]/20 to-[var(--electric-cyan)]/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <svg
            className="w-6 h-6 text-[var(--electric-lime)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
        <div>
          <h3 className="font-medium text-[var(--text-primary)] mb-1">
            {title}
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}
