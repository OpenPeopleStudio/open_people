import type { Metadata } from "next";
import Link from "next/link";
import SiteShell from "@/components/marketing/SiteShell";
import { Dual, ScaleAnchor } from "@/components/marketing/voice";
import { DeskKicker, DeskVerified, SourceLinks, StatusPill } from "@/components/marketing/desk";
import {
  CONTESTED_EXPORT,
  COST_ERA_NOTE,
  COST_INTRO,
  COST_MARKERS,
  DESK_SOURCES,
  DESK_VERIFIED,
} from "@/lib/desk";
import { SCALE_ANCHORS } from "@/lib/voice-mode";

export const metadata: Metadata = {
  title: "Costs",
  description:
    "Heritage 0.2¢/kWh export lore, contested 7.4 vs Annex D / 1.8 ¢ paths (not merged), Labrador Interconnected domestic 3.154¢ (Rate 1.1L), and LAB-IND-1 as demand + energy formula — not a single industrial ¢. Not locked PPAs.",
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

          <section
            id="contested"
            className="mt-12 rounded border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 sm:p-6"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--warning)]">
              {CONTESTED_EXPORT.kicker}
            </p>
            <h2 className="mt-3 font-display text-2xl font-normal tracking-[-0.018em] sm:text-3xl">
              {CONTESTED_EXPORT.title}
            </h2>
            <ScaleAnchor
              className="mt-4 text-[15px] leading-relaxed text-[var(--text-secondary)]"
              technical={CONTESTED_EXPORT.intro.technical}
              plain={CONTESTED_EXPORT.intro.plain}
              source={`Last verified ${CONTESTED_EXPORT.lastVerified}`}
            />

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[CONTESTED_EXPORT.campaign, CONTESTED_EXPORT.annexPath].map((path) => (
                <section
                  key={path.id}
                  id={path.id}
                  className="rounded border border-[var(--border-subtle)] p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <StatusPill status={path.status} />
                    <span className="font-mono text-[13px] text-[var(--plasma)]">
                      {path.value}
                      {path.unit ? ` ${path.unit}` : ""}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold tracking-[-0.01em]">{path.label}</h3>
                  <ScaleAnchor
                    className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]"
                    technical={path.note.technical}
                    plain={path.note.plain}
                    source={`Last verified ${path.lastVerified}`}
                  />
                  <SourceLinks sources={path.sources.map((id) => DESK_SOURCES[id])} />
                </section>
              ))}
            </div>

            <section
              id={CONTESTED_EXPORT.bridge.id}
              className="mt-4 rounded border border-[var(--border-subtle)] p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <StatusPill status={CONTESTED_EXPORT.bridge.status} />
                <span className="font-mono text-[13px] text-[var(--warning)]">
                  {CONTESTED_EXPORT.bridge.value}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold tracking-[-0.01em]">
                {CONTESTED_EXPORT.bridge.label}
              </h3>
              <ScaleAnchor
                className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]"
                technical={CONTESTED_EXPORT.bridge.note.technical}
                plain={CONTESTED_EXPORT.bridge.note.plain}
                source={`Last verified ${CONTESTED_EXPORT.bridge.lastVerified}`}
              />
              <SourceLinks sources={CONTESTED_EXPORT.bridge.sources.map((id) => DESK_SOURCES[id])} />
            </section>
          </section>

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

          <section className="mt-12">
            <h2 className="font-display text-2xl font-normal tracking-[-0.018em] sm:text-3xl">
              03 — Published Labrador rates
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--text-secondary)]">
              Hydro’s current-rates page (the live URL path is spelled{" "}
              <span className="font-mono text-[13px]">electicity</span>) quotes{" "}
              <strong className="font-semibold text-[var(--text-primary)]">3.154¢/kWh</strong> for
              the Labrador Interconnected System. That is Rate No. 1.1L{" "}
              <em>domestic</em> energy — households — plus a monthly customer charge. Mines are on{" "}
              <strong className="font-semibold text-[var(--text-primary)]">LAB-IND-1</strong>: demand
              charges plus a monthly firm-energy formula. This desk does not collapse LAB-IND-1 into
              one ¢/kWh.{" "}
              <a
                href={DESK_SOURCES.nlhRates2026.href}
                className="text-[var(--plasma)] no-underline hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                July 2026 schedule PDF
              </a>
              .
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

          <section
            id="schedule-era"
            className="mt-8 rounded border border-[var(--border-subtle)] p-5 sm:p-6"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Schedule-era — not current
            </p>
            <h3 className="mt-3 text-lg font-semibold tracking-[-0.01em]">
              Older Labrador Industrial PDF (2015 figures)
            </h3>
            <ScaleAnchor
              className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]"
              technical={COST_ERA_NOTE.body.technical}
              plain={COST_ERA_NOTE.body.plain}
              source={`Last verified ${COST_ERA_NOTE.lastVerified}`}
            />
            <SourceLinks sources={COST_ERA_NOTE.sources.map((id) => DESK_SOURCES[id])} />
          </section>

          <Dual
            plain={
              <p className="mt-10 text-sm leading-relaxed text-[var(--text-muted)]">
                Island retail “11–13¢ delivered” on older campaign copy is a ballpark for
                Newfoundland Power general service — not used here as a locked PUB figure. Hydro’s
                current-rates page quotes 15.587¢ first-block for Island Interconnected / isolated
                diesel domestic; that is not Labrador. Binding DCIA industrial cents remain UNKNOWN.
              </p>
            }
            technical={
              <p className="mt-10 text-sm leading-relaxed text-[var(--text-muted)]">
                Island retail general-service ¢/kWh is not restated as a locked PUB order in this
                slice. Rate 1.1L (3.154¢) is Labrador Interconnected domestic. LAB-IND-1 is cited as
                structure from the July 2026 Hydro schedule, not as one ¢. Island Industrial Firm is
                the Island grid class (IND-1 + P.U. 17(2026)). Binding DCIA industrial ¢/kWh:
                UNKNOWN.
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
