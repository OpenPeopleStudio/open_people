import type { Metadata } from "next";
import Link from "next/link";
import SiteShell from "@/components/marketing/SiteShell";
import { Dual, ScaleAnchor } from "@/components/marketing/voice";
import { DeskKicker, DeskVerified, SourceLinks, StatusPill } from "@/components/marketing/desk";
import {
  COMPUTE_SECONDARY_LINE,
  DESK_SOURCES,
  DESK_VERIFIED,
  INDUSTRY_CARDS,
} from "@/lib/desk";
import { SCALE_ANCHORS } from "@/lib/voice-mode";

export const metadata: Metadata = {
  title: "Industries",
  description:
    "Mining and Labrador industry first. Sourced cards for Labrador West load and the transmission corridor. Compute is a short secondary line.",
  alternates: { canonical: "/industries" },
};

export default function IndustriesPage() {
  return (
    <SiteShell>
      <main className="px-4 pb-20 pt-28 sm:px-6 sm:pb-28 sm:pt-36">
        <article className="mx-auto max-w-[780px]">
          <DeskKicker>Horizon desk · Industries</DeskKicker>
          <h1 className="mt-4 font-display text-[2rem] font-normal leading-[1.1] tracking-[-0.02em] sm:text-5xl">
            Mining first. Other industry only if cited. Compute last, and short.
          </h1>
          <Dual
            plain={
              <p className="mt-6 text-lg leading-relaxed text-[var(--text-secondary)]">
                Firm power this province keeps should serve loads that already live in Labrador —
                mines, towns, the corridor between Churchill Falls and Labrador West. We do not
                invent a second industrial class to dress a campus.
              </p>
            }
            technical={
              <p className="mt-6 text-lg leading-relaxed text-[var(--text-secondary)]">
                In-province industrial use is the public framing of DCIA retain capacity. Cards
                below use PUB/NL Hydro or reputable press. Mining MW figures without a primary or
                reputable press cite are omitted. Hydrogen, ammonia, and other uncited industry
                are not listed.
              </p>
            }
          />
          <DeskVerified date={DESK_VERIFIED} />

          <div className="mt-12 grid gap-4">
            {INDUSTRY_CARDS.map((card) => (
              <section
                key={card.id}
                className="rounded border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <StatusPill status={card.rank} />
                  {card.figure ? (
                    <span className="font-mono text-[13px] text-[var(--plasma)]">{card.figure}</span>
                  ) : null}
                </div>
                <h2 className="mt-3 font-display text-2xl font-normal tracking-[-0.018em]">
                  {card.title}
                </h2>
                {card.id === "labrador-west-mining" ? (
                  <ScaleAnchor
                    className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]"
                    technical={SCALE_ANCHORS.miningLoad.technical}
                    plain={SCALE_ANCHORS.miningLoad.plain}
                    source={SCALE_ANCHORS.miningLoad.source}
                  />
                ) : (
                  <ScaleAnchor
                    className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]"
                    technical={card.body.technical}
                    plain={card.body.plain}
                    source={`Last verified ${card.lastVerified}`}
                  />
                )}
                {card.figureNote ? (
                  <p className="mt-3 font-mono text-[11px] leading-relaxed text-[var(--text-muted)]">
                    {card.figureNote}
                  </p>
                ) : null}
                <SourceLinks sources={card.sources.map((id) => DESK_SOURCES[id])} />
              </section>
            ))}
          </div>

          <aside className="mt-10 rounded border border-[var(--border-subtle)] border-l-2 border-l-[var(--plasma)] bg-[var(--plasma-soft)] p-5 sm:p-6">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--plasma)]">
              Secondary · not the opener
            </p>
            <ScaleAnchor
              className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]"
              technical={COMPUTE_SECONDARY_LINE.technical}
              plain={COMPUTE_SECONDARY_LINE.plain}
              source={SCALE_ANCHORS.computeOptional.source}
            />
            <Link
              href="/compute"
              className="mt-4 inline-flex font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--plasma)] no-underline hover:underline"
            >
              Compute plan (quarantined) →
            </Link>
          </aside>

          <p className="mt-12 text-sm text-[var(--text-muted)]">
            Other cited industry only when a primary or reputable press source exists. None added
            this slice (Voisey’s Bay / Vale MW not restated without a current cite).{" "}
            <Link href="/tracker" className="text-[var(--plasma)] no-underline hover:underline">
              Tracker
            </Link>
            {" · "}
            <Link href="/costs" className="text-[var(--plasma)] no-underline hover:underline">
              Costs
            </Link>
            .
          </p>
        </article>
      </main>
    </SiteShell>
  );
}
