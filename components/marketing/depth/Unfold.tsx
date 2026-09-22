"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { DeskSource } from "@/lib/desk";
import { useDepth } from "@/components/marketing/voice";
import { UNFOLD_EVENT } from "./Walkthrough";
import {
  alreadyNudged,
  claimNudge,
  markNudged,
  prefersReducedMotion,
  releaseNudge,
  useNudgesEnabled,
} from "./nudge";

function firstSentence(text: string): string {
  const m = text.match(/^(.{20,180}?[.!?])(\s|$)/);
  return m ? m[1]! : text.slice(0, 140) + (text.length > 140 ? "…" : "");
}

/**
 * The plain sentence stays. The technical block arrives underneath, connected
 * to the number it substantiates. Not a swap.
 *
 *  - Plain depth:     technical folded; toggle reads "Break down {label}".
 *  - Guided depth:    folded, with the first technical sentence as a teaser.
 *  - Technical depth: open.
 * A reader's manual fold/unfold overrides the depth until the depth changes.
 */
export function Unfold({
  id,
  plain,
  technical,
  label,
  sources = [],
  teaser,
  className = "",
  nudge = true,
}: {
  id?: string | undefined;
  plain: ReactNode;
  technical: ReactNode;
  /** the figure the technical block backs, e.g. "1.8¢" — used in the toggle copy */
  label?: string | undefined;
  sources?: DeskSource[] | undefined;
  /** override the guided teaser line */
  teaser?: string | undefined;
  className?: string | undefined;
  nudge?: boolean | undefined;
}) {
  const { depth } = useDepth();
  const autoId = useId();
  const unfoldId = id ?? `unfold-${autoId}`;
  const [override, setOverride] = useState<boolean | null>(null);
  const open = override ?? depth === "technical";
  const rootRef = useRef<HTMLDivElement>(null);
  const nudgesOn = useNudgesEnabled();
  const [nudgeText, setNudgeText] = useState<string | null>(null);

  // A manual fold/unfold overrides the depth only until the depth changes.
  const [prevDepth, setPrevDepth] = useState(depth);
  if (prevDepth !== depth) {
    setPrevDepth(depth);
    setOverride(null);
  }

  useEffect(() => {
    function onUnfold(e: Event) {
      const detail = (e as CustomEvent<{ id: string; open: boolean }>).detail;
      if (detail?.id === unfoldId) setOverride(detail.open);
    }
    window.addEventListener(UNFOLD_EVENT, onUnfold);
    return () => window.removeEventListener(UNFOLD_EVENT, onUnfold);
  }, [unfoldId]);

  // Nudge: linger on a folded card in Plain → offer the receipt.
  //        linger on an open dense block in Technical → offer the plain read.
  useEffect(() => {
    if (!nudge || !nudgesOn || prefersReducedMotion()) return;
    if (alreadyNudged(unfoldId)) return;
    const wantsReceipt = depth === "plain" && !open;
    const wantsPlain = depth === "technical" && open;
    if (!wantsReceipt && !wantsPlain) return;
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    let timer: number | undefined;
    const delay = wantsReceipt ? 4000 : 6000;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;
        if (e.isIntersecting && e.intersectionRatio >= 0.6) {
          timer = window.setTimeout(() => {
            if (!claimNudge(unfoldId)) return;
            markNudged(unfoldId);
            setNudgeText(
              wantsReceipt
                ? `Want the receipt${label ? ` for ${label}` : ""}?`
                : "Lost in the annexes?"
            );
          }, delay);
        } else if (timer) {
          window.clearTimeout(timer);
          timer = undefined;
        }
      },
      { threshold: [0, 0.6, 1] }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer) window.clearTimeout(timer);
    };
  }, [depth, open, nudge, nudgesOn, unfoldId, label]);

  const dismissNudge = useCallback(() => {
    setNudgeText(null);
    releaseNudge(unfoldId);
  }, [unfoldId]);

  const { setDepth } = useDepth();

  const toggle = () => {
    setOverride(!open);
    if (nudgeText) dismissNudge();
  };

  const teaserText =
    teaser ?? (typeof technical === "string" ? firstSentence(technical) : undefined);

  return (
    <div
      ref={rootRef}
      id={id}
      className={`unfold ${className}`.trim()}
      data-open={open ? "true" : "false"}
      data-depth={depth}
    >
      <div className="unfold-plain">{plain}</div>

      {depth === "guided" && !open && teaserText ? (
        <p className="unfold-teaser">{teaserText}</p>
      ) : null}

      <button
        type="button"
        className="unfold-toggle"
        aria-expanded={open}
        aria-controls={`${unfoldId}-body`}
        onClick={toggle}
      >
        <span className="tick" aria-hidden />
        {open ? "Fold" : label ? `Break down ${label}` : "Break it down"}
      </button>

      {nudgeText ? (
        <p className="nudge" aria-live="polite">
          {nudgeText}{" "}
          {depth === "technical" ? (
            <button
              type="button"
              onClick={() => {
                dismissNudge();
                setDepth("plain");
              }}
            >
              Read it plain →
            </button>
          ) : (
            <button type="button" onClick={toggle}>
              Show me →
            </button>
          )}
        </p>
      ) : null}

      <div className="unfold-body" id={`${unfoldId}-body`} aria-hidden={!open}>
        <div>
          <div className="unfold-tech">
            {typeof technical === "string" ? <p>{technical}</p> : technical}
            {sources.length > 0 ? (
              <ul className="unfold-sources">
                {sources.map((s) => (
                  <li key={s.id}>
                    <a href={s.href} target="_blank" rel="noreferrer">
                      {s.label} →
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
