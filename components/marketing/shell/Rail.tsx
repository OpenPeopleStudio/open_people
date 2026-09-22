"use client";

import { useEffect, useState } from "react";
import { DepthControl } from "@/components/marketing/voice";
import { WalkLaunch, setNudgesEnabled, useNudgesEnabled } from "@/components/marketing/depth";

export type RailSection = { id: string; label: string };

function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (ids.length === 0 || typeof IntersectionObserver === "undefined") return;
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive((visible[0].target as HTMLElement).id);
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: [0, 0.2] }
    );
    for (const el of els) io.observe(el);
    return () => io.disconnect();
  }, [ids]);
  return active;
}

/**
 * Left rail (≥1024px): section index with scrollspy, the depth control,
 * the walkthrough launcher and the nudge switch.
 */
export function Rail({ sections = [] }: { sections?: RailSection[] }) {
  const active = useScrollSpy(sections.map((s) => s.id));
  const nudges = useNudgesEnabled();

  return (
    <aside className="desk-rail" aria-label="Page tools">
      <div className="desk-rail-group">
        <p className="desk-rail-label">Reading depth</p>
        <DepthControl full />
        <p className="desk-rail-note mt-3">
          Plain keeps one sentence per fact. Technical opens the receipts under each one.
        </p>
      </div>

      {sections.length > 0 ? (
        <div className="desk-rail-group">
          <p className="desk-rail-label">On this page</p>
          <ul className="desk-rail-index">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} aria-current={active === s.id ? "true" : undefined}>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="desk-rail-group">
        <WalkLaunch />
        <label className="mt-4 flex items-center gap-2 desk-fact text-[var(--ink-3)]">
          <input
            type="checkbox"
            checked={nudges}
            onChange={(e) => setNudgesEnabled(e.target.checked)}
            className="accent-[var(--plasma)]"
          />
          Offer receipts as I read
        </label>
      </div>
    </aside>
  );
}

/** Mobile strip under the nav: depth control + walkthrough launcher. */
export function MobileStrip() {
  return (
    <div className="desk-strip">
      <DepthControl />
      <div className="ml-auto">
        <WalkLaunch label="Walk me through" />
      </div>
    </div>
  );
}
