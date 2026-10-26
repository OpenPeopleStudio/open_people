"use client";

import type { KeyboardEvent } from "react";
import Link from "next/link";
import { Figure } from "@/components/marketing/depth";
import type { DeskSource } from "@/lib/desk";
import type { DeskChromeStatus } from "@/components/marketing/desk/StatusChip";

export type InstFigure = {
  value: string;
  status: DeskChromeStatus;
  sources: DeskSource[];
  lastVerified?: string;
  note?: string;
};

/** Props for an SVG group or an HTML control that selects one part of a diagram. */
export function instHit<T extends string>(
  id: T,
  label: string,
  active: string,
  select: (id: T) => void,
) {
  return {
    role: "button" as const,
    tabIndex: 0,
    "aria-pressed": active === id,
    "aria-label": label,
    "data-on": active === id ? "true" : "false",
    className: "inst-hit",
    onClick: () => select(id),
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        select(id);
      }
    },
  };
}

/**
 * The one sentence for the part of a diagram that is selected.
 * The number opens the source. The rest of the diagram stays a picture.
 */
export function InstDetail({
  kicker,
  body,
  href,
  hrefLabel,
  figure,
}: {
  kicker: string;
  body: string;
  href?: string;
  hrefLabel?: string;
  figure?: InstFigure;
}) {
  return (
    <div className="inst-detail" aria-live="polite">
      <p className="inst-detail-kicker">{kicker}</p>
      <p className="inst-detail-body">{body}</p>
      {figure ? (
        <p className="inst-detail-fig">
          <Figure {...figure} size="sm" />
        </p>
      ) : null}
      {href ? (
        <p className="inst-detail-more">
          <Link href={href} className="desk-link">
            {hrefLabel ?? "Record →"}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
