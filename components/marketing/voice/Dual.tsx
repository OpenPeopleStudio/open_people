"use client";

import type { ReactNode } from "react";
import { useVoiceMode } from "./VoiceModeProvider";

export function Dual({
  plain,
  technical,
}: {
  plain: ReactNode;
  technical: ReactNode;
}) {
  const { mode } = useVoiceMode();
  const showPlain = mode === "plain";

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
