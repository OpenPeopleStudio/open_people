"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { DeskSource } from "@/lib/desk";
import { StatusPill, type DeskChromeStatus } from "@/components/marketing/desk/StatusChip";

/**
 * The only way a number renders on an instrument or a stat band.
 * Tap/click shows provenance: status, last verified, sources.
 * status="unknown" renders a dashed NOT PUBLISHED slot.
 */
export function Figure({
  value,
  unit,
  status,
  sources = [],
  lastVerified,
  note,
  size = "md",
  className = "",
}: {
  value: string;
  unit?: string | undefined;
  status: DeskChromeStatus;
  sources?: DeskSource[] | undefined;
  lastVerified?: string | undefined;
  note?: string | undefined;
  size?: "sm" | "md" | "lg" | "xl" | undefined;
  className?: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [align, setAlign] = useState<"left" | "right">("left");
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const sizeClass =
    size === "xl"
      ? "desk-num-xl"
      : size === "lg"
        ? "desk-rate"
        : size === "sm"
          ? "text-[0.95rem]"
          : "text-[1.35rem]";

  const isUnknown = status === "unknown";

  return (
    <span className={`figure ${className}`.trim()} data-status={status} ref={ref}>
      <button
        type="button"
        className="figure-btn"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={`${value}${unit ? ` ${unit}` : ""} — show source`}
        onClick={() => {
          if (!open && ref.current) {
            const r = ref.current.getBoundingClientRect();
            setAlign(r.left > window.innerWidth / 2 ? "right" : "left");
          }
          setOpen((v) => !v);
        }}
      >
        <span className={`figure-value ${sizeClass}`}>{isUnknown ? "Not published" : value}</span>
        {unit ? <span className="figure-unit">{unit}</span> : null}
      </button>
      {open ? (
        <span id={id} role="dialog" aria-label="Source" className="figure-prov" data-align={align}>
          <span className="row">
            <StatusPill status={status} />
            {lastVerified ? <span className="desk-fact">Last verified {lastVerified}</span> : null}
          </span>
          {note ? <span className="block">{note}</span> : null}
          {sources.map((s) => (
            <a key={s.id} href={s.href} target="_blank" rel="noreferrer">
              {s.label} →
            </a>
          ))}
        </span>
      ) : null}
    </span>
  );
}
