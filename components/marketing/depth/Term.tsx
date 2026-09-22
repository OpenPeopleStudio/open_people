"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { GLOSSARY, type GlossaryKey } from "@/lib/desk";

/**
 * Jargon with a dotted steel underline. Click opens a three-line explainer:
 * what it is, why it matters here, where it shows up. Desktop: anchored
 * popover. Mobile: bottom sheet. Escape or outside click closes.
 */
export function Term({ k, children }: { k: GlossaryKey; children?: ReactNode }) {
  const entry = GLOSSARY[k];
  const [open, setOpen] = useState(false);
  const [align, setAlign] = useState<"left" | "right">("left");
  const wrapRef = useRef<HTMLSpanElement>(null);
  const dialogId = useId();

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent | TouchEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
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

  const toggle = () => {
    if (!open && wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect();
      setAlign(r.left > window.innerWidth / 2 ? "right" : "left");
    }
    setOpen((v) => !v);
  };

  return (
    <span className="term-wrap" ref={wrapRef}>
      <button
        type="button"
        className="term"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        onClick={toggle}
      >
        {children ?? entry.term}
      </button>
      {open ? (
        <span
          role="dialog"
          id={dialogId}
          aria-label={`${entry.term}: explained`}
          className="term-pop"
          data-align={align}
        >
          <span className="term-pop-head">
            <span className="term-pop-term">{entry.term}</span>
            <button type="button" className="term-pop-close" onClick={() => setOpen(false)}>
              Close
            </button>
          </span>
          <dl>
            <div>
              <dt>What it is</dt>
              <dd>{entry.what}</dd>
            </div>
            <div>
              <dt>Why it matters here</dt>
              <dd>{entry.why}</dd>
            </div>
          </dl>
          {entry.where ? (
            <Link href={entry.where.href} className="term-pop-where" onClick={() => setOpen(false)}>
              Where it shows up · {entry.where.label} →
            </Link>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
