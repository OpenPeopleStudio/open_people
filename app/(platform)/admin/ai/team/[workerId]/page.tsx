"use client";

import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/context/TenantContext";
import { getWorkerById, isWorkerEnabled, STATUS_STYLES } from "@/lib/ai/workers";

// Worker UI components
import ChiefOfStaffWorker from "@/components/ai/workers/ChiefOfStaffWorker";
import OpsWorker from "@/components/ai/workers/OpsWorker";
import ResearcherWorker from "@/components/ai/workers/ResearcherWorker";
import WriterWorker from "@/components/ai/workers/WriterWorker";
import InboxTriageWorker from "@/components/ai/workers/InboxTriageWorker";
import AnalystWorker from "@/components/ai/workers/AnalystWorker";
import SalesDeskWorker from "@/components/ai/workers/SalesDeskWorker";

/* ═══════════════════════════════════════════════════════════════════════════
   AI Worker Detail Page
   Dynamic page that renders the appropriate worker UI component
   ═══════════════════════════════════════════════════════════════════════════ */

// Map worker IDs to their component implementations
const WORKER_COMPONENTS: Record<string, React.ComponentType> = {
  "chief-of-staff": ChiefOfStaffWorker,
  "ops": OpsWorker,
  "researcher": ResearcherWorker,
  "writer": WriterWorker,
  "inbox-triage": InboxTriageWorker,
  "analyst": AnalystWorker,
  "sales-desk": SalesDeskWorker,
};

export default function WorkerDetailPage() {
  const params = useParams();
  const workerId = params.workerId as string;
  
  const tenant = useTenant();
  const features = tenant.settings.features || {};
  
  // Get worker definition
  const worker = getWorkerById(workerId);
  
  // Check if worker exists
  if (!worker) {
    notFound();
  }
  
  // Check if worker is enabled
  if (!isWorkerEnabled(workerId, features)) {
    return <WorkerDisabled workerId={workerId} workerName={worker.name} />;
  }
  
  // Get the component for this worker
  const WorkerComponent = WORKER_COMPONENTS[workerId];
  
  // If component doesn't exist yet (planned worker)
  if (!WorkerComponent) {
    return <WorkerComingSoon worker={worker} />;
  }
  
  const statusStyle = STATUS_STYLES[worker.status];
  
  return (
    <div>
      {/* Breadcrumb header */}
      <div className="px-6 pt-6 pb-0">
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-4">
          <Link href="/admin/ai" className="hover:text-[var(--text-primary)] transition-colors">
            AI
          </Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <Link href="/admin/ai/team" className="hover:text-[var(--text-primary)] transition-colors">
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
      
      {/* Worker UI */}
      <WorkerComponent />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Disabled Worker State
   ═══════════════════════════════════════════════════════════════════════════ */

function WorkerDisabled({ workerId, workerName }: { workerId: string; workerName: string }) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--surface-1)] flex items-center justify-center">
          <svg
            className="w-8 h-8 text-[var(--text-muted)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
          {workerName} is not enabled
        </h3>
        <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto mb-6">
          This worker is not enabled for your workspace. Contact your administrator to enable it.
        </p>
        <Link
          href="/admin/ai/team"
          className="px-4 py-2 rounded-lg bg-[var(--surface-1)] text-[var(--text-primary)] text-sm hover:bg-[var(--surface-2)] transition-colors"
        >
          Back to AI Team
        </Link>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Coming Soon State
   ═══════════════════════════════════════════════════════════════════════════ */

function WorkerComingSoon({ worker }: { worker: ReturnType<typeof getWorkerById> }) {
  if (!worker) return null;
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="text-center py-16">
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${worker.gradient.from}40, ${worker.gradient.to}40)`,
          }}
        >
          <svg
            className="w-8 h-8"
            style={{ color: worker.gradient.from }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d={worker.icon} />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
          {worker.name} – Coming Soon
        </h3>
        <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto mb-4">
          {worker.longDescription || worker.description}
        </p>
        <p className="text-xs text-[var(--text-muted)] mb-6">
          Version {worker.version} • Status: {STATUS_STYLES[worker.status].label}
        </p>
        
        {/* Expected outputs */}
        <div className="inline-flex flex-wrap gap-2 justify-center mb-6">
          {worker.outputTypes.map((type) => (
            <span
              key={type}
              className="text-xs px-2 py-1 rounded-full bg-[var(--surface-1)] text-[var(--text-muted)]"
            >
              Outputs: {type.replace("_", " ")}
            </span>
          ))}
        </div>
        
        <div>
          <Link
            href="/admin/ai/team"
            className="px-4 py-2 rounded-lg bg-[var(--surface-1)] text-[var(--text-primary)] text-sm hover:bg-[var(--surface-2)] transition-colors"
          >
            Back to AI Team
          </Link>
        </div>
      </div>
    </div>
  );
}
