import type { Metadata } from "next";
import Link from "next/link";
import SiteShell from "@/components/marketing/SiteShell";
import { Dual, ScaleAnchor } from "@/components/marketing/voice";
import { DeskKicker, DeskVerified, TrackerBoard } from "@/components/marketing/desk";
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
      <main className="desk-page pb-24 sm:pb-32">
        <DeskVerified date={DESK_VERIFIED} sticky />
        <article className="mx-auto max-w-[1080px] px-4 pt-10 sm:px-6 sm:pt-14">
          <DeskKicker>Horizon desk · Tracker</DeskKicker>
          <h1 className="desk-h1 mt-5 max-w-[22ch]">
            What’s signed. What’s open. What we still mark UNKNOWN.
          </h1>
          <div className="max-w-[780px]">
            <Dual
              plain={
                <p className="mt-8 text-lg leading-relaxed text-[var(--text-secondary)]">
                  This is a living board for the Churchill River paper — not a campaign sermon, and
                  not a data-centre pitch. August’s cooperation agreement is a framework. The
                  September House vote is a political yes. The contracts that lock the power are
                  still ahead.
                </p>
              }
              technical={
                <p className="mt-8 text-lg leading-relaxed text-[var(--text-secondary)]">
                  Living board for the 17 August 2026 DCIA and the 17 September House endorsement.
                  Material Terms are the drafting basis for Definitive Agreements targeted around 31
                  December 2026; the instrument can run to 31 March 2027. Open People is not a DCIA
                  party.
                </p>
              }
            />
            <p className="mt-6 text-sm text-[var(--text-muted)]">
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
          </div>

          <div className="mt-14">
            <TrackerBoard
              items={TRACKER_ITEMS}
              extras={{
                "gull-island": (
                  <ScaleAnchor
                    className="mt-3 text-[14px] leading-relaxed text-[var(--text-secondary)]"
                    technical={SCALE_ANCHORS.gulIslandRange.technical}
                    plain={SCALE_ANCHORS.gulIslandRange.plain}
                    source={SCALE_ANCHORS.gulIslandRange.source}
                  />
                ),
              }}
            />
          </div>

          <p className="mt-14 max-w-[780px] text-sm leading-relaxed text-[var(--text-muted)]">
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
