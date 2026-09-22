"use client";

import { voiceModeLabel, voiceModeToQueryValue } from "@/lib/voice-mode";
import { useVoiceMode } from "./VoiceModeProvider";

export function PrintVoiceNote() {
  const { mode } = useVoiceMode();
  const query = voiceModeToQueryValue(mode);

  return (
    <p className="voice-print-note hidden px-4 py-3 font-mono text-[10px] uppercase tracking-[0.11em] text-[var(--text-muted)]">
      Showing {voiceModeLabel(mode)}. Also available at openpeople.ai?v={query}
    </p>
  );
}
