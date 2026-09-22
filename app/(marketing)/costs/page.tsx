import type { Metadata } from "next";
import Link from "next/link";
import SiteShell from "@/components/marketing/SiteShell";
import { Dual, ScaleAnchor } from "@/components/marketing/voice";
import { DeskKicker, DeskVerified, SourceLinks, StatusPill } from "@/components/marketing/desk";
import { COST_INTRO, COST_MARKERS, DESK_SOURCES, DESK_VERIFIED } from "@/lib/desk";
import { SCALE_ANCHORS } from "@/lib/voice-mode";

export const metadata: Metadata = {
  title: "Costs",
  description:
    "Heritage 0.2¢/kWh export lore, DCIA pricing structure from Material Terms / IRC, and published Labrador and Island industrial markers. Not locked PPAs.",
  alternates: { canonical: "/costs" },
};

export default function CostsPage() {
  return (
    <SiteShell>
      <main className="px-4 pb-20 pt-28 sm:px-6 sm:pb-28 sm:pt-36">
        <article className="mx-auto max-w-[780px]">
          <DeskKicker>Horizon desk · Costs</DeskKicker>
          <h1 className="mt-4 font-display text-[2rem] font-normal leading-[1.1] tracking-[-0.02em] sm:text-5xl">
            Heritage lore, deal structure, then published markers.
          </h1>
          <ScaleAnchor
            className="mt-6 text-lg leading-relaxed text-[var(--text-secondary)]"
            technical={COST_INTRO.body.technical}
            plain={COST_INTRO.body.plain}
            source={`Last verified ${COST_INTRO.lastVerified}`}
          />
          <DeskVerified date={DESK_VERIFIED} />

          <section className="mt-12">
            <h2 className="font-display text-2xl font-normal tracking-[-0.018em] sm:text-3xl">
              01 — Heritage
            </h2>
            <ScaleAnchor
              className="mt-4 text-[15px] leading-relaxed text-[var(--text-secondary)]"
              technical={SCALE_ANCHORS.heritagePrice.technical}
              plain={SCALE_ANCHORS.heritagePrice.plain}
              source={SCALE_ANCHORS.heritagePrice.source}
            />
          </section>

          <section className="mt-12">
            <h2 className="font-display text-2xl font-normal tracking-[-0.018em] sm:text-3xl">
              02 — Structure (not a locked ¢ schedule)
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--text-secondary)]">
              Material Terms describe how later PPAs are supposed to be built: availability and
              take-or-pay blocks, a CPI deadband, leftover-power options, three-year notice. The
              rejected MOU’s ¢ path is on this table only so nobody treats it as current. Illustrative
              MOU cents are never presented as signed offtake.
            </p>
          </section>

          <div className="mt-8 overflow-x-auto rounded border border-[var(--border-subtle)]">
            <table className="w-full min-w-[32rem] text-left text-[14px]">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-1)] font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  <th className="px-4 py-3 font-medium">Marker</th>
                  <th className="px-4 py-3 font-medium">Figure</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {COST_MARKERS.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--border-subtle)] last:border-b-0">
                    <td className="px-4 py-3 text-[var(--text-primary)]">{row.label}</td>
                    <td className="px-4 py-3 font-mono text-[13px] text-[var(--plasma)]">
                      {row.value}
                      {row.unit ? <span className="ml-1 text-[var(--text-muted)]">{row.unit}</span> : null}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 grid gap-4">
            {COST_MARKERS.map((row) => (
              <section
                key={row.id}
                id={row.id}
                className="rounded border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <StatusPill status={row.status} />
                  <span className="font-mono text-[13px] text-[var(--plasma)]">
                    {row.value}
                    {row.unit ? ` ${row.unit}` : ""}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-semibold tracking-[-0.01em]">{row.label}</h3>
                <ScaleAnchor
                  className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]"
                  technical={row.note.technical}
                  plain={row.note.plain}
                  source={`Last verified ${row.lastVerified}`}
                />
                <SourceLinks sources={row.sources.map((id) => DESK_SOURCES[id])} />
              </section>
            ))}
          </div>

          <Dual
            plain={
              <p className="mt-10 text-sm leading-relaxed text-[var(--text-muted)]">
                Island retail “11–13¢ delivered” on older campaign copy is a ballpark for
                Newfoundland Power general service — not used here as a locked PUB figure. Binding
                DCIA industrial cents remain UNKNOWN.
              </p>
            }
            technical={
              <p className="mt-10 text-sm leading-relaxed text-[var(--text-muted)]">
                Island retail general-service ¢/kWh is not restated as a locked PUB order in this
                slice. LAB-IND-1 and Island Industrial are cited from the July 2026 Hydro schedule
                and P.U. 17(2026). Binding DCIA industrial ¢/kWh: UNKNOWN.
              </p>
            }
          />

          <p className="mt-8 text-sm text-[var(--text-muted)]">
            <Link href="/tracker" className="text-[var(--plasma)] no-underline hover:underline">
              Tracker
            </Link>
            {" · "}
            <Link href="/industries" className="text-[var(--plasma)] no-underline hover:underline">
              Industries
            </Link>
            {" · "}
            <Link href="/brief" className="text-[var(--plasma)] no-underline hover:underline">
              Evidence brief
            </Link>
            .
          </p>
        </article>
      </main>
    </SiteShell>
  );
}
