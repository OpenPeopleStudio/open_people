"use client";

import { VOICE_MODES, voiceModeLabel, voiceModeShortLabel, type VoiceMode } from "@/lib/voice-mode";
import { useVoiceMode } from "./VoiceModeProvider";

/**
 * Three-position depth control: Plain · Guided · Technical.
 * `variant="echo"` renders a one-line "Showing … · Switch" note for inline use.
 */
export function DepthControl({
  variant = "control",
  className = "",
  full = false,
}: {
  variant?: "control" | "echo";
  className?: string;
  full?: boolean;
}) {
  const { mode, setMode } = useVoiceMode();

  if (variant === "echo") {
    const next: VoiceMode = mode === "technical" ? "plain" : "technical";
    return (
      <p className={`desk-fact uppercase tracking-[0.12em] text-[var(--ink-3)] ${className}`.trim()}>
        Showing: {voiceModeLabel(mode)}
        {" · "}
        <button
          type="button"
          className="text-[var(--plasma)] underline-offset-4 hover:underline"
          onClick={() => setMode(next)}
        >
          Switch to {voiceModeLabel(next)}
        </button>
      </p>
    );
  }

  return (
    <div
      role="group"
      aria-label="Reading depth"
      className={`depth ${full ? "depth-full" : ""} ${className}`.trim()}
    >
      {VOICE_MODES.map((segment) => {
        const active = mode === segment;
        return (
          <button
            key={segment}
            type="button"
            aria-pressed={active}
            data-depth={segment}
            title={voiceModeLabel(segment)}
            onClick={() => setMode(segment)}
          >
            {voiceModeShortLabel(segment)}
          </button>
        );
      })}
    </div>
  );
}

/** v1 name kept for callers and tests. */
export { DepthControl as VoiceToggle };
