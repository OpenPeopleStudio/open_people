import type { Metadata } from "next";
import { deskMeta } from "@/lib/og";
import Link from "next/link";
import { DeskPage, DeskSection } from "@/components/marketing/shell";
import { Fig, Figure, Term, Unfold, WalkLaunch } from "@/components/marketing/depth";
import { StatusPill } from "@/components/marketing/desk";
import {
  CorridorSchematic,
  DefaultPath,
  FlowBars,
  GateClock,
  PriceLadder,
} from "@/components/marketing/instruments";
import {
  COMPUTE_NEIGHBOURS,
  COST_MARKERS,
  DESK_SOURCES,
  DESK_VERIFIED,
  FLOW_BARS,
  GATES,
  INDUSTRY_CARDS,
  LADDER_POINTS,
  TRACKER_ITEMS,
  sourceList,
  type CostMarker,
  type DeskItem,
  type DeskSourceId,
  type FlowBar,
  type Gate,
  type LadderPoint,
} from "@/lib/desk";
import { SCALE_ANCHORS } from "@/lib/voice-mode";

export const metadata: Metadata = deskMeta({
  title: "Labrador power & industry case",
  description:
    "Firm in-province power for Labrador and Newfoundland industry first. The Churchill Falls / Gull Island DCIA is a framework, not binding PPAs. Compute is a separate page.",
  path: "/brief",
  type: "article",
});

/* ── data lookups: every number on this page is bound to a lib/desk object ── */

function tracker(id: string): DeskItem {
  const row = TRACKER_ITEMS.find((i) => i.id === id);
  if (!row) throw new Error(`brief: tracker row "${id}" is missing`);
  return row;
}

function gate(id: string): Gate {
  const g = GATES.find((i) => i.id === id);
  if (!g) throw new Error(`brief: gate "${id}" is missing`);
  return g;
}

function marker(id: string): CostMarker {
  const m = COST_MARKERS.find((i) => i.id === id);
  if (!m) throw new Error(`brief: cost marker "${id}" is missing`);
  return m;
}

function bar(id: string): FlowBar {
  const b = FLOW_BARS.find((i) => i.id === id);
  if (!b) throw new Error(`brief: flow bar "${id}" is missing`);
  return b;
}

function rung(id: string): LadderPoint {
  const p = LADDER_POINTS.find((i) => i.id === id);
  if (!p) throw new Error(`brief: ladder point "${id}" is missing`);
  return p;
}

const DCIA = tracker("dcia");
const HOUSE = tracker("house");
const HOUSE_RETURN = tracker("house-return");
const BINDING = tracker("binding-window");
const QC = tracker("qc-gate");
const LAB_WEST = tracker("labrador-west");
const INNU = tracker("innu");
const WIND = tracker("wind-spe");
const UNUSED = tracker("unused-retain");
const DOMESTIC = tracker("domestic-load");

const RETAIN = bar("retain");
const WIND_BAR = bar("wind");

const HERITAGE = marker("heritage-mills");
const MOU_PATH = marker("mou-irc-path");
const REPORTED_PATH = marker("reported-export-path");
const SIGNED_UNKNOWN = marker("dcia-industrial-alloc");
const QC_RATE = rung("qc-13");

const NAMED_MINERALS = INDUSTRY_CARDS.find((c) => c.id === "named-minerals");

/** Registry sources cited on this page, for the sources section. */
const PAGE_SOURCES: DeskSourceId[] = [
  "dciaHq",
  "dciaNl",
  "govNlDcia",
  "canadaDcia",
  "ircReport",
  "ircBriefing",
  "cpChurchillGraph",
  "rciPricePath",
  "financialPostPath",
  "hqDciaSix",
  "vocmVote",
  "ntvVote",
  "vocmOpposition",
  "ndpConditions",
  "vocmPerry",
  "qcElection",
  "radioCanadaQcOpposition",
  "globeQc",
  "vocmInnu",
  "vocmInnuContact",
  "vocmInnuReady",
  "saltwireInnu",
  "radioCanadaInnu",
  "vocmInnuWaterway",
  "vocmRussell",
  "aptnQcInnu",
  "cbcIaac",
  "powerAdvisory",
  "nlhLabWest",
  "cbcMining",
  "nlhRates2026",
  "nlhCurrentRates",
  "heritage1969",
  "feehanBaker",
  "policyOptions2010",
  "cerNl",
  "cerRenewables",
  "hqDataCentreTariff",
  "aesoCap",
];

const KIND_LABEL: Record<string, string> = {
  primary: "Primary documents and releases",
  regulator: "Regulators",
  utility: "Utility schedules and pages",
  press: "Press",
  scholarship: "Scholarship and analysis",
};

/* ── the five asks: Open People copy, never Figures ─────────────────────── */

const ASKS = [
  {
    title: "A named block",
    body: "A scheduled allocation of Labrador capacity eligible for industrial load, including compute, drawn from the publicly framed retain from Churchill Falls and Gull Island (section 02), plus wind if built. No firm megawatts, price or queue for Labrador compute is confirmed. An illustrative first tranche of 100–150 MW, as new generation phases in, is our ask. It is not a government figure.",
  },
  {
    title: "A transparent tariff",
    body: "A published firm industrial rate, indicatively in the 4–6¢/kWh range, plus full network-addition cost causation. High enough to be unimpeachable after Muskrat Falls. Low enough to beat the data-centre rate Québec has proposed (section 05). The band is ours, not a posted rate.",
  },
  {
    title: "Allocation criteria that keep the value home",
    body: "Score for NL majority ownership, Indigenous equity participation, creditworthy offtake, local employment and balance-sheet substance. Criteria, not a ban, are the durable answer to the Great North Data experience.",
  },
  {
    title: "An infrastructure audit",
    body: "Direct NL Hydro to publish Labrador dark-fibre capacity and recall-block headroom, and commission a diverse-route fibre feasibility study. Co-fundable with federal connectivity programs.",
  },
  {
    title: "A federal handshake",
    body: "A joint NL–Canada expression of interest under the Sovereign AI Compute Strategy, so the next intake window opens with a Labrador consortium already on file.",
  },
];

const DOING_NOTHING = [
  {
    lead: "The retained block defaults to mining and re-export.",
    body: "Public framing gives the province optionality on the retained block, plus wind if built. If other industrial uses, including compute, are not named as eligible, that optionality is spent on other files. Lawfully, and without a second chance inside this architecture.",
  },
  {
    lead: "The federal build-out passes the province by.",
    body: "Every subsidised megawatt lands where a project was ready. The first intake already closed without an NL entry that we can find.",
  },
  {
    lead: "Labrador's industrial story stays minerals-only.",
    body: "Mining is vital. It is also cyclical, and it employs at the mine, not at the grid.",
  },
  {
    lead: "2041 arrives with no domestic alternative.",
    body: "The province's leverage in any future negotiation is a credible in-province use for the power: mines, towns, other industry, and compute if written eligible. The absence of that leverage is why 1969 happened.",
  },
];

