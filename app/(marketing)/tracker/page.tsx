import Link from "next/link";
import { DeskPage, DeskSection } from "@/components/marketing/shell";
import { Fig, Term, Unfold, WalkLaunch } from "@/components/marketing/depth";
import { TrackerBoard } from "@/components/marketing/desk";
import { AnnexRamp, GateClock, UnknownBoard } from "@/components/marketing/instruments";
import { DESK_SOURCES, TRACKER_ITEMS } from "@/lib/desk";
import { deskMetadata } from "@/lib/og/metadata";

export const metadata = deskMetadata({
  title: "Tracker",
  description:
    "Living board for the Churchill Falls / Gull Island framework: what is signed, what is open, and what the public text still does not say. Framework, not binding contracts. Mining first.",
  path: "/tracker",
});

export default function TrackerPage() {
  const unknown = TRACKER_ITEMS.filter((i) => i.status === "unknown");
  return (
    <DeskPage
      kicker="Churchill River desk · Tracker"
      title={
        <>
          What&apos;s signed. What&apos;s open. <em>What we still mark unknown.</em>
        </>
      }
      lede={
        <Unfold
          id="tracker-lede"
          label="21–18"
          plain={
            <p>
              August&apos;s cooperation agreement is a <Term k="framework">framework</Term>. The
              September House vote (<Fig id="a">21–18</Fig>) is a political yes. The contracts that
              lock the power are still ahead, and the Premier has not promised MHAs a vote on them.
            </p>
          }
          technical="Living board for the 17 August 2026 DCIA and the 17 September House endorsement. Material Terms are the drafting basis for Definitive Agreements targeted around 31 December 2026 (Art. 2.1); the instrument's Term runs to 31 March 2027 unless extended (§6.3). On 18 September the Premier said the deal returns to the House before definitive agreements but would not commit to a vote. Open People is not a DCIA party."
          sources={[DESK_SOURCES.dciaHq, DESK_SOURCES.ntvVote, DESK_SOURCES.ircBriefing]}
        />
      }
      meta={
        <p className="text-sm text-[var(--ink-3)]">
          Primary PDFs:{" "}
          <a href={DESK_SOURCES.dciaHq.href} className="desk-link" target="_blank" rel="noreferrer">
            Hydro-Québec DCIA
          </a>
          {" · "}
          <a href={DESK_SOURCES.dciaNl.href} className="desk-link" target="_blank" rel="noreferrer">
            NL copy
          </a>
          {" · "}
          <a href={DESK_SOURCES.ircBriefing.href} className="desk-link" target="_blank" rel="noreferrer">
            IRC technical briefing
          </a>
          .
        </p>
      }
      actions={<WalkLaunch />}
      hero={
        <>
          <GateClock compact />
          <div className="mt-10">
            <UnknownBoard />
          </div>
        </>
      }
      sections={[
        { id: "board", label: "The board" },
        { id: "ramp", label: "Annex B ramp" },
        { id: "corrections", label: "Corrections" },
      ]}
      walkthrough={{
        title: "Walk the unknowns",
        steps: [
          ...unknown.map((item) => ({
            anchor: item.id,
            text: item.body.plain,
            unfold: `row-${item.id}`,
          })),
          {
            anchor: "ramp",
            text: "And the timeline for new megawatts: a decade out, and preliminary.",
          },
        ],
      }}
    >
      <DeskSection id="board" wide>
        <TrackerBoard items={TRACKER_ITEMS} />
      </DeskSection>

      <DeskSection
        id="ramp"
        num="Annex B"
        title="New megawatts are a decade out. The contracts are months out."
        wide
      >
        <div data-rise>
          <AnnexRamp />
        </div>
      </DeskSection>

      <DeskSection id="corrections">
        <p className="text-sm leading-relaxed text-[var(--ink-3)]">
          Civic watchlist / moderated wall is not this page. Corrections:{" "}
          <a href="mailto:tom@openpeople.ai" className="desk-link">
            tom@openpeople.ai
          </a>
          . Also:{" "}
          <Link href="/industries" className="desk-link">
            Industries
          </Link>
          {" · "}
          <Link href="/costs" className="desk-link">
            Costs
          </Link>
          {" · "}
          <Link href="/brief" className="desk-link">
            Evidence brief
          </Link>
          .
        </p>
      </DeskSection>
    </DeskPage>
  );
}
