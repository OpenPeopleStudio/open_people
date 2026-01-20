"use client";

import { WorkerComingSoonShell } from "./WorkerComingSoonShell";

/* ═══════════════════════════════════════════════════════════════════════════
   Inbox Triage Worker - Email Summary & Reply
   Planned scaffold - summarizes emails and drafts replies with tasks
   ═══════════════════════════════════════════════════════════════════════════ */

export default function InboxTriageWorker() {
  return (
    <WorkerComingSoonShell
      title="Inbox Triage"
      description="Summarize email threads, propose replies, and extract follow-up tasks. Manual approval required before any outbound email."
      iconPath="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859"
      gradient={{ from: "#10B981", to: "#3B82F6" }}
      outputs={["email draft", "task", "checklist"]}
    />
  );
}
