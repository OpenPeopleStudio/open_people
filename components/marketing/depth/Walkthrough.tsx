"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { prefersReducedMotion } from "./nudge";

export type WalkStep = {
  /** element id to scroll to */
  anchor: string;
  /** one or two sentences shown in the bar */
  text: string;
  /** Unfold id to open at this step */
  unfold?: string;
};

type WalkContextValue = {
  steps: WalkStep[];
  index: number | null;
  title: string;
  setSteps: (title: string, steps: WalkStep[]) => void;
  start: () => void;
  next: () => void;
  prev: () => void;
  exit: () => void;
};

const WalkContext = createContext<WalkContextValue | null>(null);

export const UNFOLD_EVENT = "op:unfold";

export function WalkthroughProvider({ children }: { children: ReactNode }) {
  const [steps, setStepsState] = useState<WalkStep[]>([]);
  const [title, setTitle] = useState("");
  const [index, setIndex] = useState<number | null>(null);

  const setSteps = useCallback((t: string, s: WalkStep[]) => {
    setTitle(t);
    setStepsState(s);
    setIndex(null);
  }, []);

  const go = useCallback(
    (i: number) => {
      const step = steps[i];
      if (!step) return;
      setIndex(i);
      const el = document.getElementById(step.anchor);
      if (el) {
        el.scrollIntoView({
          behavior: prefersReducedMotion() ? "auto" : "smooth",
          block: "start",
        });
      }
      if (step.unfold) {
        window.dispatchEvent(
          new CustomEvent(UNFOLD_EVENT, { detail: { id: step.unfold, open: true } })
        );
      }
    },
    [steps]
  );

  const start = useCallback(() => go(0), [go]);
  const next = useCallback(() => {
    if (index === null) return;
    if (index + 1 < steps.length) go(index + 1);
  }, [go, index, steps.length]);
  const prev = useCallback(() => {
    if (index === null) return;
    if (index > 0) go(index - 1);
  }, [go, index]);
  const exit = useCallback(() => setIndex(null), []);

  useEffect(() => {
    if (index === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") exit();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, next, prev, exit]);

  const value = useMemo(
    () => ({ steps, index, title, setSteps, start, next, prev, exit }),
    [steps, index, title, setSteps, start, next, prev, exit]
  );

  return <WalkContext.Provider value={value}>{children}</WalkContext.Provider>;
}

export function useWalkthrough() {
  const ctx = useContext(WalkContext);
  if (!ctx) throw new Error("useWalkthrough must be used within WalkthroughProvider");
  return ctx;
}

/** Registers a page's steps. Render once per page. */
export function WalkSteps({ title, steps }: { title: string; steps: WalkStep[] }) {
  const { setSteps } = useWalkthrough();
  useEffect(() => {
    setSteps(title, steps);
    return () => setSteps("", []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, JSON.stringify(steps)]);
  return null;
}

export function WalkLaunch({ className = "", label }: { className?: string; label?: string }) {
  const { steps, index, start, title } = useWalkthrough();
  if (steps.length === 0) return null;
  return (
    <button
      type="button"
      className={`walk-launch ${className}`.trim()}
      onClick={start}
      aria-pressed={index !== null}
    >
      <span aria-hidden>→</span>
      {label ?? title ?? "Walk me through it"}
    </button>
  );
}

export function WalkBar() {
  const { steps, index, next, prev, exit } = useWalkthrough();
  if (index === null || steps.length === 0) return null;
  const step = steps[index]!;
  return (
    <div className="walk-bar" role="region" aria-label="Walkthrough">
      <div className="walk-bar-inner">
        <span className="walk-step">
          Step {index + 1} of {steps.length}
        </span>
        <p className="walk-text">{step.text}</p>
        <div className="walk-actions">
          <button type="button" onClick={prev} disabled={index === 0} aria-label="Previous step">
            ←
          </button>
          {index + 1 < steps.length ? (
            <button type="button" onClick={next} aria-label="Next step">
              Next →
            </button>
          ) : (
            <button type="button" onClick={exit}>
              Done
            </button>
          )}
          <button type="button" onClick={exit} aria-label="Exit walkthrough">
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
