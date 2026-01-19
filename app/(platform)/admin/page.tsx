"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTenant } from "@/context/TenantContext";

/* ═══════════════════════════════════════════════════════════════════════════
   Tenant Admin Dashboard
   Overview of workspace status and quick actions
   ═══════════════════════════════════════════════════════════════════════════ */

type DashboardStats = {
  storage: { used: number; limit: number } | null;
  notifications: { unread: number } | null;
  notes: { total: number } | null;
  conversations: { total: number } | null;
  tasks: { active: number; overdue: number } | null;
  vault: { files: number; size: number } | null;
};

export default function AdminDashboard() {
  const tenant = useTenant();
  const [stats, setStats] = useState<DashboardStats>({
    storage: null,
    notifications: null,
    notes: null,
    conversations: null,
    tasks: null,
    vault: null,
  });
  const [loading, setLoading] = useState(true);

  const brandName = tenant.settings.theme?.brand_name || tenant.name || "Workspace";
  const features = tenant.settings.features || {};

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      
      // Load stats in parallel
      const promises: Promise<void>[] = [];
  
      // Notifications
      promises.push(
        fetch("/api/notifications/inbox?limit=1")
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data) {
              setStats(prev => ({ ...prev, notifications: { unread: data.unread || 0 } }));
            }
          })
          .catch(() => {})
      );
  
      // Notes
      if (features.notes !== false) {
        promises.push(
          fetch("/api/notes?limit=1")
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data) {
                setStats(prev => ({ ...prev, notes: { total: data.total || 0 } }));
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
                setStats(prev => ({ ...prev, conversations: { total: data.conversations?.length || 0 } }));
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
                setStats(prev => ({ ...prev, tasks: { active: tasks.length, overdue } }));
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
                setStats(prev => ({ 
                  ...prev, 
                  vault: { 
                    files: data.vault.total_files || 0, 
                    size: data.vault.total_size_bytes || 0 
                  } 
                }));
              }
            })
            .catch(() => {})
        );
      }
  
      await Promise.all(promises);
      setLoading(false);
    }

    loadStats();
  }, [features.notes, features.ai_chat, features.workflows, features.vault]);

  const quickActions = [
    {
      label: "New Note",
      href: "/admin/notes",
      icon: "M12 4v16m8-8H4",
      color: "from-blue-500 to-blue-600",
      feature: "notes",
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
  ].filter(card => features[card.feature as keyof typeof features] !== false);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Welcome to {brandName}
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Your workspace dashboard
        </p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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

      {/* Module Links */}
      <div>
        <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
          Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
