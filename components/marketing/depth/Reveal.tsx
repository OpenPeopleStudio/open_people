"use client";

import { useEffect } from "react";
import { prefersReducedMotion } from "./nudge";

/**
 * One-time rise for [data-rise] elements as they enter the viewport.
 * 8px, 320ms, once. Content is visible by default; the root only opts into
 * hiding once the observer is live, so no-JS, print and reduced motion all
 * see everything.
 */
export function RevealObserver() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".desk-root");
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-rise]"));
    if (!root || els.length === 0) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") return;

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
    // Elements already on screen stay visible; only below-the-fold ones hide.
    const vh = window.innerHeight;
    for (const el of els) {
      if (el.getBoundingClientRect().top < vh) el.dataset.in = "true";
      io.observe(el);
    }
    root.dataset.riseLive = "true";
    return () => {
      io.disconnect();
      delete root.dataset.riseLive;
    };
  }, []);
  return null;
}
