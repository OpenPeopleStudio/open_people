"use client";

import { useEffect } from "react";
import { prefersReducedMotion } from "./nudge";

/**
 * One-time rise for [data-rise] elements as they enter the viewport.
 * 8px, 320ms, once. Instant under reduced motion (CSS handles that too).
 */
export function RevealObserver() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-rise]"));
    if (els.length === 0) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      for (const el of els) el.dataset.in = "true";
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).dataset.in = "true";
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    for (const el of els) io.observe(el);
    return () => io.disconnect();
  }, []);
  return null;
}
