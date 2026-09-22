import type { ReactNode } from "react";
import { ScaleAnchor } from "@/components/marketing/voice";
import { DESK_SOURCES, type DeskItem, type DeskStatus } from "@/lib/desk";
import { SourceLinks } from "./DeskChrome";
import { StatusPill } from "./StatusChip";

const COLUMNS: { id: string; title: string; statuses: DeskStatus[] }[] = [
  { id: "on-paper", title: "On paper", statuses: ["signed", "framework", "endorsed"] },
  { id: "open", title: "Open", statuses: ["open"] },
  { id: "unknown", title: "UNKNOWN", statuses: ["unknown"] },
];

export function TrackerBoard({
  items,
  extras,
}: {
  items: readonly DeskItem[];
  extras?: Partial<Record<string, ReactNode>>;
}) {
  return (
    <div className="desk-board" role="list">
      {COLUMNS.map((column) => {
        const rows = items.filter((item) =>
          (column.statuses as readonly string[]).includes(item.status),
        );
        return (
          <section key={column.id} className="desk-board-col" aria-label={column.title}>
            <header className="desk-board-head">
              <h2 className="desk-fact text-[var(--text-primary)]">{column.title}</h2>
              <span className="desk-fact text-[var(--text-muted)]">{rows.length}</span>
            </header>
            <div className="desk-board-stack">
              {rows.map((item) => (
                <article
                  key={item.id}
                  id={item.id}
                  role="listitem"
                  className="desk-surface p-5 sm:p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <StatusPill status={item.status} />
                    <span className="desk-fact text-[var(--text-muted)]">{item.when}</span>
                  </div>
                  <h3 className="desk-h3 mt-4">{item.title}</h3>
                  <ScaleAnchor
                    className="mt-3 text-[14px] leading-relaxed text-[var(--text-secondary)]"
                    technical={item.body.technical}
                    plain={item.body.plain}
                    source={`Last verified ${item.lastVerified}`}
                  />
                  {extras?.[item.id] ?? null}
                  <SourceLinks sources={item.sources.map((id) => DESK_SOURCES[id])} />
                  {item.href ? (
                    <p className="mt-3">
                      <a
                        href={item.href}
                        className="desk-fact uppercase tracking-[0.12em] text-[var(--plasma)] no-underline hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {item.hrefLabel ?? "Primary document"} →
                      </a>
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
