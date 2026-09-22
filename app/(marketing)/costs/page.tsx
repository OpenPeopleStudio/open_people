import type { Metadata } from "next";
import Link from "next/link";
import SiteShell from "@/components/marketing/SiteShell";
import { Dual } from "@/components/marketing/voice";
import {
  ContestedRateStrip,
  DeskKicker,
  DeskVerified,
  LeadTakeaway,
  Receipts,
  StatusPill,
} from "@/components/marketing/desk";
import {
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
    "Heritage 0.2¢/kWh export lore, contested 1.8¢ start vs 7.4¢ life-average (different measurements), Labrador Interconnected domestic 3.154¢ (Rate 1.1L), and LAB-IND-1 as demand + energy formula — not a single industrial ¢. Not locked PPAs.",
  alternates: { canonical: "/costs" },
};

export default function CostsPage() {
  return (
    <SiteShell>
      <main className="desk-page pb-24 sm:pb-32">
        <DeskVerified date={DESK_VERIFIED} sticky />
        <article className="mx-auto max-w-[780px] px-4 pt-10 sm:px-6 sm:pt-14">
          <DeskKicker>Horizon desk · Costs</DeskKicker>
          <h1 className="desk-h1 mt-5">
            Heritage lore, deal structure, then published markers.
          </h1>
          <LeadTakeaway className="mt-8 text-lg leading-relaxed">
            {COST_INTRO.body.plain}
          </LeadTakeaway>
          <Receipts
            summary="Receipts — how the price stories are kept apart"
          >
            <p>{COST_INTRO.body.technical}</p>
            <p className="mt-3 desk-fact text-[var(--text-muted)]">
              Last verified {COST_INTRO.lastVerified}
            </p>
          </Receipts>
        </article>

        <div className="mx-auto mt-14 max-w-[1080px] px-4 sm:px-6">
          <ContestedRateStrip />
        </div>

        <article className="mx-auto max-w-[780px] px-4 sm:px-6">
          <section className="mt-16">
            <h2 className="desk-h2">
              01 — Heritage
            </h2>
            <LeadTakeaway className="mt-4">{SCALE_ANCHORS.heritagePrice.plain}</LeadTakeaway>
            <Receipts summary="Receipts — 1969 renewal, two mills">
              <p>{SCALE_ANCHORS.heritagePrice.technical}</p>
              <p className="mt-3 desk-fact text-[var(--text-muted)]">
                {SCALE_ANCHORS.heritagePrice.source}
              </p>
            </Receipts>
          </section>

          <section className="mt-16">
            <h2 className="desk-h2">
              02 — Structure (not a locked ¢ schedule)
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--text-secondary)]">
              Material Terms describe how later PPAs are supposed to be built: availability and
              take-or-pay blocks, a CPI deadband, leftover-power options, three-year notice. The
              rejected MOU’s ¢ path is on this table only so nobody treats it as current. Illustrative
              MOU cents are never presented as signed offtake.
            </p>
          </section>

          <section className="mt-16">
            <h2 className="desk-h2">
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

          <div className="mt-10 overflow-x-auto border border-[var(--border-subtle)]">
            <table className="w-full min-w-[32rem] text-left text-[14px]">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-1)] desk-fact uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  <th className="px-4 py-3 font-medium">Marker</th>
                  <th className="px-4 py-3 font-medium">Figure</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {COST_MARKERS.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--border-subtle)] last:border-b-0">
                    <td className="px-4 py-3 text-[var(--text-primary)]">{row.label}</td>
                    <td className="desk-fact px-4 py-3 text-[13px] text-[var(--text-primary)]">
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

          <div className="mt-10 grid gap-3">
            {COST_MARKERS.map((row) => (
              <section
                key={row.id}
                id={row.id}
                className="desk-surface p-6 sm:p-7"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StatusPill status={row.status} />
                  <span className="desk-fact text-[13px] text-[var(--text-primary)]">
                    {row.value}
                    {row.unit ? ` ${row.unit}` : ""}
                  </span>
                </div>
                <h3 className="desk-h3 mt-4">{row.label}</h3>
                <LeadTakeaway className="mt-3">{row.note.plain}</LeadTakeaway>
                <Receipts
                  summary="Receipts — cites and schedule names"
                  sources={row.sources.map((id) => DESK_SOURCES[id])}
                >
                  <p>{row.note.technical}</p>
                  <p className="mt-3 desk-fact text-[var(--text-muted)]">
                    Last verified {row.lastVerified}
                  </p>
                </Receipts>
              </section>
            ))}
          </div>

          <section
            id="schedule-era"
            className="desk-surface mt-10 p-6 sm:p-7"
          >
            <p className="desk-fact uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Schedule-era — not current
            </p>
            <h3 className="desk-h3 mt-4">
              Older Labrador Industrial PDF (2015 figures)
            </h3>
            <LeadTakeaway className="mt-3">{COST_ERA_NOTE.body.plain}</LeadTakeaway>
            <Receipts
              summary="Receipts — 2015 figures, not current"
              sources={COST_ERA_NOTE.sources.map((id) => DESK_SOURCES[id])}
            >
              <p>{COST_ERA_NOTE.body.technical}</p>
              <p className="mt-3 desk-fact text-[var(--text-muted)]">
                Last verified {COST_ERA_NOTE.lastVerified}
              </p>
            </Receipts>
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
