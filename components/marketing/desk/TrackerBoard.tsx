import type { ReactNode } from "react";
import { DESK_SOURCES, type DeskItem, type DeskStatus } from "@/lib/desk";
import { LeadTakeaway, PrimarySource } from "./DeskChrome";
import { Receipts } from "./Receipts";
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
              {rows.map((item) => {
                const primary =
                  item.href != null
                    ? {
                        id: `${item.id}-primary`,
                        label: item.hrefLabel ?? DESK_SOURCES[item.sources[0]].label,
                        href: item.href,
                        date: DESK_SOURCES[item.sources[0]].date,
                        kind: DESK_SOURCES[item.sources[0]].kind,
                      }
                    : DESK_SOURCES[item.sources[0]];
                const rest = item.sources
                  .map((id) => DESK_SOURCES[id])
                  .filter((source) => source.href !== primary.href);
                return (
                  <article
                    key={item.id}
                    id={item.id}
                    role="listitem"
                    className="desk-surface p-5 sm:p-6"
                  >
                    <h3 className="desk-h3">{item.title}</h3>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <StatusPill status={item.status} />
                      <span className="desk-fact text-[var(--text-muted)]">
                        Last verified {item.lastVerified}
                      </span>
                    </div>
                    <LeadTakeaway className="mt-4">{item.body.plain}</LeadTakeaway>
                    <PrimarySource source={primary} />
                    <Receipts
                      summary="Receipts — Material Terms / House / PDFs"
                      sources={rest}
                    >
                      <p>{item.body.technical}</p>
                      <p className="mt-3 desk-fact text-[var(--text-muted)]">
                        Event / paper date: {item.when}
                      </p>
                      {extras?.[item.id] ?? null}
                    </Receipts>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
