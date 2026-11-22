"use client";

import type { ReactNode } from "react";

/**
 * Marks a figure inside an Unfold's plain sentence. When the technical block
 * is open the mark gets a steel tick; hovering a mark highlights its twin in
 * the technical block (same `id`), via a data attribute on the Unfold root.
 * Ids are a–d per Unfold.
 */
export function Fig({ id, children }: { id: "a" | "b" | "c" | "d"; children: ReactNode }) {
  const set = (e: React.SyntheticEvent<HTMLElement>, on: boolean) => {
    const root = e.currentTarget.closest<HTMLElement>(".unfold");
    if (!root) return;
    if (on) {
      root.dataset.activeFig = id;
      return;
    }
    if (root.dataset.stickFig) root.dataset.activeFig = root.dataset.stickFig;
    else if (root.dataset.activeFig === id) delete root.dataset.activeFig;
  };
  return (
    <mark
      className="fig"
      data-fig={id}
      onMouseEnter={(e) => set(e, true)}
      onMouseLeave={(e) => set(e, false)}
      onFocus={(e) => set(e, true)}
      onBlur={(e) => set(e, false)}
      onClick={(e) => {
        const root = e.currentTarget.closest<HTMLElement>(".unfold");
        if (!root) return;
        if (root.dataset.stickFig === id) {
          delete root.dataset.stickFig;
          if (root.dataset.activeFig === id) delete root.dataset.activeFig;
          return;
        }
        root.dataset.stickFig = id;
        root.dataset.activeFig = id;
      }}
    >
      {children}
    </mark>
  );
}