const STACK = [
  {
    label: "Power and site",
    us: false,
    body: "Crown utility: capacity allocation, brownfield land at the point of generation, transmission.",
  },
  {
    label: "Indigenous equity",
    us: false,
    body: "Innu Nation and its development entities: ownership from day one, not consultation at the end. The structure federal programs explicitly reward.",
  },
  {
    label: "Development",
    us: false,
    body: "An NL-based developer entity that assembles the coalition and carries the project.",
  },
  {
    label: "Catalyst",
    us: true,
    body: "Where Open People sits today. A public campaign for in-province use. Open People is not a DCIA party, an offtake seat or a demand seat, and does not assemble bankable offtake. A catalyst role, not a deal seat.",
  },
  {
    label: "Software layer",
    us: true,
    body: "Where Open People would sit if partners build. The sovereignty gateway, guardrails and model hosting that make in-province compute usable by buyers who cannot send data offshore.",
  },
  {
    label: "Capital",
    us: false,
    body: "Infrastructure investors and federal programs, following the power allocation, never preceding it.",
  },
];

const NOT_PROVEN = [
  "That the province will allocate firm Labrador power to compute over mining. Critical minerals are named first. Compute has to earn peer status on the merits. No firm megawatts, price, queue or policy preference for Labrador compute is confirmed.",
  "That fibre economics support a training cluster at hyperscale path diversity. A first node likely fits. Hyperscale is unproven until the route studies exist.",
  "That public-sector demand alone is large enough to bank a facility. It almost certainly needs commercial and federal co-funding alongside.",
  "That binding definitive agreements will be signed on the announced timeline, or that they will free near-term megawatts for a compute node. House endorsement of the framework is not that signature, and the Premier has not promised a vote on the final text.",
  "That a single industrial cent exists for Labrador mines. The current Labrador industrial schedule is a formula, demand charges plus a monthly energy mix. We do not flatten it, and we do not quote the 2015 schedule as current.",
  "The reconciliation between the public retain figure and other published splits of the existing plant. Public releases also give Gull Island as a range. We do not pick a number.",
  "That a three-year notice recall, as described to the House, appears in signed contract text.",
  "That 2026 Gull Island matches the 2012 Lower Churchill federal review scope. IAAC has not received that proponent confirmation.",
  "The name of the wind company. The special-purpose entity is unnamed in the public paper and the federal equity share is not in the Material Terms we read. We do not invent either.",
];

