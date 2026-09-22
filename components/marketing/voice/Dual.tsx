"use client";

import type { ReactNode } from "react";
import { useVoiceMode } from "./VoiceModeProvider";

/**
 * v1 swap component. Plain shows in Plain and Guided; technical only in
 * Technical. Prefer <Unfold> (depth/) for new work — it keeps both on screen.
 */
export function Dual({
  plain,
  technical,
}: {
  plain: ReactNode;
  technical: ReactNode;
}) {
  const { mode } = useVoiceMode();
  const showPlain = mode !== "technical";

  return (
    <>
      <div data-voice="plain" hidden={!showPlain} aria-hidden={!showPlain}>
        {plain}
      </div>
      <div data-voice="technical" hidden={showPlain} aria-hidden={showPlain}>
        {technical}
      </div>
    </>
  );
}
