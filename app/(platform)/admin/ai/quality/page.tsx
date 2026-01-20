"use client";

import { AutoSliceExplorer } from "@/components/ai/quality/AutoSliceExplorer";
import { RegressionGatePanel } from "@/components/ai/quality/RegressionGatePanel";

export default function QualityObservabilityPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FBBF24] to-[#F97316] flex items-center justify-center">
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
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Quality Observability
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Auto-slice explorer, regression gates, quality scoring
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Auto-slice explorer */}
        <div className="lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Low-Quality Clusters
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Automatically detected clusters with high low-quality rates
            </p>
          </div>
          <AutoSliceExplorer />
        </div>

        {/* Regression gates */}
        <div className="lg:col-span-2">
          <RegressionGatePanel />
        </div>
      </div>
    </div>
  );
}