export default function BriefPage() {
  const houseGate = gate("house");
  const gateFor: Record<string, Gate> = {
    dcia: gate("dcia"),
    house: houseGate,
    "qc-gate": gate("qc"),
    "binding-window": gate("binding"),
  };
  const termGate = gate("term");

  return (
    <DeskPage
      kicker="Public evidence brief · Churchill River desk · Newfoundland and Labrador"
      title={
        <>
          Keep the power here. Use it on loads that <em>live here</em>.
        </>
      }
      lede={
        <Unfold
          id="hero-lede"
          label="43 TWh"
          plain={
            <p>
              Newfoundland and Labrador generates about{" "}
              <Fig id="a">
                43 <Term k="twh">TWh</Term>
              </Fig>{" "}
              of green electricity a year and sends most of it across the Québec border. The
              Churchill Falls / Gull Island <Term k="dcia">DCIA</Term>, signed 17 August 2026, is a{" "}
              <Term k="framework">framework</Term>, not binding <Term k="ppa">PPAs</Term>. The House
              endorsed that framework <Fig id="b">21–18</Fig> on 17 September. Binding paper is
              still ahead. The industrial question is whether{" "}
              <Term k="firm-power">firm power</Term> this province keeps is used here: mines and
              Labrador industry first. <Term k="compute">Compute</Term> is not the opener. It lives
              on a{" "}
              <Link href="/compute" className="desk-link">
                separate page
              </Link>
              .
            </p>
          }
          technical={SCALE_ANCHORS.exportScale.technical}
          sources={sourceList(["cerRenewables", "cerNl", "dciaHq", "vocmVote"])}
        />
      }
      meta={
        <p className="desk-fact leading-relaxed text-[var(--ink-3)]">
          Prepared by Open People · St. John&apos;s, NL · Updated {DESK_VERIFIED} · Public briefing ·
          DCIA framework, not PPAs · Open People is not a party to the agreement.
        </p>
      }
      actions={
        <>
          <Link href="/engage" className="btn-primary">
            Get involved — keep firm power here
          </Link>
          <Link href="/tracker" className="btn-secondary">
            Living tracker
          </Link>
          <WalkLaunch className="sm:ml-3" />
        </>
      }
      hero={
        <>
          <GateClock compact />
          <div className="desk-grid-hair mt-8 sm:grid-cols-2 lg:grid-cols-4" data-rise>
            <div className="p-6 sm:p-7">
              <Figure
                value="43.1"
                unit="TWh renewable, 2023 · 97.4% of output"
                status="published-rate"
                size="lg"
                sources={sourceList(["cerRenewables"])}
                lastVerified={DESK_VERIFIED}
                note="Canada Energy Regulator: 44.3 TWh generated, 43.1 TWh renewable (97.4%), 2023."
              />
            </div>
            <div className="p-6 sm:p-7">
              <Figure
                value="34.5"
                unit="TWh net outflows, 2023"
                status="published-rate"
                size="lg"
                sources={sourceList(["cerNl"])}
                lastVerified={DESK_VERIFIED}
                note="CER NL provincial profile: net interprovincial and international outflows 34.5 TWh (2023), overwhelmingly to Québec."
              />
            </div>
            <div className="p-6 sm:p-7">
              <Figure
                value={RETAIN.value}
                unit="public retain framing · not a signed queue"
                status={RETAIN.status}
                size="lg"
                sources={sourceList(RETAIN.sources)}
                lastVerified={RETAIN.lastVerified}
                note={RETAIN.note}
              />
            </div>
            <div className="p-6 sm:p-7">
              <Figure
                value="21–18"
                unit="House endorsed the framework, 17 Sep 2026"
                status={houseGate.status}
                size="lg"
                sources={sourceList(houseGate.sources)}
                lastVerified={DESK_VERIFIED}
                note={houseGate.body.technical}
              />
            </div>
          </div>
        </>
      }
      sections={[
        { id: "situation", label: "01 The situation" },
        { id: "asset", label: "02 The asset" },
        { id: "gap", label: "03 The value gap" },
        { id: "window", label: "04 The window" },
        { id: "buyer", label: "05 Neighbouring grids" },
        { id: "ask", label: "06 The ask" },
        { id: "builds", label: "07 Who builds it" },
        { id: "constraints", label: "08 Honest constraints" },
        { id: "who", label: "09 Who we are" },
        { id: "honesty", label: "10 Not proven" },
        { id: "sources", label: "11 Sources" },
      ]}
      walkthrough={{
        title: "Walk me through the case",
        steps: [
          {
            anchor: "situation",
            text: "Start with the situation in one paragraph. A framework was signed and endorsed. The contracts that lock the power are still ahead.",
            unfold: "situation-unfold",
          },
          {
            anchor: "asset",
            text: "This is the asset. One of the cleanest large power systems in North America, and most of it leaves the province.",
            unfold: "asset-unfold",
          },
          {
            anchor: "gap",
            text: "This is the value gap. The export price is rising. The number that would matter for a new Labrador load is still blank.",
            unfold: "gap-paths",
          },
          {
            anchor: "window",
            text: "This is the window. Binding paper is targeted around year-end and the framework clock runs into March. In-province use can still be written in public.",
            unfold: "tl-binding-window",
          },
          {
            anchor: "ask",
            text: "This is the ask. Five instruments, none of which cost money. All labelled as Open People asks, not government figures.",
          },
        ],
      }}
    >
      {/* ── 01 ── */}
      <DeskSection id="situation" num="01 — The situation" title="One paragraph.">
        <Unfold
          id="situation-unfold"
          label="5,428 MW"
          plain={
            <p className="desk-takeaway">
              Newfoundland and Labrador owns one of the cleanest large power systems in North
              America. Churchill Falls alone is{" "}
              <Fig id="a">
                5,428 <Term k="mw">MW</Term>
              </Fig>
              . For decades it has been sold at a small fraction of what firm, carbon-free power
              commands today. In May 2026 the <Term k="irc">Independent Review</Term> found the{" "}
              <Term k="mou">2024 MOU</Term> not in the long-term public interest as written. It
              cited limited rights to use the power in-province. On 17 August NL Hydro, Hydro-Québec and
              CF(L)Co signed the DCIA, announced with Ottawa in St. John&apos;s. It promises more{" "}
              <Term k="retain">retained power</Term> in public framing, a higher reported export
              price, a Labrador West line and a wind study. It is a framework, not binding PPAs.
              The House endorsed it <Fig id="b">21–18</Fig> on 17 September, with no referendum. That
              vote does not create contracts. Binding agreements are targeted around{" "}
              <Fig id="c">31 December 2026</Fig>. The framework can run to{" "}
              <Fig id="d">31 March 2027</Fig>. Québec votes 5 October. The province&apos;s stated
              industrial use is critical minerals. Mining matters, and it is first. Compute is
              optionality: not confirmed as reserved megawatts, price, queue or policy preference.
            </p>
          }
          technical={
            <>
              <p>{DCIA.body.technical}</p>
              <p>{HOUSE.body.technical}</p>
              <p>{BINDING.body.technical}</p>
              <p>{MOU_PATH.note.technical}</p>
            </>
          }
          sources={sourceList(["dciaHq", "govNlDcia", "vocmVote", "ntvVote", "ircReport"])}
        />
        <aside className="mt-10 border-l-2 border-[var(--plasma)] bg-[var(--plasma-soft)] p-5 sm:p-6">
          <p className="desk-h3">
            Labrador is not an infinite battery. It is enough firm green power to serve mines, towns
            and other industry that lives here. Industry over raw export. Compute, if written
            eligible at all, is leftover optionality.
          </p>
          <Link href="/compute" className="desk-kicker mt-4 inline-flex no-underline hover:underline">
            Compute plan (separate page) →
          </Link>
        </aside>
      </DeskSection>

      {/* ── 02 ── */}
      <DeskSection
        id="asset"
        num="02 — The asset"
        title="What the province actually holds."
        intro={
          <p>
            Megawatts drawn by how hard the number is. Solid is published. Outlined is announcement
            language. Hatched is preliminary. Dashed is not published.
          </p>
        }
        wide
      >
        <div data-rise>
          <FlowBars />
        </div>
        <div className="desk-prose mt-10">
          <Unfold
            id="asset-unfold"
            label="97.4%"
            plain={
              <p className="desk-takeaway">
                The province generated <Fig id="a">44.3 TWh</Fig> in 2023, and{" "}
                <Fig id="b">43.1 TWh</Fig> of it was renewable: <Fig id="c">97.4%</Fig>. It is
                hydro-dominated, dispatchable, and concentrated at a handful of interconnection
                points. For scale, 1,000 MW running all year is about 8.76 TWh. This is a large
                resource and a finite one. It should be allocated deliberately, not treated as
                limitless.
              </p>
            }
            technical={
              <>
                <p>
                  Canada Energy Regulator, Canada&apos;s Renewable Power (NL): 44.3 TWh generated,
                  43.1 TWh renewable (97.4%), 2023. CER provincial profile: about 97% hydro; 8,682 MW
                  installed capacity; net outflows 34.5 TWh (2023); roughly 90% of Churchill Falls
                  output flows to Québec. Churchill Falls is rated 5,428 MW; CF(L)Co is NL Hydro 65.8%
                  and Hydro-Québec 34.2%.
                </p>
                <p>
                  Muskrat Falls (824 MW, commissioned 2020–21, NL Hydro&apos;s published plant
                  capacity) and the Island hydro plants also sit inside the provincial total. The
                  older brief carried rough per-plant annual energy splits. Those have been dropped
                  rather than restated without a cited table; the CER provincial totals above are the
                  figures this desk carries.
                </p>
              </>
            }
            sources={sourceList(["cerRenewables", "cerNl"])}
          />
        </div>
      </DeskSection>

      {/* ── 03 ── */}
      <DeskSection
        id="gap"
        num="03 — The value gap"
        title="The export price is rising. The value-added still leaves the province."
        intro={
          <p>
            Seven price families on one axis, each on its own row, labelled and not merged. Every
            rung carries its source. The one that would matter for a new Labrador load is blank.
          </p>
        }
        wide
      >
        <div data-rise>
          <PriceLadder />
        </div>

        <div className="desk-grid-hair mt-10 sm:grid-cols-2 lg:grid-cols-4" data-rise>
          {[HERITAGE, MOU_PATH, REPORTED_PATH].map((m) => (
            <div key={m.id} className="p-6 sm:p-7">
              <StatusPill status={m.status} />
              <div className="mt-4">
                <Figure
                  value={m.value}
                  unit={m.unit || undefined}
                  status={m.status}
                  size="md"
                  sources={sourceList(m.sources)}
                  lastVerified={m.lastVerified}
                  note={m.note.plain}
                />
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-[var(--ink-3)]">{m.label}</p>
            </div>
          ))}
          <div className="p-6 sm:p-7">
            <StatusPill status={QC_RATE.status} />
            <div className="mt-4">
              <Figure
                value={QC_RATE.value}
                unit="¢/kWh · Québec data-centre rate, proposed"
                status={QC_RATE.status}
                size="md"
                sources={sourceList(QC_RATE.sources)}
                lastVerified={QC_RATE.lastVerified}
                note={QC_RATE.note}
              />
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-[var(--ink-3)]">{QC_RATE.label}</p>
          </div>
        </div>

        <div className="desk-prose mt-12 grid gap-8">
          <Unfold
            id="gap-heritage"
            label="0.2¢"
            plain={
              <p className="desk-takeaway">
                Under the 1969-lineage contract, Churchill Falls export power is priced at{" "}
                <Fig id="a">
                  two <Term k="mill">mills</Term>
                </Fig>
                , 0.2 <Term k="cents-per-kwh">¢/kWh</Term>, until 2041. That is an export price under
                a specific contract. It is not a rate anyone here can buy power at today.
              </p>
            }
            technical={
              <>
                <p>{HERITAGE.note.technical}</p>
                <p>
                  Media have put the cumulative profit split to 2019 at roughly $28 billion to
                  Hydro-Québec against about $2 billion to Newfoundland and Labrador. That is press
                  arithmetic reported by CBC and the Canadian Press in 2019, not a figure in this
                  desk&apos;s registry. It is quoted here as reported and used in no instrument.
                </p>
              </>
            }
            sources={sourceList(HERITAGE.sources)}
          />

          <Unfold
            id="gap-paths"
            label="1.8¢ → 11.5¢"
            plain={
              <p className="desk-takeaway">
                The rejected 2024 MOU averaged about 5.9¢/kWh in 2024 dollars. The Independent
                Review took that average apart: about <Fig id="a">3.8¢ from 2025 to 2041</Fig>, then
                about <Fig id="b">16.7¢ from 2042 to 2075</Fig>. That path is history. NL Hydro has
                said Hydro-Québec will pay <Fig id="c">1.8¢/kWh</Fig> from 2027, rising about 14% a
                year to <Fig id="d">11.5¢ by 2041</Fig>. That is a reported path, not a signed
                contract price.
              </p>
            }
            technical={
              <>
                <p>{MOU_PATH.note.technical}</p>
                <p>{REPORTED_PATH.note.technical}</p>
                <p>
                  The Government of Newfoundland and Labrador values the new package at $49 billion
                  NPV (2026) and $273 billion nominal, and names 985 MW of transmission toward other
                  markets. Those are the province&apos;s own figures from its 17 August release,
                  quoted as announcement language. They are not contract prices and this desk does
                  not carry them on any instrument. The older brief&apos;s comparison to the 2024 MOU
                  valuation has been dropped: that figure is not in the desk registry.
                </p>
              </>
            }
            sources={sourceList([
              "ircReport",
              "ircBriefing",
              "cpChurchillGraph",
              "rciPricePath",
              "financialPostPath",
              "govNlDcia",
            ])}
          />

          <Unfold
            id="gap-quebec"
            label="13¢"
            plain={
              <p className="desk-takeaway">
                In February 2026 Hydro-Québec proposed a dedicated data-centre rate of{" "}
                <Fig id="a">13¢/kWh</Fig> for loads of 5 MW and up. It still expects takers. Québec
                is rationing and repricing exactly the hydro-seeking compute demand Labrador could
                serve. Near-term, this province would still sell the underlying power at a fraction
                of that.
              </p>
            }
            technical={
              <>
                <p>{QC_RATE.note}</p>
                <p>{COMPUTE_NEIGHBOURS.technical}</p>
              </>
            }
            sources={sourceList(["hqDataCentreTariff", "aesoCap"])}
          />

          <Unfold
            id="gap-blank"
            label="the blank"
            plain={
              <p className="desk-takeaway">
                The number that would matter for a new Labrador mine, or any new load, is the signed
                industrial cent for retained power. It is not published. We do not invent it.
              </p>
            }
            technical={
              <>
                <p>{SIGNED_UNKNOWN.note.technical}</p>
                <p className="mt-3">
                  <Figure
                    value={SIGNED_UNKNOWN.value}
                    status={SIGNED_UNKNOWN.status}
                    size="sm"
                    sources={sourceList(SIGNED_UNKNOWN.sources)}
                    lastVerified={SIGNED_UNKNOWN.lastVerified}
                    note={SIGNED_UNKNOWN.note.plain}
                  />
                </p>
              </>
            }
            sources={sourceList(SIGNED_UNKNOWN.sources)}
          />

          <aside className="border-l-2 border-[var(--plasma)] bg-[var(--plasma-soft)] p-5 sm:p-6">
            <p className="desk-h3">
              A better export contract is not the same as keeping the industry. The province can now
              choose to use its retained block at home, or sell it. That choice is the policy.
            </p>
            <p className="desk-fact mt-4 text-[var(--ink-3)]">
              The point is not blame. The input–output spread is still a policy choice, and the
              architecture is being written now.
            </p>
          </aside>

          <div className="border-l-2 border-[var(--steel)] bg-[var(--steel-soft)] p-5 sm:p-6">
            <p className="desk-kicker" style={{ color: "var(--steel)" }}>
              Language discipline
            </p>
            <Unfold
              id="gap-discipline"
              className="mt-3"
              label="island retail"
              plain={
                <p className="desk-takeaway">
                  The 0.2¢ figure is an export price under a specific contract. We never present it
                  as a rate available to any customer today. Island retail sits on a different grid
                  and a different tariff. This brief is a value-retention argument, not a grievance
                  argument.
                </p>
              }
              technical={
                <p>
                  Hydro&apos;s current-rates page quotes 15.587¢/kWh first-block for Island
                  Interconnected, L&apos;Anse au Loup and isolated diesel domestic customers; that is
                  not Labrador. Newfoundland Power general-service energy charges, per its published
                  rate book, run roughly 11–15¢ before demand charges and HST; the older brief&apos;s
                  &ldquo;11–13¢ delivered&rdquo; matched tail-block energy charges only. A ballpark,
                  not a Labrador rate and not a locked PUB figure on this desk.
                </p>
              }
              sources={sourceList(["nlhCurrentRates", "nlhRates2026"])}
            />
          </div>
        </div>
      </DeskSection>

      {/* ── 04 ── */}
      <DeskSection
        id="window"
        num="04 — The window"
        title="Why this is still a 2026 decision, not a finished deal."
        intro={
          <p>
            The <Term k="material-terms">Material Terms</Term> are the skeleton for contracts that
            do not yet exist. Each row below is a tracker entry with its own sources. Dates on the
            gate clock carry their status.
          </p>
        }
        wide
      >
        <ol className="desk-prose grid gap-3" aria-label="Timeline">
          <TimelineRow
            id="tl-mou"
            when="Dec 2024"
            title="Province and Hydro-Québec announce an MOU"
            unfoldId="tl-mou-unfold"
            label="the MOU"
            plain="The province and Hydro-Québec announced a memorandum to replace the Churchill Falls terms and enable expansions, framed as a 2025–2075 arrangement. It expired 30 April 2026."
            technical={MOU_PATH.note.technical}
            sources={sourceList(["ircReport", "ircBriefing"])}
          />
          <TimelineRow
            id="tl-irc"
            when="19 May 2026"
            title="Independent Churchill River Review reports"
            unfoldId="tl-irc-unfold"
            label="the Review"
            plain="The Review found the MOU, as configured, not in the overall best long-term interest of the province. It flagged limits on using the power for in-province development, transmission access, pricing and governance."
            technical="IRC report dated 30 April 2026, released 19 May 2026, with a technical briefing the same day. The report decomposes the MOU price path into blocks (3.8¢/kWh over 2025 to 2041, 16.7¢/kWh over 2042 to 2075, 2024 dollars) and recommends new transmission from Churchill Falls to Labrador West to enable energy-intensive industry. The 2024 MOU expired 30 April 2026. The renegotiation team and oversight committee were appointed in May and June; the Premier framed more power for Labrador's economy around critical minerals and industry. AI and compute were not named."
            sources={sourceList(["ircReport", "ircBriefing"])}
          />
          <TimelineRow
            id="tl-dcia"
            gate={gateFor.dcia}
            year="2026"
            title={DCIA.title}
            unfoldId="tl-dcia-unfold"
            label="the framework"
            plain={DCIA.body.plain}
            technical={DCIA.body.technical}
            sources={sourceList(DCIA.sources)}
          />
          <TimelineRow
            id="tl-house"
            gate={gateFor.house}
            year="2026"
            title={HOUSE.title}
            unfoldId="tl-house-unfold"
            label="21–18"
            plain={HOUSE.body.plain}
            technical={HOUSE.body.technical}
            sources={sourceList(HOUSE.sources)}
          />
          <TimelineRow
            id="tl-house-return"
            when="18 Sep 2026"
            title={HOUSE_RETURN.title}
            unfoldId="tl-house-return-unfold"
            label="the next vote"
            plain={HOUSE_RETURN.body.plain}
            technical={HOUSE_RETURN.body.technical}
            sources={sourceList(HOUSE_RETURN.sources)}
          />
          <TimelineRow
            id="tl-qc"
            gate={gateFor["qc-gate"]}
            year="2026"
            title={QC.title}
            unfoldId="tl-qc-unfold"
            label="5 October"
            plain={QC.body.plain}
            technical={QC.body.technical}
            sources={sourceList(QC.sources)}
          />
          <TimelineRow
            id="tl-binding"
            gate={gateFor["binding-window"]}
            secondGate={termGate}
            year="2026 / 2027"
            title={BINDING.title}
            unfoldId="tl-binding-window"
            label="31 December"
            plain={BINDING.body.plain}
            technical={BINDING.body.technical}
            sources={sourceList(BINDING.sources)}
          />
        </ol>

        <div className="desk-prose mt-12">
          <Unfold
            id="window-announcement"
            label="2,350 MW"
            plain={
              <p className="desk-takeaway">
                Public framing on announcement day: the province retains up to{" "}
                <Fig id="a">2,350 MW</Fig> from Churchill Falls and{" "}
                <Term k="gull">Gull Island</Term>, plus <Fig id="b">400 MW</Fig> from Labrador wind
                if built. Not binding PPAs. Compute is still not named as a reserved use. On
                announcement day the mines minister named critical minerals. He did not name AI.
              </p>
            }
            technical={
              <>
                <p>{NAMED_MINERALS?.body.technical}</p>
                <p>{WIND_BAR.note}</p>
              </>
            }
            sources={sourceList(["govNlDcia", "dciaHq", "canadaDcia"])}
          />
        </div>

        <div className="desk-prose mt-14">
          <h3 className="desk-h3">The corridor the mines need</h3>
          <p className="desk-body mt-3">
            The Review recommended new transmission from Churchill Falls to Labrador West
            specifically to enable energy-intensive industry. The August framework attaches money to
            that line. What is still missing is a public allocation: year, megawatts, place, price
            and line. Mines first, then other industrial load, including compute if the province
            writes it.
          </p>
        </div>
        <div className="mt-8" data-rise>
          <CorridorSchematic />
        </div>
        <div className="desk-prose mt-8">
          <Unfold
            id="window-corridor"
            label="the new line"
            plain={<p className="desk-takeaway">{LAB_WEST.body.plain}</p>}
            technical={LAB_WEST.body.technical}
            sources={sourceList(LAB_WEST.sources)}
          />
        </div>

        <div className="desk-prose mt-14">
          <p className="desk-kicker" style={{ color: "var(--amber)" }}>
            Still open in the text
          </p>
          <div className="mt-4 grid gap-3">
            <div className="desk-surface p-5 sm:p-6" data-rise>
              <div className="desk-kicker">01 · Recall</div>
              <Unfold
                id="open-recall"
                className="mt-3"
                label="three-year notice"
                plain={
                  <p className="desk-takeaway">
                    A consultant told the House a <Fig id="a">three-year notice</Fig> recall could let
                    the province keep more power at home. That is testimony. It is not confirmed in
                    signed contract text.
                  </p>
                }
                technical="Jason Chee-Aloy of Power Advisory told the House a three-year notice recall could let NL keep more power at home. Material Terms describe three-year notice for recapture of volumes previously sold to HQ, for domestic load. Whether that survives into the Definitive Agreements is not public."
                sources={sourceList(["dciaHq", "powerAdvisory"])}
              />
            </div>
            <div className="desk-surface p-5 sm:p-6" data-rise>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="desk-kicker">02 · {INNU.title}</div>
                <StatusPill status={INNU.status} />
              </div>
              <Unfold
                id="open-innu"
                className="mt-3"
                label="the Innu file"
                plain={
                  <p className="desk-takeaway">
                    <Term k="innu-nation">Innu Nation</Term> wrote MHAs on 17 September urging a no
                    vote, and says the paper cuts its benefits by more than half. On 21 September the
                    Grand Chief said the Innu are ready to meet. No meeting is scheduled. They were
                    never invited to the table. Partnership, royalty and Gull Island tariff path remain
                    open.
                  </p>
                }
                technical={INNU.body.technical}
                sources={sourceList(INNU.sources)}
              />
            </div>
            <div className="desk-surface p-5 sm:p-6" data-rise>
              <div className="desk-kicker">03 · Federal assessment</div>
              <Unfold
                id="open-federal"
                className="mt-3"
                label="2,000 MW"
                plain={
                  <p className="desk-takeaway">
                    <Term k="iaac">IAAC</Term> has not received proponent confirmation that 2026 Gull
                    Island matches the 2012 review. The 2026 plant as described is larger than the
                    roughly <Fig id="a">2,000 MW</Fig> studied then.
                  </p>
                }
                technical={SCALE_ANCHORS.federalAssessmentEngage.technical}
                sources={sourceList(["cbcIaac"])}
              />
            </div>
            <div className="desk-surface p-5 sm:p-6" data-rise>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="desk-kicker">04 · {WIND.title}</div>
                <StatusPill status={WIND.status} />
              </div>
              <Unfold
                id="open-wind"
                className="mt-3"
                label="the SPE"
                plain={
                  <p className="desk-takeaway">
                    The wind company, an <Term k="spe">SPE</Term>, is unnamed and at NL Hydro&apos;s
                    sole discretion. We do not invent the name, a dollar figure or a federal share.
                  </p>
                }
                technical={WIND.body.technical}
                sources={sourceList(WIND.sources)}
              />
            </div>
          </div>
        </div>
      </DeskSection>

      {/* ── 05 ── */}
      <DeskSection
        id="buyer"
        num="05 — Neighbouring grids (context)"
        title="Demand has repriced power elsewhere. That is not a Labrador reservation."
        intro={
          <p>
            Neighbouring-grid facts that used to open this brief now live on the{" "}
            <Link href="/compute" className="desk-link">
              compute page
            </Link>
            , a separate page. They are context for leftover firm hydro, not a campus pitch, and
            not a named industrial class in the Material Terms.
          </p>
        }
      >
        <div className="grid gap-8">
          <Unfold
            id="buyer-neighbours"
            label="the postures"
            plain={
              <p className="desk-takeaway">
                {COMPUTE_NEIGHBOURS.plain} Newfoundland and Labrador has no policy, no tariff, no
                allocation process and no project.
              </p>
            }
            technical={
              <>
                <p>{COMPUTE_NEIGHBOURS.technical}</p>
                <ul className="desk-rule-list mt-4">
                  <li>
                    <span className="n">QC</span>
                    <span>
                      Ministerial approval for large new loads. Proposed 13¢/kWh data-centre rate,
                      filed 19 February 2026, before the Régie.
                    </span>
                  </li>
                  <li>
                    <span className="n">BC</span>
                    <span>
                      Crypto loads barred permanently. Regulation from 1 February 2026 caps allocations
                      at 100 MW conventional plus 300 MW AI data-centre load for two years.
                    </span>
                  </li>
                  <li>
                    <span className="n">ON</span>
                    <span>
                      Economic screening introduced for large load connections. No figure carried on
                      this desk.
                    </span>
                  </li>
                  <li>
                    <span className="n">AB</span>
                    <span>
                      AESO 1,200 MW interim large-load limit to 2028, described by the province as
                      fully taken. Data Centre Regulation in effect since June 2026.
                    </span>
                  </li>
                  <li>
                    <span className="n">NL</span>
                    <span>No policy. No tariff. No allocation process. No project.</span>
                  </li>
                </ul>
              </>
            }
            sources={sourceList(["hqDataCentreTariff", "aesoCap"])}
          />

          <div>
            <h3 className="desk-h3">&ldquo;Nobody builds AI infrastructure somewhere like Labrador&rdquo;</h3>
            <Unfold
              id="buyer-precedent"
              className="mt-3"
              label="Narvik"
              plain={
                <p className="desk-takeaway">
                  Remote, cold and hydro-rich is the profile of the current build-out. Stargate Norway
                  put a hydro-powered campus in Narvik, above the Arctic Circle. Meta has run a
                  hydro-powered campus in Luleå, Sweden, since 2013. Google is expanding in Hamina,
                  Finland. Training is latency-insensitive, so it goes to the power; inference stays
                  near cities. Cold helps. Power decides.
                </p>
              }
              technical={
                <>
                  <p>
                    Stargate Norway, announced August 2025 as a joint venture between Nscale and Aker:
                    230 MW initial capacity scaling to 520 MW and roughly 100,000 GPUs, on hydropower
                    in Narvik, chosen for surplus clean power and cold climate. Those figures come
                    from the companies&apos; own announcement, not a regulator, and are not in this
                    desk&apos;s registry.
                  </p>
                  <p>
                    The International Energy Agency&apos;s Energy and AI report (2025) projects global
                    data-centre electricity use rising from about 415 TWh in 2024 to about 945 TWh by
                    2030. That is the IEA&apos;s projection, quoted as context. Power availability has
                    become the primary site-selection criterion in those markets, and interconnection
                    queues in the established hubs run for years. None of that allocates a Labrador
                    megawatt.
                  </p>
                </>
              }
            />
          </div>

          <div>
            <h3 className="desk-h3">Ottawa is already paying for this</h3>
            <Unfold
              id="buyer-ottawa"
              className="mt-3"
              label="the federal strategy"
              plain={
                <p className="desk-takeaway">
                  Canada&apos;s Sovereign AI Compute Strategy seeks Canadian-owned, Canadian-controlled
                  projects with Indigenous participation. A Labrador consortium of Crown power, Innu
                  equity, an NL developer and Canadian anchor demand fits that description. The first
                  intake closed in 2026. We found no Newfoundland and Labrador entry in the public
                  record, because there was no NL project to enter.
                </p>
              }
              technical={
                <p>
                  Innovation, Science and Economic Development Canada&apos;s Canadian Sovereign AI
                  Compute Strategy commits more than $2 billion, with further Budget 2025 funding, and
                  its programme materials describe eligibility for Canadian-owned projects above 100
                  MW with Indigenous participation. Programme figures are ISED&apos;s, quoted as
                  published, and are not in this desk&apos;s registry. Whether an NL entry exists in a
                  closed intake cannot be confirmed from public records. Treat &ldquo;no NL
                  entrant&rdquo; as our reading, not a government statement.
                </p>
              }
            />
          </div>
        </div>
      </DeskSection>

      {/* ── 06 ── */}
      <DeskSection
        id="ask"
        num="06 — The ask"
        title="Five things, none of which cost money."
        intro={
          <p>
            The province is not being asked to spend, build or subsidise. It is being asked to write
            five instruments into the architecture of the binding agreements, or the provincial
            framework beside them, before those agreements lock. House endorsement is not that lock.
            Year-end 2026 is the public target. The framework can run to 31 March 2027.
          </p>
        }
        wide
      >
        <div className="desk-prose">
          <div className="desk-surface p-6 sm:p-8" data-rise>
            <p className="desk-kicker">Open People ask · not a government figure</p>
            <ol className="desk-rule-list mt-5" aria-label="The five asks">
              {ASKS.map((ask, i) => (
                <li key={ask.title}>
                  <span className="n">{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <strong className="font-semibold text-[var(--ink)]">{ask.title}.</strong>{" "}
                    <span className="text-[15px] leading-relaxed text-[var(--ink-2)]">{ask.body}</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="desk-fact mt-5 text-[var(--ink-3)]">
              Every megawatt and cent in this block is an Open People ask. None is a published rate,
              a reserved block or a government figure.
            </p>
          </div>
          <p className="desk-body mt-8">
            Item 1 belongs in the binding agreements&apos; architecture or their enabling provincial
            framework. Items 2 through 5 are ordinary policy instruments the province can move
            before those agreements lock.
          </p>
        </div>

        <div className="desk-prose mt-14">
          <h3 className="desk-h3">The cost of doing nothing</h3>
          <ul className="desk-rule-list mt-5" data-rise>
            {DOING_NOTHING.map((item, i) => (
              <li key={item.lead}>
                <span className="n">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <strong className="font-semibold text-[var(--ink)]">{item.lead}</strong>{" "}
                  <span className="text-[15px] leading-relaxed text-[var(--ink-2)]">{item.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="desk-prose mt-14">
          <h3 className="desk-h3">If nobody writes anything else, the paper already decides.</h3>
          <p className="desk-body mt-3">
            The Material Terms describe what happens to retained power that is not used at home. It
            has a buyer. Leftover megawatts do not sit still by magic.
          </p>
        </div>
        <div className="mt-8" data-rise>
          <DefaultPath />
        </div>
        <div className="desk-prose mt-8">
          <Unfold
            id="ask-default"
            label="95%"
            plain={
              <p className="desk-takeaway">
                {UNUSED.body.plain} What <Term k="domestic-load">&ldquo;used here&rdquo;</Term> means
                in words a voter can check is still not written.
              </p>
            }
            technical={
              <>
                <p>{UNUSED.body.technical}</p>
                <p>{DOMESTIC.body.technical}</p>
              </>
            }
            sources={sourceList(UNUSED.sources)}
          />
        </div>
      </DeskSection>

      {/* ── 07 ── */}
      <DeskSection
        id="builds"
        num="07 — Who builds it"
        title="A consortium, not a champion."
        intro={
          <p>
            The structure that works, demonstrated at Narvik and consistent with the Review&apos;s
            governance critique, puts each risk with the party built to carry it. It is politically
            viable after Muskrat Falls because no single champion holds it.
          </p>
        }
      >
        <dl className="border-t border-[var(--hairline)]" data-rise>
          {STACK.map((row) => (
            <div
              key={row.label}
              className={`grid grid-cols-1 gap-2 border-b border-[var(--hairline)] py-4 sm:grid-cols-[9rem_1fr] sm:gap-6 ${
                row.us ? "bg-[var(--plasma-soft)] px-3 sm:px-4" : ""
              }`}
            >
              <dt className="desk-kicker" style={row.us ? undefined : { color: "var(--ink-3)" }}>
                {row.label}
              </dt>
              <dd className={`text-[15px] leading-relaxed ${row.us ? "text-[var(--ink)]" : "text-[var(--ink-2)]"}`}>
                {row.body}
              </dd>
            </div>
          ))}
        </dl>
        <p className="desk-body mt-8">
          Capital does not create power; power attracts capital. Québec, British Columbia, Ontario
          and Alberta have each just demonstrated which direction that queue runs.
        </p>
      </DeskSection>

      {/* ── 08 ── */}
      <DeskSection
        id="constraints"
        num="08 — Honest constraints"
        title="What is genuinely hard about this."
        intro={
          <p>
            A case built on cheerleading will fail in this province, and it should. Five constraints
            are real. None is a reason to leave the block unwritten, because a block that is never
            reserved is a permanent decision in favour of exporting raw electrons.
          </p>
        }
      >
        <div className="grid gap-3">
          <ConstraintCard
            id="con-fibre"
            title="Fibre is the weakest link"
            label="fibre"
            plain="Labrador's terrestrial backbone is essentially a single route, built in 2012. Region-wide outages from single events are on record. Hyperscale campuses want multiple physically diverse paths. Labrador has approximately one."
            requires="An audit of dark-fibre capacity on existing utility routes, a costed diverse-route study, and, the transformative option, anchoring a transatlantic cable landing. Training workloads tolerate thin connectivity in a way no other data-centre segment does. This gates hyperscale, not a first sovereign node."
            caveat="The older brief's fibre count and the reported 2025 abandonment of a subsidised Labrador broadband build are not in the desk registry. The fibre count is dropped; the abandonment is stated only as reported, without a figure. The 2012 build is the provincial and Bell Aliant Labrador fibre project."
          />
          <ConstraintCard
            id="con-workforce"
            title="The workforce is already spoken for"
            label="the trades"
            plain="The Churchill expansion program will itself absorb the province's construction trades at camp premiums. Muskrat Falls remains the controlling cost precedent for remote Labrador construction."
            requires="Modular, factory-built construction, now standard for precisely this reason, sequenced into the post-peak window, with the first facility kept deliberately small."
          />
          <ConstraintCard
            id="con-innu"
            title="Nothing large proceeds without Innu consent, nor should it"
            label="consent"
            status={INNU.status}
            plain="Ratification of any Innu Nation partnership on Gull Island remains unresolved. Innu Nation asked MHAs not to vote and says its benefits were cut by more than half. The Premier says he looks forward to sitting down; as of 21 September nothing is scheduled. That is a start, not consent, and not a partnership structure."
            requires="Inverting the standard model. Equity partnership in the compute entity from day one: a structure federal programs reward, that Labrador's impact-benefit culture supports, and that converts the project's largest political risk into its strongest political asset."
            technical={INNU.body.technical}
            caveat="Geotechnical work at Gull Island was halted by an Innu blockade in July 2025, as reported. That event is not a registry item on this desk."
            sources={sourceList(INNU.sources)}
          />
          <ConstraintCard
            id="con-gnd"
            title="The Great North Data precedent"
            label="the precedent"
            plain="The province's one prior data-centre experience was a Labrador crypto operator that went bankrupt in 2019 owing money to the utility and public agencies. Municipal scepticism toward container mining is earned."
            requires="Naming it rather than dodging it. That operation failed on balance sheet, and it was crypto: a commodity workload with no customers, no jobs and no sovereignty value. An allocation framework that scores creditworthiness, ownership, employment and Indigenous equity is a filter it would have failed on every line."
            caveat="Great North Data's 2019 bankruptcy was reported by CBC and provincial media. The amounts owed are not carried on this desk."
          />
          <ConstraintCard
            id="con-correction"
            title="AI demand could correct"
            label="a correction"
            plain="Lease cancellations in 2025 and a credible sceptic corpus warn of overbuild. If capex contracts later this decade, marginal sites die first."
            requires="Two design choices. Cost position: firm clean power in the indicative band of our ask (section 06) survives a correction that strands sites paying Québec's proposed rate. Demand mix: sovereign, defence-adjacent and federally subsidised Canadian compute is less bubble-correlated than merchant hyperscale. A correction is an argument for the low-cost sovereign version of this project, not against it."
          />
        </div>
      </DeskSection>

      {/* ── 09 ── */}
      <DeskSection id="who" num="09 — Who we are" title="Open People.">
        <p className="desk-body">
          Open People is a Newfoundland and Labrador AI company developing sovereign, self-hosted
          computing: software built to run without resupply, on infrastructure its users actually
          control. Our role in this campaign is deliberately narrow: constituent and catalyst. We
          make the public case for keeping firm power in-province. We are not a DCIA party, an
          offtake seat or a demand seat. We are not asking to own the steel.
        </p>
        <div className="mt-8 flex gap-5">
          <div
            className="flex h-14 w-14 flex-none items-center justify-center border border-[var(--hairline-strong)] font-[var(--font-mono)] text-[var(--plasma)]"
            aria-hidden
          >
            TL
          </div>
          <div className="min-w-0">
            <p className="text-[1.05rem] font-semibold text-[var(--ink)]">Tom Lane</p>
            <p className="desk-fact mt-1 text-[var(--ink-3)]">Founder, Open People · St. John&apos;s, NL</p>
            <p className="desk-body mt-4">
              Tom Lane is an entrepreneur based in St. John&apos;s. He is the founder of Open People and
              co-founder and owner of snōw white laundry, a seasonal restaurant on Water Street that
              opened in 2026. He took that project from lease negotiation through design, permitting
              and construction, acting as his own project manager with a local general contractor,
              and built its operating stack himself: supplier price intelligence, demand
              forecasting, financial automation and a custom staff platform.
            </p>
            <p className="desk-body mt-4">
              It is a small building with a large point behind it. A regulated, multi-permit,
              multi-trade physical build on a compressed schedule is the same job shape as a first
              small compute node: site control, power and mechanical, inspectors, trades, and a
              licence gate at the end. He runs a 70-seat restaurant with the instrumentation of a
              data centre. This campaign is that continuity, applied to a bigger load.
            </p>
          </div>
        </div>
      </DeskSection>

      {/* ── 10 ── */}
      <DeskSection
        id="honesty"
        num="10 — Falsifiability"
        title="What we have not proven."
        intro={
          <p>
            This document is meant to be argued with. The following are open questions, not settled
            claims, and we say so in every room.
          </p>
        }
      >
        <ul className="desk-rule-list" data-rise>
          {NOT_PROVEN.map((line, i) => (
            <li key={line}>
              <span className="n">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-[15px] leading-relaxed text-[var(--ink-2)]">{line}</span>
            </li>
          ))}
        </ul>
        <div className="mt-8 border-l-2 border-[var(--steel)] bg-[var(--steel-soft)] p-5 sm:p-6">
          <p className="desk-kicker" style={{ color: "var(--steel)" }}>
            Standing rule
          </p>
          <p className="desk-body mt-3">
            Every figure on this page is bound to a public primary or reported source, and shows it
            when tapped. Where a number is an estimate, a range or an illustration, it is labelled as
            one. Where the public text does not say, we write UNKNOWN. If something here is wrong, we
            want to know. Corrections change the document.
          </p>
        </div>
      </DeskSection>

      {/* ── 11 ── */}
      <DeskSection id="sources" num="11 — Sources" title="Where the numbers come from.">
        <p className="desk-body">
          Every source below is in the desk registry and re-checked on the verified date at the top
          of the page. The same registry feeds the tracker, the ladder and the megawatt bars, so a
          number here and a number there are the same object.
        </p>
        <div className="mt-8 grid gap-8">
          {Object.entries(KIND_LABEL).map(([kind, label]) => {
            const items = PAGE_SOURCES.map((id) => DESK_SOURCES[id]).filter((s) => s.kind === kind);
            if (items.length === 0) return null;
            return (
              <div key={kind}>
                <p className="desk-kicker" style={{ color: "var(--steel)" }}>
                  {label}
                </p>
                <ul className="mt-3 grid gap-2">
                  {items.map((s) => (
                    <li key={s.id} className="text-[14px] leading-relaxed text-[var(--ink-2)]">
                      <a href={s.href} className="desk-link" target="_blank" rel="noreferrer">
                        {s.label}
                      </a>{" "}
                      <span className="desk-fact text-[var(--ink-4)]">{s.date}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          <div>
            <p className="desk-kicker" style={{ color: "var(--steel)" }}>
              Named in prose only, not in the registry
            </p>
            <ul className="mt-3 grid gap-2 text-[14px] leading-relaxed text-[var(--ink-2)]">
              <li>International Energy Agency, Energy and AI (2025): global data-centre demand projection.</li>
              <li>Innovation, Science and Economic Development Canada: Canadian Sovereign AI Compute Strategy programme materials.</li>
              <li>Nscale and Aker: Stargate Norway announcements, August 2025.</li>
              <li>CBC and Canadian Press, 2019: reported cumulative Churchill Falls profit split.</li>
              <li>Newfoundland Power rate book: general-service energy charge ballpark.</li>
              <li>CBC and provincial media: Great North Data bankruptcy (2019); Gull Island blockade (July 2025).</li>
            </ul>
            <p className="desk-fact mt-4 text-[var(--ink-3)]">
              Figures from these appear only inside technical layers with a caveat, never on an
              instrument.
            </p>
          </div>
        </div>
        <p className="mt-10 text-sm leading-relaxed text-[var(--ink-3)]">
          Prepared independently. All figures as publicly reported. A full claim-by-claim evidence
          table with confidence ratings sits behind this page and is available on request.
        </p>
      </DeskSection>

      <DeskSection id="close">
        <p className="desk-h2">
          The power has to be allocatable here before anything else can happen.
        </p>
        <p className="desk-body mt-5">
          If you want firm power kept in Newfoundland and Labrador, for mines, towns and other
          industry, with compute as a named use rather than a forgotten leftover, there is a public
          path this month.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/engage" className="btn-primary">
            Get involved — keep firm power here
          </Link>
          <a href="mailto:tom@openpeople.ai" className="btn-secondary">
            tom@openpeople.ai
          </a>
        </div>
        <div className="desk-fact mt-10 leading-relaxed text-[var(--ink-2)]">
          <div>Open People · St. John&apos;s, Newfoundland and Labrador</div>
          <div className="mt-1 text-[var(--ink-3)]">
            Briefing updated {DESK_VERIFIED} · Constituent and catalyst voice · not a DCIA party
          </div>
        </div>
      </DeskSection>
    </DeskPage>
  );
}

/* ── local pieces (server components) ───────────────────────────────────── */

function TimelineRow({
  id,
  when,
  gate,
  secondGate,
  year,
  title,
  unfoldId,
  label,
  plain,
  technical,
  sources,
}: {
  id: string;
  /** plain date text, used when no gate is bound */
  when?: string;
  /** a Gate Clock gate whose date renders as a Figure */
  gate?: Gate;
  secondGate?: Gate;
  year?: string;
  title: string;
  unfoldId: string;
  label: string;
  plain: string;
  technical: string;
  sources: ReturnType<typeof sourceList>;
}) {
  return (
    <li id={id} className="desk-surface p-5 sm:p-6" data-rise>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        {gate ? (
          <span className="flex flex-wrap items-baseline gap-x-2">
            <Figure
              value={gate.short}
              status={gate.status}
              size="sm"
              sources={sourceList(gate.sources)}
              lastVerified={DESK_VERIFIED}
              note={gate.body.technical}
            />
            {secondGate ? (
              <>
                <span className="desk-fact text-[var(--ink-3)]">/</span>
                <Figure
                  value={secondGate.short}
                  status={secondGate.status}
                  size="sm"
                  sources={sourceList(secondGate.sources)}
                  lastVerified={DESK_VERIFIED}
                  note={secondGate.body.technical}
                />
              </>
            ) : null}
            {year ? <span className="desk-fact text-[var(--ink-3)]">{year}</span> : null}
          </span>
        ) : (
          <span className="desk-fact text-[var(--ink-2)]">{when}</span>
        )}
        <h3 className="desk-h3">{title}</h3>
      </div>
      <Unfold
        id={unfoldId}
        className="mt-3"
        label={label}
        plain={<p className="desk-takeaway">{plain}</p>}
        technical={technical}
        sources={sources}
      />
    </li>
  );
}

function ConstraintCard({
  id,
  title,
  label,
  status,
  plain,
  requires,
  technical,
  caveat,
  sources,
}: {
  id: string;
  title: string;
  label: string;
  status?: DeskItem["status"];
  plain: string;
  requires: string;
  technical?: string;
  caveat?: string;
  sources?: ReturnType<typeof sourceList>;
}) {
  return (
    <section id={id} className="desk-surface p-5 sm:p-6" data-rise>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="desk-h3">{title}</h3>
        {status ? <StatusPill status={status} /> : null}
      </div>
      <Unfold
        id={`${id}-unfold`}
        className="mt-3"
        label={label}
        plain={<p className="desk-takeaway">{plain}</p>}
        technical={
          <>
            <p>
              <span className="desk-cite">What it requires</span> {requires}
            </p>
            {technical ? <p>{technical}</p> : null}
            {caveat ? <p className="desk-fact mt-3 text-[var(--ink-3)]">{caveat}</p> : null}
          </>
        }
        sources={sources}
      />
    </section>
  );
}
