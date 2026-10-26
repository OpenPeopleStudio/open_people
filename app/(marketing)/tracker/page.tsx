import Link from "next/link";
import { DeskPage, DeskSection } from "@/components/marketing/shell";
import { Fig, Term, Unfold, WalkLaunch } from "@/components/marketing/depth";
import { TrackerBoard } from "@/components/marketing/desk";
import { AnnexRamp, GateClock, UnknownBoard } from "@/components/marketing/instruments";
import { DESK_SOURCES, TRACKER_ITEMS } from "@/lib/desk";
import { deskMetadata } from "@/lib/og/metadata";

export const metadata = deskMetadata({
  title: "Churchill Falls tracker",
  description:
    "Open People publishes what is signed, what is open, and what the public text still does not say on Churchill Falls / Gull Island. Framework, not binding contracts. Mining first.",
  path: "/tracker",
});

export default function TrackerPage() {
  const unknown = TRACKER_ITEMS.filter((i) => i.status === "unknown");
  return (
    <DeskPage
      kicker="Open People · Tracker"
      title={
        <>
          What&apos;s signed. What&apos;s open. <em>What we still cannot say.</em>
        </>
      }
      lede={
        <Unfold
          id="tracker-lede"
          label="21–18"
          plain={
            <p>
              Open People publishes this board so the blanks stay visible before the contracts lock.
              August&apos;s cooperation agreement is a <Term k="framework">framework</Term>. The
              September House vote (<Fig id="a">21–18</Fig>) is a political yes. The contracts that
              lock the power are still ahead, and the Premier has not promised MHAs a vote on them.
              When you want a blank filled in, go to{" "}
              <Link href="/engage" className="desk-link">
                Engage
              </Link>
              .
            </p>
          }
          technical="Open People’s public board for the 17 August 2026 DCIA and the 17 September House endorsement. Material Terms are the drafting basis for Definitive Agreements targeted around 31 December 2026 (Art. 2.1); the instrument's Term runs to 31 March 2027 unless extended (§6.3). NL Hydro's CEO says those material terms will not be reopened; about 17–18 definitive agreements are still being finished. The 31 December target is a goal — Saltwire/Telegram, 9 Oct, quoting Parrott, said slipping it is not the end of the world. Québec elected a PQ minority on 5 October; cabinet 21 October; National Assembly 17 November. On 18 September the Premier said the deal returns to the House before definitive agreements but would not commit to a vote. Open People is not a DCIA party."
          sources={[
            DESK_SOURCES.dciaHq,
            DESK_SOURCES.ntvVote,
            DESK_SOURCES.cbcWilliamsTerms,
            DESK_SOURCES.saltwireParrott,
            DESK_SOURCES.qcElectionResult,
            DESK_SOURCES.lactualiteTransition,
          ]}
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
            text: "New megawatts are a decade out, and preliminary. The contracts are not.",
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
          This is Open People’s public board, not a comment wall. Corrections:{" "}
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
