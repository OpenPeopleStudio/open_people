import Link from "next/link";
import { notFound } from "next/navigation";

import { getWorkerById, STATUS_STYLES } from "@/lib/ai/workers";

import ChiefOfStaffWorker from "@/components/ai/workers/ChiefOfStaffWorker";
import OpsWorker from "@/components/ai/workers/OpsWorker";
import ResearcherWorker from "@/components/ai/workers/ResearcherWorker";
import WriterWorker from "@/components/ai/workers/WriterWorker";
import InboxTriageWorker from "@/components/ai/workers/InboxTriageWorker";
import AnalystWorker from "@/components/ai/workers/AnalystWorker";
import SalesDeskWorker from "@/components/ai/workers/SalesDeskWorker";

/* ═══════════════════════════════════════════════════════════════════════════
   Super Admin Worker Detail
   Renders worker UI without tenant feature gating
   ═══════════════════════════════════════════════════════════════════════════ */

const WORKER_COMPONENTS: Record<string, React.ComponentType> = {
  "chief-of-staff": ChiefOfStaffWorker,
  ops: OpsWorker,
  researcher: ResearcherWorker,
  writer: WriterWorker,
  "inbox-triage": InboxTriageWorker,
  analyst: AnalystWorker,
  "sales-desk": SalesDeskWorker,
};

export default async function SuperAdminWorkerDetailPage({
  params,
}: {
  params: Promise<{ workerId: string }>;
}) {
  const { workerId } = await params;
  const worker = getWorkerById(workerId);

  if (!worker) notFound();

  const WorkerComponent = WORKER_COMPONENTS[workerId];
  if (!WorkerComponent) notFound();

  const statusStyle = STATUS_STYLES[worker.status];

  return (
    <div>
      <div className="px-6 pt-6 pb-0">
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-4">
          <Link href="/super-admin/ai" className="hover:text-[var(--text-primary)] transition-colors">
            AI
          </Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <Link href="/super-admin/ai/team" className="hover:text-[var(--text-primary)] transition-colors">
            Team
          </Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-[var(--text-primary)] flex items-center gap-2">
            {worker.name}
            {worker.status !== "active" && (
              <span className={`text-xs px-1.5 py-0.5 rounded ${statusStyle.bg} ${statusStyle.text}`}>
                {statusStyle.label}
              </span>
            )}
          </span>
        </div>
      </div>

      <WorkerComponent />
    </div>
  );
}

