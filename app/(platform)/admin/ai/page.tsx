"use client";

import Link from "next/link";
import { useTenant } from "@/context/TenantContext";
import { STATUS_STYLES, getVisibleWorkers } from "@/lib/ai/workers";

/* ═══════════════════════════════════════════════════════════════════════════
   AI Hub - Landing Page
   Quick access to AI Team, Chat, Knowledge, and Costs
   ═══════════════════════════════════════════════════════════════════════════ */

const HUB_SECTIONS = [
  {
    id: "team",
    label: "AI Team",
    description: "Your AI workforce – specialized workers for planning, research, writing, and more",
    href: "/admin/ai/team",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    gradient: { from: "var(--electric-cyan)", to: "var(--electric-lime)" },
  },
  {
    id: "chat",
    label: "AI Chat",
    description: "Conversational AI with memory and context from your workspace",
    href: "/admin/chat",
    icon: "M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z",
    gradient: { from: "#8B5CF6", to: "#EC4899" },
  },
  {
    id: "knowledge",
    label: "Knowledge",
    description: "Your AI's memory – documents, facts, and learned context",
    href: "/admin/knowledge",
    icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
    gradient: { from: "#10B981", to: "#3B82F6" },
  },
  {
    id: "workflows",
    label: "Workflows",
    description: "Tasks, projects, and automated sequences",
    href: "/admin/workflows",
    icon: "M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z",
    gradient: { from: "#F59E0B", to: "#EF4444" },
  },
];

const OBSERVABILITY_SECTIONS = [
  {
    id: "quality",
    label: "Quality",
    description: "Auto-slice explorer, regression gates, quality scoring",
    href: "/admin/ai/quality",
    icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
    gradient: { from: "#FBBF24", to: "#F97316" },
  },
  {
    id: "costs",
    label: "Costs",
    description: "Cost-per-outcome analytics, anomaly detection, change correlation",
    href: "/admin/ai/costs",
    icon: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    gradient: { from: "#10B981", to: "#059669" },
  },
  {
    id: "drift",
    label: "Drift",
    description: "Probe packs, auto-baselines, behavioral drift detection",
    href: "/admin/ai/drift",
    icon: "M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z",
    gradient: { from: "#8B5CF6", to: "#6366F1" },
  },
];

export default function AIHubPage() {
  const tenant = useTenant();
  const features = tenant.settings.features || {};
  const visibleWorkers = getVisibleWorkers(features);
  
  // Count workers by status
  const activeCount = visibleWorkers.filter(w => w.status === "active").length;
  const betaCount = visibleWorkers.filter(w => w.status === "beta").length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--electric-cyan)] to-[var(--electric-lime)] flex items-center justify-center">
            <svg
              className="w-5 h-5 text-[var(--void)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">AI</h1>
            <p className="text-sm text-[var(--text-muted)]">
              Your AI workforce and tools
            </p>
          </div>
        </div>
      </div>

      {/* Hub sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {HUB_SECTIONS.map((section) => (
          <Link
            key={section.id}
            href={section.href}
            className="group p-5 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-[var(--border)] transition-all"
          >
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${section.gradient.from}, ${section.gradient.to})`,
                }}
              >
                <svg
                  className="w-6 h-6 text-[var(--void)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={section.icon} />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--electric-lime)] transition-colors">
                    {section.label}
                  </h3>
                  {section.id === "team" && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--electric-lime)]/10 text-[var(--electric-lime)]">
                      {activeCount} active{betaCount > 0 && `, ${betaCount} beta`}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--text-muted)]">{section.description}</p>
              </div>
              <svg
                className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] group-hover:translate-x-1 transition-all shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick access to workers */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Quick Access</h2>
          <Link
            href="/admin/ai/team"
            className="text-sm text-[var(--electric-lime)] hover:underline"
          >
            View all workers
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {visibleWorkers.slice(0, 6).map((worker) => {
            const statusStyle = STATUS_STYLES[worker.status];
            return (
              <Link
                key={worker.id}
                href={`/admin/ai/team/${worker.route}`}
                className="group p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-[var(--border)] transition-all"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${worker.gradient.from}, ${worker.gradient.to})`,
                    }}
                  >
                    <svg
                      className="w-4 h-4 text-[var(--void)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d={worker.icon} />
                    </svg>
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${statusStyle.bg} ${statusStyle.text}`}>
                    {statusStyle.label}
                  </span>
                </div>
                <h4 className="font-medium text-[var(--text-primary)] group-hover:text-[var(--electric-lime)] transition-colors">
                  {worker.name}
                </h4>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">
                  {worker.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Observability section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Observability</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {OBSERVABILITY_SECTIONS.map((section) => (
            <Link
              key={section.id}
              href={section.href}
              className="group p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-[var(--border)] transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${section.gradient.from}, ${section.gradient.to})`,
                  }}
                >
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={section.icon} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--electric-lime)] transition-colors">
                    {section.label}
                  </h3>
                </div>
              </div>
              <p className="text-sm text-[var(--text-muted)]">{section.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats / info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 mb-1">
            <svg
              className="w-4 h-4 text-[var(--success)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium text-[var(--text-primary)]">Active Workers</span>
          </div>
          <p className="text-2xl font-bold text-[var(--electric-lime)]">{activeCount}</p>
        </div>
        
        <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 mb-1">
            <svg
              className="w-4 h-4 text-[var(--warning)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3" />
            </svg>
            <span className="text-sm font-medium text-[var(--text-primary)]">In Beta</span>
          </div>
          <p className="text-2xl font-bold text-[var(--warning)]">{betaCount}</p>
        </div>
        
        <Link
          href="/admin/chat/settings"
          className="group p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-[var(--border)] transition-all"
        >
          <div className="flex items-center gap-2 mb-1">
            <svg
              className="w-4 h-4 text-[var(--text-muted)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--electric-lime)] transition-colors">
              AI Settings
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">Providers, budget, preferences</p>
        </Link>
      </div>
    </div>
  );
}
