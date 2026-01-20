import Link from "next/link";

import { AI_WORKERS, STATUS_STYLES, type WorkerDefinition, type WorkerStatus } from "@/lib/ai/workers";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin AI Team - Worker Roster
   ═══════════════════════════════════════════════════════════════════════════ */

export default function SuperAdminAITeamPage() {
  const grouped = {
    active: AI_WORKERS.filter((w) => w.status === "active"),
    beta: AI_WORKERS.filter((w) => w.status === "beta"),
    planned: AI_WORKERS.filter((w) => w.status === "planned"),
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-3">
          <Link href="/super-admin/ai" className="hover:text-[var(--text-primary)] transition-colors">
            AI
          </Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-[var(--text-primary)]">Team</span>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--electric-cyan)] to-[var(--electric-lime)] flex items-center justify-center">
            <svg className="w-5 h-5 text-[var(--void)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">AI Team</h1>
            <p className="text-sm text-[var(--text-muted)]">Super-admin view of worker UIs</p>
          </div>
        </div>
      </div>

      {grouped.active.length > 0 && (
        <WorkerSection title="Active" description="Production-ready workers" workers={grouped.active} status="active" />
      )}
      {grouped.beta.length > 0 && (
        <WorkerSection title="Beta" description="New workers being tested" workers={grouped.beta} status="beta" />
      )}
      {grouped.planned.length > 0 && (
        <WorkerSection title="Coming Soon" description="Workers in development" workers={grouped.planned} status="planned" />
      )}
    </div>
  );
}

function WorkerSection({
  title,
  description,
  workers,
  status,
}: {
  title: string;
  description: string;
  workers: WorkerDefinition[];
  status: WorkerStatus;
}) {
  const statusStyle = STATUS_STYLES[status];

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
        <span className={`text-xs px-2 py-0.5 rounded ${statusStyle.bg} ${statusStyle.text}`}>{workers.length}</span>
      </div>
      <p className="text-sm text-[var(--text-muted)] mb-4">{description}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workers.map((worker) => (
          <WorkerCard key={worker.id} worker={worker} />
        ))}
      </div>
    </div>
  );
}

function WorkerCard({ worker }: { worker: WorkerDefinition }) {
  const statusStyle = STATUS_STYLES[worker.status];
  const isAvailable = worker.status === "active" || worker.status === "beta";

  const card = (
    <div className="p-5 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-[var(--border)] transition-all h-full">
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `linear-gradient(135deg, ${worker.gradient.from}, ${worker.gradient.to})` }}
        >
          <svg className="w-6 h-6 text-[var(--void)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={worker.icon} />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-[var(--text-primary)]">{worker.name}</h3>
            <span className={`text-xs px-1.5 py-0.5 rounded ${statusStyle.bg} ${statusStyle.text}`}>{statusStyle.label}</span>
          </div>
          <p className="text-sm text-[var(--text-muted)] mb-3">{worker.description}</p>
          <div className="flex flex-wrap gap-1">
            {worker.outputTypes.slice(0, 4).map((type) => (
              <span key={type} className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)]">
                {type.replace("_", " ")}
              </span>
            ))}
          </div>
        </div>
        {isAvailable && (
          <svg className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] group-hover:translate-x-1 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        )}
      </div>
    </div>
  );

  if (isAvailable) {
    return (
      <Link href={`/super-admin/ai/team/${worker.id}`} className="group block">
        {card}
      </Link>
    );
  }

  return <div className="opacity-60 cursor-not-allowed">{card}</div>;
}

