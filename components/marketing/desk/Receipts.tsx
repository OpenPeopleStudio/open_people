"use client";

import type { ReactNode } from "react";
import { useVoiceMode } from "@/components/marketing/voice";
import { SourceLinks } from "./DeskChrome";
import type { DeskSource } from "@/lib/desk";

/**
 * Technical cites stay available without competing with the plain takeaway.
 * Auto-open in Technical voice; start closed in Plain. Remounts on voice change
 * so the native <details> state follows the mode.
 */
export function Receipts({
  summary = "Receipts",
  children,
  sources = [],
}: {
  summary?: string;
  children: ReactNode;
  sources?: DeskSource[];
}) {
  const { mode } = useVoiceMode();

  return (
    <details key={mode} className="desk-receipts" open={mode === "technical"}>
      <summary>{summary}</summary>
      <div className="desk-receipts-body">
        {children}
        {sources.length > 0 ? <SourceLinks sources={sources} /> : null}
      </div>
    </details>
  );
}
