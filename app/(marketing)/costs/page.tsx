import type { Metadata } from "next";
import { deskMeta } from "@/lib/og";
import Link from "next/link";
import { DeskPage, DeskSection } from "@/components/marketing/shell";
import { Fig, Figure, Term, Unfold, WalkLaunch } from "@/components/marketing/depth";
import { ContestedRateStrip, StatusPill } from "@/components/marketing/desk";
import { DefaultPath, PriceLadder } from "@/components/marketing/instruments";
import {
  COST_ERA_NOTE,
  COST_INTRO,
  COST_MARKERS,
  DESK_SOURCES,
} from "@/lib/desk";
import { SCALE_ANCHORS } from "@/lib/voice-mode";

export const metadata: Metadata = deskMeta({
  title: "Costs",
  description:
    "Seven price families on one ladder, labelled, not merged. Starts about 1.8¢/kWh in 2027; averages about 7.4¢/kWh over 50 years; heritage 0.2¢; Labrador household 3.154¢; the mine rate is a formula; the signed industrial rate is not published.",
  path: "/costs",
});

export default function CostsPage() {
  return (
    <DeskPage
      kicker="Churchill River desk · Costs"
      title={
        <>
          Seven price stories. <em>One ladder. Nothing merged.</em>
        </>
      }
      lede={
        <Unfold
          id="costs-lede"
          label="the seven families"
          plain={<p>{COST_INTRO.body.plain}</p>}
          technical={COST_INTRO.body.technical}
          sources={[DESK_SOURCES.dciaHq, DESK_SOURCES.nlhRates2026, DESK_SOURCES.cpChurchillGraph]}
        />
      }
      actions={<WalkLaunch />}
      hero={<PriceLadder />}
      sections={[
        { id: "contested", label: "Two public prices" },
        { id: "heritage", label: "Heritage" },
        { id: "structure", label: "Structure" },
        { id: "published", label: "Published Labrador rates" },
        { id: "markers", label: "All markers" },
        { id: "schedule-era", label: "Schedule-era note" },
      ]}
      walkthrough={{
        title: "Walk the price families",
        steps: [
          {
            anchor: "contested",
            text: "Two numbers get quoted for the new export price. One is the 2027 start, one is the fifty-year average. They are not a contradiction.",
            unfold: "contested-start",
          },
          {
            anchor: "heritage",
            text: "Two mills is the old export price. It explains the anger. It is not a rate anyone here can buy at today.",
            unfold: "heritage-unfold",
          },
          {
            anchor: "structure",
            text: "The new paper pays target dollars nudged by inflation. Nobody has published how that becomes an industrial cent.",
            unfold: "marker-dcia-hq-payments",
          },
          {
            anchor: "published",
            text: "What Hydro actually posts today: a household rate for Labrador, and a formula for mines.",
            unfold: "marker-lab-ind-1",
          },
          {
            anchor: "markers",
            text: "And the one that matters for any new load: the signed industrial cent for retained power. Not published.",
            unfold: "marker-dcia-industrial-alloc",
          },
        ],
      }}
    >
      <DeskSection id="contested" wide>
        <ContestedRateStrip />
      </DeskSection>

      <DeskSection id="heritage" num="01 — Heritage" title="Two mills.">
        <Unfold
          id="heritage-unfold"
          label="0.2¢"
          plain={
            <p className="desk-takeaway">
              The old Hydro-Québec renewal price is <Fig id="a">two <Term k="mill">mills</Term></Fig>,
              two tenths of a cent. It is lore about what left the border, not a rate anyone here can
              buy power at today.
            </p>
          }
          technical={SCALE_ANCHORS.heritagePrice.technical}
          sources={[DESK_SOURCES.heritage1969, DESK_SOURCES.feehanBaker, DESK_SOURCES.policyOptions2010]}
        />
      </DeskSection>

      <DeskSection
        id="structure"
        num="02 — Structure"
        title="Not a locked ¢ schedule."
        intro={
          <p>
            The <Term k="material-terms">Material Terms</Term> describe how later{" "}
            <Term k="ppa">PPAs</Term> are supposed to be built: an{" "}
            <Term k="availability-contract">availability contract</Term> for Hydro-Québec,{" "}
            <Term k="take-or-pay">take-or-pay</Term> for NL Hydro, a{" "}
            <Term k="cpi-deadband">CPI deadband</Term>, leftover-power options, three-year notice.
            The rejected MOU&apos;s ¢ path is on this page only so nobody treats it as current.
          </p>
        }
        wide
      >
        <div data-rise>
          <DefaultPath />
        </div>
      </DeskSection>

      <DeskSection
        id="published"
        num="03 — Published Labrador rates"
        title="A household cent, and a formula for mines."
      >
        <Unfold
          id="published-unfold"
          label="3.154¢"
          plain={
            <p className="desk-takeaway">
              Hydro posts <Fig id="a">3.154¢/kWh</Fig> for households on the Labrador
              interconnected grid. Mines are on <Term k="lab-ind-1">LAB-IND-1</Term>: demand
              charges plus a monthly firm-energy formula. This desk does not collapse that into one
              cent.
            </p>
          }
          technical={
            <>
              <p>
                NL Hydro current-rates page (the live URL path is spelled “electicity”): “For customers
                on the Labrador Interconnected System, the current rate is 3.154 cents per kWh.” July
                2026 Schedule, Rate No. 1.1L Domestic (LAB-1), effective 1 July 2026: energy 3.154¢/kWh
                plus basic customer charge $6.87/month (1.5% prompt-pay discount).
              </p>
              <p>
                LAB-IND-1, July 2026: transmission demand charge $1.08/kW-month (closed rate, existing
                customers only); generation demand charge $0.41/kW-month; firm energy{" "}
                <span className="desk-cite">RFIRM</span> = {"{"}(ED × RD) + (EM × RM){"}"} / ETOTAL, with RD
                (Development Block) $29.22/MWh and RM (Market Block) $78.61/MWh for calendar 2026, RM set
                from NYISO Zone A settlement prices. Formula inputs, not one industrial ¢.
              </p>
            </>
          }
          sources={[DESK_SOURCES.nlhCurrentRates, DESK_SOURCES.nlhRates2026]}
        />
      </DeskSection>

      <DeskSection id="markers" num="04 — All markers" title="Every price on this desk, with its status." wide>
        <div className="grid gap-3">
          {COST_MARKERS.map((row) => (
            <section key={row.id} id={row.id} className="desk-surface p-6 sm:p-7" data-rise
              style={{ scrollMarginTop: "calc(var(--desk-nav-offset) + 1rem)" }}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <StatusPill status={row.status} />
                  <h3 className="desk-h3 mt-3">{row.label}</h3>
                </div>
                <Figure
                  value={row.value}
                  unit={row.unit || undefined}
                  status={row.status}
                  size="md"
                  sources={row.sources.map((id) => DESK_SOURCES[id])}
                  lastVerified={row.lastVerified}
                  note={row.note.plain}
                />
              </div>
              <Unfold
                id={`marker-${row.id}`}
                className="mt-4"
                label={row.status === "unknown" ? "why it is blank" : row.value}
                plain={<p className="desk-takeaway">{row.note.plain}</p>}
                technical={
                  <>
                    <p>{row.note.technical}</p>
                    <p className="desk-fact mt-3 text-[var(--ink-3)]">Last verified {row.lastVerified}</p>
                  </>
                }
                sources={row.sources.map((id) => DESK_SOURCES[id])}
              />
            </section>
          ))}
        </div>
      </DeskSection>

      <DeskSection id="schedule-era" num="Schedule-era — not current" title="Older Labrador Industrial PDF (2015 figures)">
        <Unfold
          id="era-unfold"
          label="the 2015 figures"
          plain={<p className="desk-takeaway">{COST_ERA_NOTE.body.plain}</p>}
          technical={COST_ERA_NOTE.body.technical}
          sources={COST_ERA_NOTE.sources.map((id) => DESK_SOURCES[id])}
        />
        <p className="mt-10 text-sm leading-relaxed text-[var(--ink-3)]">
          Island retail on older campaign copy (“11–13¢ delivered”) matches Newfoundland Power&apos;s
          tail-block general-service energy charges only; first-block and demand-inclusive bills run
          higher, roughly 11–15¢ before demand charges and HST. Not a Labrador rate and not a locked
          PUB figure here. Hydro&apos;s current-rates page quotes 15.587¢ first-block for Island
          Interconnected and isolated diesel domestic; that is not Labrador. Binding DCIA industrial
          cents remain not published.
        </p>
        <p className="mt-6 text-sm text-[var(--ink-3)]">
          <Link href="/tracker" className="desk-link">
            Tracker
          </Link>
          {" · "}
          <Link href="/industries" className="desk-link">
            Industries
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
