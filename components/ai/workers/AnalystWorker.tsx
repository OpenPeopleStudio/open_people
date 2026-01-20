"use client";

import { WorkerComingSoonShell } from "./WorkerComingSoonShell";

/* ═══════════════════════════════════════════════════════════════════════════
   Analyst Worker - Weekly Review & Metrics
   Planned scaffold - generates weekly reviews with metrics and decisions
   ═══════════════════════════════════════════════════════════════════════════ */

export default function AnalystWorker() {
  return (
    <WorkerComingSoonShell
      title="Analyst"
      description="Run weekly reviews with metrics, reflections, and decisions that can be handed off to Ops for task creation."
      iconPath="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      gradient={{ from: "#EC4899", to: "#8B5CF6" }}
      outputs={["note", "decision"]}
    />
  );
}
