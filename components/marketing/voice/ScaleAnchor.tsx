"use client";

import type { ReactNode } from "react";
import { Dual } from "./Dual";

export function ScaleAnchor({
  technical,
  plain,
  source,
  className,
}: {
  technical: ReactNode;
  plain: ReactNode;
  source?: string;
  className?: string;
}) {
  return (
    <Dual
      plain={<p className={className}>{plain}</p>}
      technical={
        <p className={className}>
          {technical}
          {source ? (
            <span className="mt-2 block font-mono text-[10px] uppercase tracking-[0.11em] text-[var(--text-muted)]">
              {source}
            </span>
          ) : null}
        </p>
      }
    />
  );
}
