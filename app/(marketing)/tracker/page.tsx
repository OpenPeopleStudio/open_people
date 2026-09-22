import type { Metadata } from "next";
import Link from "next/link";
import SiteShell from "@/components/marketing/SiteShell";
import { Dual, ScaleAnchor } from "@/components/marketing/voice";
import { DeskKicker, DeskVerified, SourceLinks, StatusPill } from "@/components/marketing/desk";
import { DESK_SOURCES, DESK_VERIFIED, TRACKER_ITEMS } from "@/lib/desk";
import { SCALE_ANCHORS } from "@/lib/voice-mode";

export const metadata: Metadata = {
  title: "Tracker",
  description:
    "Living board for the Churchill Falls / Gull Island DCIA: what’s signed, what’s open, and what stays UNKNOWN. Framework, not binding PPAs. Mining first.",
  alternates: { canonical: "/tracker" },
};

export default function TrackerPage() {
  return (
    <SiteShell>
      <main className="px-4 pb-20 pt-28 sm:px-6 sm:pb-28 sm:pt-36">
        <article className="mx-auto max-w-[780px]">
          <DeskKicker>Horizon desk · Tracker</DeskKicker>
          <h1 className="mt-4 font-display text-[2rem] font-normal leading-[1.1] tracking-[-0.02em] sm:text-5xl">
            What’s signed. What’s open. What we still mark UNKNOWN.
          </h1>
          <Dual
            plain={
              <p className="mt-6 text-lg leading-relaxed text-[var(--text-secondary)]">
                This is a living board for the Churchill River paper — not a campaign sermon, and
                not a data-centre pitch. August’s cooperation agreement is a framework. The
                September House vote is a political yes. The contracts that lock the power are
                still ahead.
              </p>
            }
            technical={
              <p className="mt-6 text-lg leading-relaxed text-[var(--text-secondary)]">
                Living board for the 17 August 2026 DCIA and the 17 September House endorsement.
                Material Terms are the drafting basis for Definitive Agreements targeted around 31
                December 2026; the instrument can run to 31 March 2027. Open People is not a DCIA
                party.
              </p>
            }
          />
          <DeskVerified date={DESK_VERIFIED} />
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            Primary PDFs:{" "}
            <a
              href={DESK_SOURCES.dciaHq.href}
              className="text-[var(--plasma)] no-underline hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Hydro-Québec DCIA
            </a>
            {" · "}
            <a
              href={DESK_SOURCES.dciaNl.href}
              className="text-[var(--plasma)] no-underline hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              NL copy
            </a>
            {" · "}
            <a
              href={DESK_SOURCES.ircBriefing.href}
              className="text-[var(--plasma)] no-underline hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              IRC technical briefing
            </a>
            .
          </p>

          <div className="mt-12 grid gap-4">
            {TRACKER_ITEMS.map((item) => (
              <section
                key={item.id}
                id={item.id}
                className="rounded border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <StatusPill status={item.status} />
                  <span className="font-mono text-[11px] text-[var(--text-muted)]">{item.when}</span>
                </div>
                <h2 className="mt-3 font-display text-2xl font-normal tracking-[-0.018em]">
                  {item.title}
                </h2>
                <ScaleAnchor
                  className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]"
                  technical={item.body.technical}
                  plain={item.body.plain}
                  source={`Last verified ${item.lastVerified}`}
                />
                {item.id === "gull-island" ? (
                  <ScaleAnchor
                    className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]"
                    technical={SCALE_ANCHORS.gulIslandRange.technical}
                    plain={SCALE_ANCHORS.gulIslandRange.plain}
                    source={SCALE_ANCHORS.gulIslandRange.source}
                  />
                ) : null}
                <SourceLinks sources={item.sources.map((id) => DESK_SOURCES[id])} />
                {item.href ? (
                  <p className="mt-3">
                    <a
                      href={item.href}
                      className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--plasma)] no-underline hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.hrefLabel ?? "Primary document"} →
                    </a>
                  </p>
                ) : null}
              </section>
            ))}
          </div>

          <p className="mt-12 text-sm leading-relaxed text-[var(--text-muted)]">
            Civic watchlist / moderated wall is not this page — deferred. Corrections:{" "}
            <a href="mailto:tom@openpeople.ai" className="text-[var(--plasma)] no-underline hover:underline">
              tom@openpeople.ai
            </a>
            . Also:{" "}
            <Link href="/industries" className="text-[var(--plasma)] no-underline hover:underline">
              Industries
            </Link>
            {" · "}
            <Link href="/costs" className="text-[var(--plasma)] no-underline hover:underline">
              Costs
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
