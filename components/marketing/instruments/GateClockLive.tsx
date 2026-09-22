"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GATES,
  daysUntil,
  gateStates,
  railPosition,
  type GateState,
} from "@/lib/desk";

function useToday(): Date | null {
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => {
    // Set after mount so a statically rendered page has no hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToday(new Date());
    const id = window.setInterval(() => setToday(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return today;
}

/** The vertical "today" marker on the SVG rail. Renders nothing until mounted. */
export function TodayMarker({
  pad,
  width,
  y1,
  y2,
  compact = false,
}: {
  pad: number;
  width: number;
  y1: number;
  y2: number;
  compact?: boolean;
}) {
  const today = useToday();
  if (!today) return null;
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate(),
  ).padStart(2, "0")}`;
  const px = pad + railPosition(iso, GATES) * width;
  return (
    <g transform={`translate(${px} 0)`} aria-hidden>
      <line y1={y1} y2={y2} className="stroke-plasma" strokeWidth={1.5} />
      {!compact ? (
        <text
          y={y2 + 14}
          textAnchor="middle"
          className="lbl"
          style={{ fill: "var(--plasma)" }}
        >
          today
        </text>
      ) : null}
    </g>
  );
}

const STATE_LABEL: Record<GateState, string> = {
  past: "passed",
  today: "today",
  next: "days — next gate",
  future: "days",
};

/** Four live day counters for the on-scale gates that still lie ahead. */
export function GateLive() {
  const today = useToday();
  const states = today ? gateStates(GATES, today) : null;
  const shown = GATES.filter((g) => !g.offscale).slice(1);

  return (
    <div className="gate-clock-live" aria-live="off">
      {shown.map((g) => {
        const state = states?.[g.id] ?? "future";
        const d = today ? daysUntil(g.date, today) : null;
        const value =
          d === null
            ? "   "
            : state === "past"
              ? "✓"
              : d === 0
                ? "0"
                : String(d);
        return (
          <div key={g.id}>
            <p className="desk-fact text-[var(--ink-3)]">{g.short}</p>
            <p
              className="gate-days mt-2"
              data-state={state}
              aria-label={`${g.label}: ${value} ${STATE_LABEL[state]}`}
            >
              {value}
            </p>
            <p className="desk-fact mt-1 text-[var(--ink-3)]">
              {d === null ? "counting" : STATE_LABEL[state]}
            </p>
            <p className="mt-3 text-[13px] leading-snug text-[var(--ink-2)]">
              {g.trackerId ? (
                <Link
                  href={`/tracker#${g.trackerId}`}
                  className="no-underline hover:text-[var(--plasma)]"
                >
                  {g.label}
                </Link>
              ) : (
                g.label
              )}
            </p>
          </div>
        );
      })}
    </div>
  );
}
