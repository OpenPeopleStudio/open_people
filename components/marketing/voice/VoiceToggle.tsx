"use client";

import { voiceModeLabel, type VoiceMode } from "@/lib/voice-mode";
import { useVoiceMode } from "./VoiceModeProvider";

const SEGMENTS: VoiceMode[] = ["plain", "technical"];

export function VoiceToggle({
  variant = "control",
  className = "",
}: {
  variant?: "control" | "echo";
  className?: string;
}) {
  const { mode, setMode } = useVoiceMode();

  if (variant === "echo") {
    const other: VoiceMode = mode === "plain" ? "technical" : "plain";
    return (
      <p
        className={`font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)] ${className}`.trim()}
      >
        Showing: {voiceModeLabel(mode)}
        {" · "}
        <button
          type="button"
          className="text-[var(--plasma)] underline-offset-4 hover:underline"
          onClick={() => setMode(other)}
        >
          Switch to {voiceModeLabel(other)}
        </button>
      </p>
    );
  }

  return (
    <div
      role="group"
      aria-label="Voice mode"
      className={`inline-flex shrink-0 rounded border border-[var(--border-medium)] ${className}`.trim()}
    >
      {SEGMENTS.map((segment) => {
        const active = mode === segment;
        return (
          <button
            key={segment}
            type="button"
            aria-pressed={active}
            onClick={() => setMode(segment)}
            className={`flex-1 whitespace-nowrap px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors md:flex-none lg:text-[11px] ${
              active
                ? "bg-[var(--plasma-soft)] text-[var(--plasma)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            {voiceModeLabel(segment)}
          </button>
        );
      })}
    </div>
  );
}
