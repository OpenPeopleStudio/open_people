"use client";

import { ProbePackManager } from "@/components/ai/drift/ProbePackManager";
import { BaselineStatus } from "@/components/ai/drift/BaselineStatus";

export default function DriftObservabilityPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Drift Detection
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Probe packs, auto-baselines, behavioral drift monitoring
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Probe packs */}
        <div className="lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Probe Packs
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Industry templates for monitoring AI behavior and detecting drift
            </p>
          </div>
          <ProbePackManager />
        </div>

        {/* Auto-baseline */}
        <div className="lg:col-span-2">
          <BaselineStatus />
        </div>
      </div>
    </div>
  );
}
