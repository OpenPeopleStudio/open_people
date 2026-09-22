import type { Metadata } from "next";
import { deskMeta } from "@/lib/og";
import Link from "next/link";
import { DeskPage, DeskSection } from "@/components/marketing/shell";
import { Fig, Figure, Term, Unfold } from "@/components/marketing/depth";
import { StatusPill } from "@/components/marketing/desk";
import { CorridorSchematic, FlowBars } from "@/components/marketing/instruments";
import { COMPUTE_SECONDARY_LINE, DESK_SOURCES, INDUSTRY_CARDS } from "@/lib/desk";
import { SCALE_ANCHORS } from "@/lib/voice-mode";

export const metadata: Metadata = deskMeta({
  title: "Industries",
  description:
    "Mining and Labrador industry first. Megawatts drawn by how hard the number is; the corridor the mines need; sourced cards for Labrador West load. Compute is a short secondary line.",
  path: "/industries",
});

export default function IndustriesPage() {
  return (
    <DeskPage
      kicker="Churchill River desk · Industries"
      title={
        <>
          Mining first. <em>Then the wire.</em> Compute last, and short.
        </>
      }
      lede={
        <Unfold
          id="industries-lede"
          label="~312 MW"
          plain={
            <p>
              <Term k="firm-power">Firm power</Term> this province keeps should serve loads that
              already live in Labrador: mines, towns, the corridor between Churchill Falls and
              Labrador West. The mines already use about <Fig id="a">312 MW</Fig> of the roughly{" "}
              <Fig id="b">525 MW</Fig> Hydro has for Labrador today. We do not invent a second
              industrial class to dress a campus.
            </p>
          }
          technical={SCALE_ANCHORS.miningLoad.technical}
          sources={[DESK_SOURCES.cbcMining, DESK_SOURCES.nlhLabWest, DESK_SOURCES.dciaHq]}
        />
      }
      hero={<FlowBars />}
      sections={[
        { id: "corridor", label: "The corridor" },
        { id: "cards", label: "Mining first" },
        { id: "compute", label: "Compute (secondary)" },
      ]}
    >
      <DeskSection
        id="corridor"
        num="01 — The corridor"
        title="Hydro's own study says the west lines are at their limit."
        intro={
          <p>
            A bigger line is the mining-first piece of steel. August&apos;s announcement attaches
            money. Engineering and permits are under way this fall. In-service date: not published.
          </p>
        }
        wide
      >
        <div data-rise>
          <CorridorSchematic />
        </div>
      </DeskSection>

      <DeskSection id="cards" num="02 — Mining first" title="Sourced cards. Nothing uncited." wide>
        <div className="grid gap-4">
          {INDUSTRY_CARDS.map((card) => (
            <section key={card.id} id={card.id} className="desk-surface p-6 sm:p-7" data-rise>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <StatusPill status={card.rank} />
                  <h2 className="desk-h3 mt-3">{card.title}</h2>
                </div>
                {card.figure ? (
                  <Figure
                    value={card.figure}
                    status={card.rank === "first" ? "reported" : "cited"}
                    size="md"
                    sources={card.sources.map((id) => DESK_SOURCES[id])}
                    lastVerified={card.lastVerified}
                    note={card.figureNote}
                  />
                ) : null}
              </div>
              <Unfold
                id={`card-${card.id}`}
                className="mt-4"
                label={card.figure}
                plain={<p className="desk-takeaway">{card.body.plain}</p>}
                technical={
                  <>
                    <p>{card.body.technical}</p>
                    {card.figureNote ? <p className="desk-fact mt-3 text-[var(--ink-3)]">{card.figureNote}</p> : null}
                    <p className="desk-fact mt-3 text-[var(--ink-3)]">Last verified {card.lastVerified}</p>
                  </>
                }
                sources={card.sources.map((id) => DESK_SOURCES[id])}
              />
            </section>
          ))}
        </div>
        <p className="mt-10 text-sm text-[var(--ink-3)]">
          Other cited industry only when a primary or reputable press source exists. None added this
          pass (Voisey&apos;s Bay / Vale MW not restated without a current cite).
        </p>
      </DeskSection>

      <DeskSection id="compute" num="Secondary — not the opener" title={undefined}>
        <aside className="border-l-2 border-[var(--steel)] bg-[var(--steel-soft)] p-5 sm:p-6">
          <p className="desk-kicker" style={{ color: "var(--steel)" }}>
            Secondary · not the opener
          </p>
          <Unfold
            id="compute-line"
            className="mt-3"
            label="compute"
            plain={<p className="desk-takeaway">{COMPUTE_SECONDARY_LINE.plain}</p>}
            technical={COMPUTE_SECONDARY_LINE.technical}
            sources={[DESK_SOURCES.dciaHq]}
          />
          <Link href="/compute" className="desk-kicker mt-4 inline-flex no-underline hover:underline" style={{ color: "var(--steel)" }}>
            Compute plan (separate page) →
          </Link>
        </aside>
        <p className="mt-8 text-sm text-[var(--ink-3)]">
          <Link href="/tracker" className="desk-link">
            Tracker
          </Link>
          {" · "}
          <Link href="/costs" className="desk-link">
            Costs
          </Link>
          .
        </p>
      </DeskSection>
    </DeskPage>
  );
}
