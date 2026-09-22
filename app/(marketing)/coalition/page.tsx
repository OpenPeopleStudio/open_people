import type { ReactNode } from "react";
import Link from "next/link";
import { DeskPage, DeskSection } from "@/components/marketing/shell";
import { Fig, Figure, Term, Unfold, WalkLaunch } from "@/components/marketing/depth";
import { StatusPill } from "@/components/marketing/desk";
import { DefaultPath, GateClock } from "@/components/marketing/instruments";
import { deskMetadata } from "@/lib/og/metadata";
import {
  COMPUTE_HONESTY,
  COMPUTE_NEIGHBOURS,
  COST_MARKERS,
  DESK_SOURCES,
  DESK_VERIFIED,
  FLOW_BARS,
  INDUSTRY_CARDS,
  LADDER_POINTS,
  TRACKER_ITEMS,
  sourceList,
  type CostMarker,
  type DeskItem,
  type DeskSource,
  type FlowBar,
  type IndustryCard,
  type LadderPoint,
} from "@/lib/desk";
import { SCALE_ANCHORS } from "@/lib/voice-mode";

export const metadata = deskMetadata({
  title: "Coalition brief — keep firm power in NL",
  description:
    "Partner-confidential coalition for keeping Churchill Falls / Gull Island firm power in Newfoundland and Labrador: mines, towns, Indigenous partners, infrastructure. Compute is a separate page. Open People is a catalyst, not an offtake seat.",
  path: "/coalition",
  type: "article",
  robots: { index: false, follow: false },
  ogDescription:
    "A coalition to keep firm Churchill Falls / Gull Island power in-province. Mining first. Compute if the paper writes it. Open People is a catalyst, not a DCIA party.",
});

/* ── lib/desk lookups. A missing id is a build error, not a silent blank. ── */

function row(id: string): DeskItem {
  const r = TRACKER_ITEMS.find((t) => t.id === id);
  if (!r) throw new Error(`coalition: tracker row "${id}" not found`);
  return r;
}
function marker(id: string): CostMarker {
  const m = COST_MARKERS.find((c) => c.id === id);
  if (!m) throw new Error(`coalition: cost marker "${id}" not found`);
  return m;
}
function bar(id: string): FlowBar {
  const b = FLOW_BARS.find((f) => f.id === id);
  if (!b) throw new Error(`coalition: flow bar "${id}" not found`);
  return b;
}
function rung(id: string): LadderPoint {
  const p = LADDER_POINTS.find((l) => l.id === id);
  if (!p) throw new Error(`coalition: ladder point "${id}" not found`);
  return p;
}
function card(id: string): IndustryCard {
  const c = INDUSTRY_CARDS.find((i) => i.id === id);
  if (!c) throw new Error(`coalition: industry card "${id}" not found`);
  return c;
}

const R = {
  dcia: row("dcia"),
  house: row("house"),
  houseReturn: row("house-return"),
  binding: row("binding-window"),
  qc: row("qc-gate"),
  innu: row("innu"),
  qcInnu: row("qc-innu"),
  wind: row("wind-spe"),
  labWest: row("labrador-west"),
};

const M = {
  heritage: marker("heritage-mills"),
  mou: marker("mou-irc-path"),
  reported: marker("reported-export-path"),
  labDomestic: marker("lab-domestic"),
};

const B = {
  cf: bar("cf-total"),
  retain: bar("retain"),
  wind: bar("wind"),
};

const P = {
  qc13: rung("qc-13"),
  islandDomestic: rung("island-15587"),
};

const C = {
  minerals: card("named-minerals"),
  corridor: card("labrador-west-line"),
};

/* ── small presentational helpers (server) ─────────────────────────────── */

function Pill({ children, tone = "steel" }: { children: ReactNode; tone?: "steel" | "plasma" | "amber" }) {
  const color = tone === "plasma" ? "var(--plasma)" : tone === "amber" ? "var(--amber)" : "var(--steel)";
  return (
    <span className="desk-cite" style={{ color, borderColor: color }}>
      {children}
    </span>
  );
}

function Card({
  n,
  kicker,
  figure,
  children,
}: {
  n: number;
  kicker: ReactNode;
  figure?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="desk-surface p-5 sm:p-6" data-rise>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="desk-kicker">
          {String(n).padStart(2, "0")} · {kicker}
        </div>
        {figure ? <div className="flex flex-wrap gap-x-6 gap-y-2">{figure}</div> : null}
      </div>
      {children}
    </div>
  );
}

function TrackerCard({
  n,
  item,
  id,
  label,
  plain,
  technical,
  sources,
  figure,
}: {
  n: number;
  item: DeskItem;
  id: string;
  label?: string | undefined;
  plain?: ReactNode;
  technical?: ReactNode;
  sources?: DeskSource[] | undefined;
  figure?: ReactNode;
}) {
  return (
    <Card
      n={n}
      kicker={
        <>
          {item.when} · {item.title}
        </>
      }
      figure={figure}
    >
      <div className="mt-2">
        <StatusPill status={item.status} />
      </div>
      <Unfold
        id={id}
        className="mt-3"
        label={label}
        plain={<p className="desk-takeaway">{plain ?? item.body.plain}</p>}
        technical={
          <>
            {technical ?? <p>{item.body.technical}</p>}
            <p className="mt-2">
              Tracker:{" "}
              <Link href={`/tracker#${item.id}`} className="desk-link">
                {item.title} →
              </Link>
            </p>
          </>
        }
        sources={sources ?? sourceList(item.sources)}
      />
    </Card>
  );
}

/** Planning numbers. Open People working estimates, never government figures, never a Figure. */
function PlanningList({ rows }: { rows: { k: ReactNode; v: ReactNode; d?: ReactNode }[] }) {
  return (
    <dl className="mt-4 border-y border-[var(--hairline)]">
      {rows.map((r, i) => (
        <div
          key={i}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 gap-y-1 border-t border-[var(--hairline)] py-3 first:border-t-0"
        >
          <dt className="text-[15px] text-[var(--ink)]">{r.k}</dt>
          <dd className="desk-fact text-right text-[13px] text-[var(--steel-bright)]">{r.v}</dd>
          {r.d ? <dd className="col-span-2 text-[13px] leading-relaxed text-[var(--ink-3)]">{r.d}</dd> : null}
        </div>
      ))}
    </dl>
  );
}

/* ── static content that is Open People's own (no public figures) ─────── */

const ROLES = [
  {
    layer: "Narrative and policy",
    what: "Firm power as industry, not raw export. Mines first; compute as a named use if the paper writes it.",
    who: "Open People and allies. Catalyst, not a DCIA seat.",
  },
  {
    layer: "Demand",
    what: "Mines, towns, institutions, and any industrial load that would actually use in-province power.",
    who: "Those buyers. Open People does not hold offtake.",
  },
  {
    layer: "Facility",
    what: "Labrador-sited industrial plant, or a compute campus only if eligible.",
    who: "Partner, if anyone builds.",
    accent: true,
  },
  {
    layer: "Software",
    what: "Sovereignty gateway and model hosting, only if a partner-built node exists.",
    who: "Open People product (hypothetical).",
  },
  {
    layer: "Social equity",
    what: "Founder network and hospitality base in St. John’s: the rooms a coalition needs.",
    who: "Founder.",
  },
];

const SEQUENCE = [
  "Public voice and contract transparency.",
  "In-province optionality in writing: retain, recall, unused-default.",
  "Innu partnership before large Labrador builds.",
  "Mines and towns served first.",
  "Leftover firm power eligible for named uses, including compute if written.",
  "Partners own any steel. Open People stays catalyst.",
];

const PHASES = [
  {
    yr: "Y0 · 2026",
    now: true,
    t: "Public voice",
    d: "Be a prepared constituent voice on in-province use while the paper is still paper. Evidence pack frozen; /engage live; stakeholder map; no offtake claimed; no reserved MW.",
  },
  {
    yr: "Y1 · 2027",
    t: "Contracts or not",
    d: "Binding paper is either signed or the framework has run its term. Public transparency of retain, recall, unused-default, Innu path, and industrial eligibility. Mining first in practice, not only in speeches.",
  },
  {
    yr: "Y2 · 2028",
    t: "Architecture in writing",
    d: "If leftover firm power is eligible for named industrial uses beyond mining, partners can talk term sheets on their own paper. Open People still not the buyer. Site options remain research, not a queue position.",
  },
  {
    yr: "Y3 · 2029",
    t: "Partner choice",
    d: "Any go-decision or FID is a partner’s, not Open People’s. Federal co-funding outcome known only if someone actually files. We do not pretend a path exists before that.",
  },
  {
    yr: "Y4–Y5",
    t: "Use it here",
    d: "In-province load that lives here is served first. Compute may be a standing eligible use if the province wrote it. Open People remains catalyst and software, not the offtake desk.",
  },
];

const DONE = [
  "Evidence pack audited and frozen for public use. Every energy, market and policy claim in this brief maps to it.",
  "Strategic stance, entity structure and compliance rules written as formal decisions.",
  "Named stakeholder map across power, Indigenous, political, infrastructure and local-licence tiers.",
  "Capital cost map to 38 line items with confidence flags and a gap register.",
  "Legal foundations package drafted, including a research opinion on in-province energy use with data export. Counsel has not validated it and we do not rely on it publicly.",
];

const IN_FLIGHT: { pill: string; tone: "plasma" | "steel" | "amber"; text: string }[] = [
  { pill: "P0", tone: "plasma", text: "Inquiry letters to NL Hydro, ISED and Bulk Infrastructure. Information only, no asks." },
  { pill: "P0", tone: "plasma", text: "Public brief polished to send-ready." },
  { pill: "W1", tone: "steel", text: "Power pathway memo: large-load allocation and PUB precedents." },
  {
    pill: "W3",
    tone: "steel",
    text: "Connectivity memo: fibre routes and latency for Happy Valley-Goose Bay, Labrador West, and the Churchill corridor.",
  },
  { pill: "Ready", tone: "amber", text: "Public and partner briefing ready when binding paper is public. Not an offtake filing." },
];

const ASKS = [
  {
    who: "Indigenous partner",
    lead: "Equity from day one, not consultation at the end.",
    body: "Nothing large in Labrador proceeds without Innu Nation. Partnership, royalty, and the Gull Island tariff path are unresolved after the vote. Innu Nation says the paper cuts its benefits by more than half. As of 21 September no meeting with the Premier is scheduled. We want the conversation with the commercial arm first, structured as partnership, and we take direction on sequencing from you. We do not speak for Innu Nation.",
  },
  {
    who: "Mining / resources / towns",
    lead: "You are first in line.",
    body: "What we need from you now: an honest read on whether unused retained power would actually serve Labrador load, or slide west by default. What you get: a public campaign that does not try to jump the queue with a reserved compute block.",
  },
  {
    who: "Utility / telco / infrastructure developer",
    lead: "You would build and own any steel. We do not bring bankable offtake.",
    body: "What we need from you now: an honest read on whether a Labrador industrial or optional compute node is buildable on your terms, if the contracts write eligibility. What you get: a public campaign for in-province optionality already in motion, not an anchor tenant we pretend to be.",
  },
  {
    who: "Connectivity / subsea",
    lead: "The single hardest open question for any compute path.",
    body: "The Labrador backbone is thin and route diversity is the open question. A Goose Bay landing, dark fibre access, or a credible route-diversity answer changes the risk profile more than any other input. Mining loads need the same corridor honesty.",
  },
  {
    who: "Engineering / remote-industrial operators",
    lead: "Close our cost gaps.",
    body: "Sixteen of thirty-eight capital lines on a hypothetical node are flagged as unresearched: camp, FIFO premium, winter logistics, insurance, cold-climate envelope, substation. Real operating numbers from anyone who has built in Labrador are worth more right now than capital.",
  },
  {
    who: "Institutional and public-sector demand",
    lead: "Tell us what in-province load you would actually use.",
    body: "Mining, town, institutional, or residency-bound compute if the province writes it eligible. A non-binding note describing volume and term is useful. It is not an offtake Open People holds, and it does not bank a facility on its own.",
  },
  {
    who: "Advisors and connectors",
    lead: "Warm introductions, in the right order.",
    body: "Sequencing: information before advocacy, partners before politicians, never an ask before the brief has been read. An introduction that respects that order is worth ten that do not.",
  },
];

const RULES = [
  {
    t: "Evidence before narrative.",
    d: "Every public claim maps to an audited validity pack. If it is not in there, we do not say it.",
  },
  {
    t: "No crypto.",
    d: "Explicit, permanent, and in every public material. A bankrupt crypto operation is why “data centre” is a loaded phrase in this province, and we are not repeating it.",
  },
  {
    t: "Never lead with “cheap power.”",
    d: "We lead with in-province use, jobs, and optionality in writing. The arbitrage framing loses this argument and deserves to.",
  },
  {
    t: "Compute alongside minerals, not against them.",
    d: "Critical minerals are first in line and we are not trying to displace them. Shared transmission, shared community benefits.",
  },
  {
    t: "Indigenous engagement is first-class.",
    d: "Not a consultation footnote appended to a finished plan.",
  },
  {
    t: "Hospitality for the coalition, not for officials.",
    d: "Partners, engineers, capital and advisors are welcome at our table. Ministers and public officials get a briefing in their office. This is a compliance line under the provincial Conflict of Interest Act and the federal Lobbyists’ Code, and we do not blur it.",
  },
  {
    t: "Inversion before expansion.",
    d: "Every major bet is stress-tested against written failure stories with kill-switch metrics before it gets resources.",
  },
];

const HONESTY_EXTRA = [
  "That Open People survives disintermediation once large partners arrive — not proven.",
  "That an Indigenous partnership path exists for any specific site — site-specific work, not a generic assumption. Innu Nation’s post-vote position is unresolved.",
  "The wind SPE under DCIA Schedule B §7 is unnamed. We do not invent the name, the dollar figure, or a federal share.",
  "Our research opinion that in-province energy use with data export faces no energy-law ban — counsel has not validated it. We do not rely on it publicly.",
  "No firm MW, price, or queue for Labrador compute is confirmed. Open People does not hold offtake, a FID path, or a reserved Labrador DC block.",
];

/* ── page ───────────────────────────────────────────────────────────────── */

export default function CoalitionPage() {
  return (
    <DeskPage
      kicker="Coalition partner brief · September 2026 · not indexed"
      title={
        <>
          Keep firm power in Newfoundland and Labrador. <em>Mines, towns, and partners first.</em>
        </>
      }
      lede={
        <Unfold
          id="coalition-lede"
          label="the framework"
          plain={
            <p>
              This is a coalition for keeping Churchill Falls / Gull Island{" "}
              <Term k="firm-power">firm power</Term> in-province, not an invitation to join a campus
              build. The <Term k="dcia">DCIA</Term> signed 17 August 2026 is a{" "}
              <Term k="framework">framework</Term>, not binding <Term k="ppa">PPAs</Term>. The House
              endorsed it <Fig id="a">21–18</Fig> on 17 September. Binding paper is still ahead.
              Mining and Labrador industry come first. <Term k="compute">Compute</Term> optionality,
              if any, lives on a{" "}
              <Link href="/compute" className="desk-link">
                separate page
              </Link>
              .
            </p>
          }
          technical={SCALE_ANCHORS.dciaFramework.technical}
          sources={[DESK_SOURCES.dciaHq, DESK_SOURCES.govNlDcia, DESK_SOURCES.vocmVote]}
        />
      }
      meta={
        <div className="grid gap-4">
          <p className="text-[15px] leading-relaxed text-[var(--ink-3)]">
            Open People is a constituent and catalyst voice from St. John&apos;s. It is not a DCIA
            party, not an offtake seat, and not a reserved megawatt block. Partners would own any
            steel.
          </p>
          <p className="desk-verified">
            <span>
              <span className="text-[var(--ink-4)]">Prepared by</span> Open People
            </span>
            <span aria-hidden>·</span>
            <span>
              <span className="text-[var(--ink-4)]">Phase</span> Y0 — public voice
            </span>
            <span aria-hidden>·</span>
            <span>
              <span className="text-[var(--ink-4)]">Tier</span> Partner-confidential
            </span>
            <span aria-hidden>·</span>
            <span>
              <span className="text-[var(--ink-4)]">Updated</span> {DESK_VERIFIED}
            </span>
          </p>
        </div>
      }
      actions={
        <>
          <Link href="/engage" className="btn-primary">
            Get involved — keep firm power here
          </Link>
          <a
            href="mailto:tom@openpeople.ai?subject=Coalition%20%E2%80%94%20keep%20firm%20power%20in%20NL"
            className="btn-secondary"
          >
            Partner note to Tom
          </a>
          <WalkLaunch className="sm:ml-3" />
        </>
      }
      hero={<GateClock compact />}
      sections={[
        { id: "thesis", label: "The situation" },
        { id: "window", label: "The window" },
        { id: "industry", label: "Who the power is for" },
        { id: "roles", label: "Coalition roles" },
        { id: "capital", label: "Capital structure" },
        { id: "roadmap", label: "Working timeline" },
        { id: "status", label: "Where it stands" },
        { id: "you", label: "Where you fit" },
        { id: "rules", label: "How we work" },
      ]}
      walkthrough={{
        title: "Walk me through it",
        steps: [
          {
            anchor: "thesis",
            text: "Start with the asset. One of the cleanest large power systems in North America, and most of it leaves at a heritage price.",
            unfold: "thesis-heritage",
          },
          {
            anchor: "window",
            text: "Then the clock. A framework signed, a House yes, Québec votes in October, binding paper targeted at year-end. No contract yet.",
            unfold: "win-binding",
          },
          {
            anchor: "industry",
            text: "Who the power is for. Mines and Labrador industry first. Compute only if the paper writes it, and never on an instrument here.",
            unfold: "ind-named-minerals",
          },
          {
            anchor: "roles",
            text: "What a partner would carry. Partners own any steel. Open People stays catalyst, not buyer.",
          },
        ],
      }}
    >
      {/* 01 ─────────────────────────────────────────────────────────────── */}
      <DeskSection
        id="thesis"
        num="01 — The situation"
        title="A world-class clean power system, sold at a fraction of its modern worth."
        wide
      >
        <div className="desk-grid-hair sm:grid-cols-2 lg:grid-cols-4" data-rise>
          <div className="p-6 sm:p-7">
            <Figure
              value="43.1"
              unit="TWh renewable, 2023"
              status="published-rate"
              size="lg"
              sources={[DESK_SOURCES.cerRenewables]}
              lastVerified={DESK_VERIFIED}
              note="Canada Energy Regulator: 44.3 TWh generated, 43.1 TWh renewable (97.4%), 2023."
            />
          </div>
          <div className="p-6 sm:p-7">
            <Figure
              value="97.4%"
              unit="from renewables, 2023"
              status="published-rate"
              size="lg"
              sources={[DESK_SOURCES.cerRenewables, DESK_SOURCES.cerNl]}
              lastVerified={DESK_VERIFIED}
              note="CER renewable-power profile for NL: 97.4% of 2023 generation from renewables, almost all hydro."
            />
          </div>
          <div className="p-6 sm:p-7">
            <Figure
              value="34.5"
              unit="TWh net outflows, 2023"
              status="published-rate"
              size="lg"
              sources={[DESK_SOURCES.cerNl]}
              lastVerified={DESK_VERIFIED}
              note="CER NL provincial profile: net interprovincial and international outflows 34.5 TWh (2023), overwhelmingly to Québec."
            />
          </div>
          <div className="p-6 sm:p-7">
            <Figure
              value={B.cf.value}
              unit="Churchill Falls, one site"
              status={B.cf.status}
              size="lg"
              sources={sourceList(B.cf.sources)}
              lastVerified={B.cf.lastVerified}
              note={B.cf.note}
            />
          </div>
        </div>
        <p className="desk-fact mt-3 text-[var(--ink-3)]">
          Capacity on this page is in <Term k="mw">MW</Term>. Energy over a year is in{" "}
          <Term k="twh">TWh</Term>. Sources open from each figure.
        </p>

        <div className="desk-prose mt-10">
          <p className="desk-takeaway">
            Churchill Falls is among the largest hydroelectric plants in North America. Most of its
            output goes to Hydro-Québec under a 1969-lineage contract that runs to 2041, at a
            historical export price of two <Term k="mill">mills</Term>.
          </p>
          <div className="mt-6">
            <Figure
              value={M.heritage.value}
              unit={`${M.heritage.unit} · ${M.heritage.label}`}
              status={M.heritage.status}
              size="xl"
              sources={sourceList(M.heritage.sources)}
              lastVerified={M.heritage.lastVerified}
              note={M.heritage.note.technical}
            />
          </div>

          <aside className="mt-8 border-l-2 border-[var(--amber)] p-5 sm:p-6">
            <p className="desk-kicker" style={{ color: "var(--amber)" }}>
              An honest caveat we hold ourselves to
            </p>
            <Unfold
              id="thesis-heritage"
              className="mt-3"
              label="0.2¢"
              plain={
                <p className="desk-takeaway">
                  That <Fig id="a">0.2¢</Fig> is the historical Québec export price. It is not a
                  rate available to us, to you, or to any industrial customer in the province today.
                  Labrador households pay a posted <Fig id="b">3.154¢</Fig>; the Island first block
                  is <Fig id="c">15.587¢</Fig>; the mine rate is a formula, not one cent. We never
                  claim otherwise, in any room, and we ask partners to hold the same line.
                </p>
              }
              technical={
                <>
                  <p>{M.heritage.note.technical}</p>
                  <p>{M.labDomestic.note.technical}</p>
                  <p>{P.islandDomestic.note}</p>
                </>
              }
              sources={[
                ...sourceList(M.heritage.sources),
                ...sourceList(M.labDomestic.sources),
              ]}
            />
          </aside>

          <p className="desk-body mt-8">
            The gap is the point. Decades of output left the province at a fraction of its modern
            worth. We do not put a dollar figure on that gap in this brief: nobody has published one
            we can cite, and we will not invent one.
          </p>
          <p className="desk-body mt-4">
            This is not an anti-Québec campaign. It is a value-retained-in-province campaign, and it
            needs Québec as a functioning counterparty.
          </p>
        </div>
      </DeskSection>

      {/* 02 ─────────────────────────────────────────────────────────────── */}
      <DeskSection
        id="window"
        num="02 — The window"
        title="The House endorsed a framework. Binding paper is still ahead."
        intro={
          <p>
            Each row below is a live tracker entry. The plain sentence is enough to act on; the
            receipt is underneath.
          </p>
        }
        wide
      >
        <div className="desk-prose grid gap-3">
          <Card n={1} kicker={<>Dec 2024 → 19 May 2026 · {M.mou.label}</>}>
            <div className="mt-2">
              <StatusPill status={M.mou.status} />
            </div>
            <Unfold
              id="win-mou"
              className="mt-3"
              label="3.8 → 16.7¢"
              plain={
                <p className="desk-takeaway">
                  The old memorandum proposed new terms to 2075 with Gull Island in scope. The{" "}
                  <Term k="irc">independent review</Term> found it not in the long-term public
                  interest as written. It expired on 30 April 2026. Its “average” hid a{" "}
                  <Fig id="a">3.8¢</Fig> front and a <Fig id="b">16.7¢</Fig> back.
                </p>
              }
              technical={M.mou.note.technical}
              sources={sourceList(M.mou.sources)}
            />
          </Card>

          <TrackerCard
            n={2}
            item={R.dcia}
            id="win-dcia"
            label="2,350 MW"
            figure={
              <>
                <Figure
                  value={B.retain.value}
                  unit="retained · framing"
                  status={B.retain.status}
                  size="sm"
                  sources={sourceList(B.retain.sources)}
                  lastVerified={B.retain.lastVerified}
                  note={B.retain.note}
                />
                <Figure
                  value="400 MW"
                  unit="wind to NL · if built"
                  status={B.wind.status}
                  size="sm"
                  sources={sourceList(B.wind.sources)}
                  lastVerified={B.wind.lastVerified}
                  note={B.wind.note}
                />
              </>
            }
            plain={
              <>
                NL Hydro, Hydro-Québec and CF(L)Co signed the framework, announced with Ottawa. Public
                framing is up to <Fig id="a">2,350 MW</Fig> of <Term k="retain">retained power</Term>{" "}
                from Churchill Falls and Gull Island, plus <Fig id="b">400 MW</Fig> wind if built.
                That is announcement language, not a signed allocation. The mines minister named
                minerals. Nobody named a compute class.
              </>
            }
            technical={
              <>
                <p>{R.dcia.body.technical}</p>
                <p>{SCALE_ANCHORS.retainedMw.technical}</p>
                <p>{B.wind.note}</p>
              </>
            }
          />

          <TrackerCard
            n={3}
            item={R.house}
            id="win-house"
            label="21–18"
            plain={
              <>
                The House said yes <Fig id="a">21–18</Fig> after a special sitting, with no
                referendum. <Term k="innu-nation">Innu Nation</Term> wrote MHAs that morning urging
                no. That is a political yes. It does not write power-purchase contracts.
              </>
            }
          />

          <TrackerCard n={4} item={R.houseReturn} id="win-house-return" label="the next vote" />

          <TrackerCard n={5} item={R.innu} id="win-innu" label="the Innu file" />

          <TrackerCard n={6} item={R.qc} id="win-qc" label="5 Oct" />

          <TrackerCard n={7} item={R.binding} id="win-binding" label="31 Dec" />
        </div>

        <div className="desk-prose mt-14">
          <p className="desk-kicker">The pricing detail most people get wrong</p>
          <div className="desk-grid-hair mt-4 sm:grid-cols-3" data-rise>
            <div className="p-5 sm:p-6">
              <Figure
                value={M.mou.value}
                unit={`${M.mou.unit} · rejected MOU`}
                status={M.mou.status}
                size="md"
                sources={sourceList(M.mou.sources)}
                lastVerified={M.mou.lastVerified}
                note={M.mou.note.plain}
              />
            </div>
            <div className="p-5 sm:p-6">
              <Figure
                value={M.reported.value}
                unit={`${M.reported.unit} · new HQ path`}
                status={M.reported.status}
                size="md"
                sources={sourceList(M.reported.sources)}
                lastVerified={M.reported.lastVerified}
                note={M.reported.note.plain}
              />
            </div>
            <div className="p-5 sm:p-6">
              <Figure
                value={P.qc13.value}
                unit="¢/kWh · HQ compute rate, proposed"
                status={P.qc13.status}
                size="md"
                sources={sourceList(P.qc13.sources)}
                lastVerified={P.qc13.lastVerified}
                note={P.qc13.note}
              />
            </div>
          </div>
          <Unfold
            id="win-pricing"
            className="mt-6"
            label="1.8¢"
            plain={
              <p className="desk-takeaway">
                The rejected memorandum’s headline average was not a flat rate. NL Hydro now describes
                Hydro-Québec paying <Fig id="a">1.8¢</Fig> in 2027, rising to <Fig id="b">11.5¢</Fig>{" "}
                by 2041. Québec’s proposed compute tariff is <Fig id="c">13¢</Fig>. Partners who model
                the old path, or treat the new export price as an industrial rate, get the offtake
                case wrong.
              </p>
            }
            technical={
              <>
                <p>{M.reported.note.technical}</p>
                <p>{P.qc13.note}</p>
              </>
            }
            sources={[
              ...sourceList(M.reported.sources).slice(0, 3),
              DESK_SOURCES.ircBriefing,
              DESK_SOURCES.hqDataCentreTariff,
            ]}
          />
        </div>

        <div className="mt-14">
          <div className="desk-prose">
            <p className="desk-kicker">The default path</p>
            <p className="desk-body mt-3">
              The <Term k="material-terms">Material Terms</Term> already name a buyer for retained
              power that is not used at home. Indecision has a price written in the paper.
            </p>
          </div>
          <div className="mt-6" data-rise>
            <DefaultPath />
          </div>
        </div>

        <div className="desk-prose mt-14">
          <Card
            n={8}
            kicker={
              <>
                {R.labWest.when} · {R.labWest.title}
              </>
            }
            figure={
              C.corridor.figure ? (
                <Figure
                  value={C.corridor.figure}
                  unit="735 kV transfer limit · study"
                  status="reported"
                  size="sm"
                  sources={sourceList(C.corridor.sources)}
                  lastVerified={C.corridor.lastVerified}
                  note={C.corridor.figureNote}
                />
              ) : null
            }
          >
            <div className="mt-2">
              <StatusPill status={R.labWest.status} />
            </div>
            <Unfold
              id="win-corridor"
              className="mt-3"
              label="the line"
              plain={
                <p className="desk-takeaway">
                  The independent review recommended new transmission to Labrador West for
                  energy-intensive industry. {R.labWest.body.plain} Mines remain first in line.
                  Compute still has to earn peer status on the merits; it is not reserved.
                </p>
              }
              technical={
                <>
                  <p>{R.labWest.body.technical}</p>
                  <p>{C.corridor.body.technical}</p>
                </>
              }
              sources={sourceList(R.labWest.sources)}
            />
          </Card>
        </div>
      </DeskSection>

      {/* 03 ─────────────────────────────────────────────────────────────── */}
      <DeskSection
        id="industry"
        num="03 — Who the power is for"
        title="Mines and Labrador industry first. Compute only if the paper writes it."
        intro={
          <>
            <p>
              The coalition is assembled around keeping firm power in Newfoundland and Labrador: for
              operating mines, towns, Indigenous partners, and other industrial load that lives here.
              It is not assembled around an Open People offtake, a reserved Labrador data-centre
              block, or a FID path we do not have.
            </p>
            <p className="mt-4">
              Compute is optional context for leftover firm hydro, not a queue position, and not why
              this coalition exists. No firm MW, price, or policy preference for Labrador compute is
              confirmed. Detail on the{" "}
              <Link href="/compute" className="desk-link">
                separate page
              </Link>
              .
            </p>
          </>
        }
        wide
      >
        <div className="desk-prose grid gap-3">
          <section className="desk-surface p-5 sm:p-6" data-rise>
            <StatusPill status={C.minerals.rank} />
            <h3 className="desk-h3 mt-3">{C.minerals.title}</h3>
            <Unfold
              id="ind-named-minerals"
              className="mt-3"
              label="minerals"
              plain={<p className="desk-takeaway">{C.minerals.body.plain}</p>}
              technical={C.minerals.body.technical}
              sources={sourceList(C.minerals.sources)}
            />
          </section>

          <section className="desk-surface p-5 sm:p-6" data-rise>
            <StatusPill status="secondary" />
            <h3 className="desk-h3 mt-3">Neighbours are rationing compute</h3>
            <Unfold
              id="ind-neighbours"
              className="mt-3"
              label="13¢"
              plain={
                <p className="desk-takeaway">
                  {COMPUTE_NEIGHBOURS.plain} Displaced demand exists. It has no Labrador reservation.
                  Eligibility is a contract-text question.
                </p>
              }
              technical={COMPUTE_NEIGHBOURS.technical}
              sources={[DESK_SOURCES.hqDataCentreTariff, DESK_SOURCES.aesoCap]}
            />
          </section>

          <section className="desk-surface p-5 sm:p-6" data-rise>
            <StatusPill status="secondary" />
            <h3 className="desk-h3 mt-3">Three reads with no figures attached</h3>
            <ul className="desk-rule-list mt-4">
              <li>
                <span className="n">01</span>
                <span className="text-[15px] text-[var(--ink-2)]">
                  Remote hydro has precedents elsewhere. That is a partnership shape partners could
                  copy if NL writes compute eligible. It is not a Labrador offtake we hold.
                </span>
              </li>
              <li>
                <span className="n">02</span>
                <span className="text-[15px] text-[var(--ink-2)]">
                  A federal sovereign compute programme exists. Its first intake windows closed in
                  2026 with no NL entrant. A future window is not a present allocation.
                </span>
              </li>
              <li>
                <span className="n">03</span>
                <span className="text-[15px] text-[var(--ink-2)]">
                  Latency is not the blocker for training workloads. Labrador would be a training and
                  batch play, not edge inference, if it is eligible at all.
                </span>
              </li>
            </ul>
          </section>
        </div>

        <div className="desk-prose mt-10">
          <p className="desk-body">
            Cold climate helps, but it is a tiebreaker, not the moat.{" "}
            <strong className="font-semibold text-[var(--ink)]">
              Firm clean power at scale is the scarce asset.
            </strong>{" "}
            Scale discipline: a gigawatt of continuous load is a large share of the province’s yearly{" "}
            <Term k="twh">TWh</Term>. The whole renewable output is a handful of large campuses. This
            resource is enormous for Newfoundland and Labrador and finite against global ambition.
            Plan against the finite number, and against mining’s first claim on it.
          </p>
        </div>
      </DeskSection>

      {/* 04 ─────────────────────────────────────────────────────────────── */}
      <DeskSection
        id="roles"
        num="04 — Coalition roles"
        title="Partners would own the steel. Open People is a catalyst, not a buyer."
        intro={
          <p>
            Useful if a partner is asking who would carry what, if leftover firm power is written
            eligible for industrial uses including compute. None of this is a present offtake, a FID
            path, or a reserved Labrador DC block.
          </p>
        }
      >
        <div className="border-y border-[var(--hairline)]" data-rise>
          {ROLES.map((r) => (
            <div
              key={r.layer}
              className="grid gap-x-6 gap-y-1 border-t border-[var(--hairline)] py-4 first:border-t-0 sm:grid-cols-[9rem_minmax(0,1fr)]"
            >
              <div className="desk-kicker" style={r.accent ? undefined : { color: "var(--steel)" }}>
                {r.layer}
              </div>
              <div>
                <p className="text-[15px] leading-relaxed text-[var(--ink-2)]">{r.what}</p>
                <p
                  className="desk-fact mt-1.5"
                  style={{ color: r.accent ? "var(--plasma)" : "var(--ink-3)" }}
                >
                  {r.who}
                </p>
              </div>
            </div>
          ))}
        </div>

        <h3 className="desk-h3 mt-12">The sequence we will not skip</h3>
        <ol className="desk-rule-list mt-4" data-rise>
          {SEQUENCE.map((s, i) => (
            <li key={s}>
              <span className="n">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-[15px] text-[var(--ink-2)]">{s}</span>
            </li>
          ))}
        </ol>

        <h3 className="desk-h3 mt-12">Two vehicles, still hypothetical</h3>
        <p className="desk-body mt-4">
          <strong className="font-semibold text-[var(--ink)]">Open People</strong> is the operating
          company and the public voice: government relations, evidence, and, only if partners build
          capacity, a software layer. It is not an anchor tenant today and it is not a demand
          aggregator with contracts in hand.
        </p>
        <p className="desk-body mt-4">
          <strong className="font-semibold text-[var(--ink)]">LabradorCo</strong>, a separate
          development vehicle with incorporation pending, would be a clean legal surface for Crown,
          Innu, and infrastructure partners to take equity in, without entangling the operating
          company. It is not formed, has no offtake, and has no reserved megawatts. If it is ever
          used, incentives on a facility would be promote and carry, not construction margin.
        </p>

        <aside className="mt-10 border-l-2 border-[var(--steel)] bg-[var(--steel-soft)] p-5 sm:p-6">
          <p className="desk-kicker" style={{ color: "var(--steel)" }}>
            Planning floor · hypothetical · not permitted, not reserved, not FID
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-2)]">
            A 1–10 MW facility inside existing recall headroom is the planning floor partners
            sometimes ask about: small enough to discuss without hyperscale capital, large enough to
            be real. One job it would do, if it ever existed, is bury the memory of the crypto
            operation that went bankrupt here in 2019 owing NL Hydro and ACOA, and which still shapes
            how “data centre” is heard in this province. No crypto. Permanent.
          </p>
        </aside>
      </DeskSection>

      {/* 05 ─────────────────────────────────────────────────────────────── */}
      <DeskSection
        id="capital"
        num="05 — Capital structure"
        title="Planning estimates for a hypothetical partner node. Not a reserved block."
        intro={
          <p>
            These figures are partner-confidential working numbers for a compute facility, if
            leftover firm power is written eligible. They are not a budget Open People is raising, not
            a Labrador reservation, and not FID. We mapped them so conversations start from the real
            cost of steel rather than enthusiasm. None of them is a government figure, and none
            appears on an instrument on this site.
          </p>
        }
      >
        <aside className="border-l-2 border-[var(--steel)] bg-[var(--steel-soft)] p-5 sm:p-6" data-rise>
          <p className="desk-kicker" style={{ color: "var(--steel)" }}>
            Planning estimate · hypothetical partner node · not a reserved block
          </p>

          <p className="desk-fact mt-5 text-[var(--ink-3)]">Scenarios</p>
          <PlanningList
            rows={[
              {
                k: "Partner mid · ~55 MW IT load",
                v: "~$3.94B base (target $3.00B) · range $2.07B – $7.94B",
                d: "Modelled. Not a budget, not a reservation, not FID.",
              },
              {
                k: "Micro-node floor · ~5 MW",
                v: "financeable without hyperscale capital",
                d: "Inside existing recall headroom, if eligible. Not permitted, not reserved.",
              },
            ]}
          />

          <p className="desk-fact mt-6 text-[var(--ink-3)]">Who bears what (base · lines)</p>
          <PlanningList
            rows={[
              {
                k: "Partner",
                v: "$3.91B · 26 lines",
                d: "GPUs, shell, MEP, remote-Labrador premiums, contingency, financing.",
              },
              { k: "Shared", v: "$26.0M · 3 lines", d: "Legal / SPV, Indigenous engagement, fibre IRU." },
              {
                k: "Open People",
                v: "$1.5M · 2 lines",
                d: "Catalyst GR / public campaign plus software sketch, Y0–Y2. Not offtake assembly.",
              },
              { k: "LabradorCo", v: "$750K · 1 line", d: "Developer promote / origination." },
              {
                k: "Unassigned",
                v: "— · 2 lines",
                d: "Upstream transmission and submarine capacity share. Bearer undetermined pending diligence.",
              },
            ]}
          />
          <p className="desk-fact mt-3 text-[var(--ink-3)]">
            The remaining four lines are non-additive planning cross-checks.
          </p>

          <p className="desk-fact mt-6 text-[var(--ink-3)]">Cost basis (2025–26 pricing)</p>
          <PlanningList
            rows={[
              { k: "Facility-only capex", v: "roughly $10–30M per MW" },
              { k: "All-in with GPUs", v: "commonly $50–60M per MW" },
              {
                k: "GPU block alone, mid scenario",
                v: "~$1.93B",
                d: "Which is exactly why Open People does not want to own it, and why partners would. The higher the all-in numbers go, the stronger the case for a catalyst position, not weaker.",
              },
            ]}
          />

          <div className="mt-8 border-t border-[var(--hairline)] pt-5">
            <p className="desk-kicker" style={{ color: "var(--amber)" }}>
              16 open gaps we will not paper over
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-2)]">
              Of 38 cost lines, 16 are flagged as research gaps, the honest ones for remote Labrador.
              FIFO and labour premium versus metro. Workforce camp. Heavy logistics, port and
              winter-road risk. Insurance adders. Site prep and cold-climate envelope. On-site
              substation. Upstream transmission, if assigned. Submarine capacity share. Indigenous
              agreements budget. Year-one power OpEx, pending the current tariff.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-2)]">
              A partner with operating history in any of these closes a gap the moment they join.
              That is a real and immediate form of contribution.
            </p>
          </div>
        </aside>
      </DeskSection>

      {/* 06 ─────────────────────────────────────────────────────────────── */}
      <DeskSection
        id="roadmap"
        num="06 — Working timeline"
        title="Gates are honesty checks. We do not advance on vibes, or on offtake we do not have."
      >
        <div className="border-y border-[var(--hairline)]" data-rise>
          {PHASES.map((p) => (
            <div
              key={p.yr}
              className={`grid gap-x-6 gap-y-1 border-t border-[var(--hairline)] py-4 first:border-t-0 sm:grid-cols-[7rem_minmax(0,1fr)] ${
                p.now ? "bg-[var(--plasma-soft)] px-3 sm:-mx-3" : ""
              }`}
            >
              <div className="desk-kicker pt-0.5">
                {p.yr}
                {p.now ? <span className="ml-2 text-[var(--plasma-bright)]">· now</span> : null}
              </div>
              <div>
                <p className="text-[15px] font-semibold text-[var(--ink)]">{p.t}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-[var(--ink-3)]">{p.d}</p>
              </div>
            </div>
          ))}
        </div>

        <h3 className="desk-h3 mt-12">What success looks like in 2031</h3>
        <p className="desk-body mt-4">
          At least three of these are true: unused retained power does not slide west by default;
          recall and domestic-load definitions are in public contract text a voter can check; an
          Innu Nation partnership exists before any large Labrador build; mines and towns are served
          first; leftover firm power may be eligible for named uses including compute if written;
          Open People is cited as a serious provincial voice on value kept in-province, not as a DCIA
          party or a demand seat we never held.
        </p>
      </DeskSection>

      {/* 07 ─────────────────────────────────────────────────────────────── */}
      <DeskSection
        id="status"
        num="07 — Where it stands today"
        title="Y0. Public voice built, first letters out, window still open."
        wide
      >
        <div className="desk-prose">
          <h3 className="desk-h3">Done</h3>
          <ul className="desk-rule-list mt-4" data-rise>
            {DONE.map((d, i) => (
              <li key={d}>
                <span className="n">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[15px] text-[var(--ink-2)]">{d}</span>
              </li>
            ))}
          </ul>

          <h3 className="desk-h3 mt-12">In flight</h3>
          <ul className="mt-4 border-y border-[var(--hairline)]" data-rise>
            {IN_FLIGHT.map((f) => (
              <li
                key={f.text}
                className="grid grid-cols-[4rem_minmax(0,1fr)] items-baseline gap-3 border-t border-[var(--hairline)] py-3 first:border-t-0"
              >
                <Pill tone={f.tone}>{f.pill}</Pill>
                <span className="text-[15px] text-[var(--ink-2)]">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="desk-prose mt-12">
          <h3 className="desk-h3">Watch items</h3>
          <div className="mt-4 grid gap-3">
            <TrackerCard
              n={1}
              item={R.binding}
              id="st-binding"
              label="31 Mar"
              figure={<Pill tone="plasma">P0</Pill>}
              plain={
                <>
                  Binding definitive agreements are targeted around <Fig id="a">31 December</Fig>;
                  the framework can run to <Fig id="b">31 March 2027</Fig>. That closes the
                  architecture window. The House vote is not that close. Watch for use restrictions
                  on in-province allocation. Compute is still unnamed and unreserved.
                </>
              }
            />

            <Card n={2} kicker="Replies to letters 1–3" figure={<Pill tone="plasma">P0</Pill>}>
              <p className="desk-takeaway mt-3">
                Recall headroom, dark fibre, the current rate schedule, federal intake timing, cable
                landing. Information only. No asks were made.
              </p>
            </Card>

            <TrackerCard
              n={3}
              item={R.qcInnu}
              id="st-innu"
              label="the Innu file"
              figure={<Pill>P1</Pill>}
              plain={
                <>
                  <Term k="innu-nation">Innu Nation</Term> partnership, royalty and Gull Island
                  tariff path are unresolved after the vote. Innu Nation says its benefits were cut
                  by more than half; no meeting is scheduled. Innu communities on the Québec side say
                  their consent is mandatory too. We engage on their timeline, not ours.
                </>
              }
              technical={
                <>
                  <p>{R.innu.body.technical}</p>
                  <p>{R.qcInnu.body.technical}</p>
                </>
              }
              sources={[
                DESK_SOURCES.vocmInnuContact,
                DESK_SOURCES.radioCanadaInnu,
                DESK_SOURCES.vocmInnuReady,
                DESK_SOURCES.aptnQcInnu,
              ]}
            />

            <TrackerCard
              n={4}
              item={R.wind}
              id="st-wind"
              label="the SPE"
              figure={<Pill>P1</Pill>}
              plain={
                <>
                  The paper leaves the wind company, an <Term k="spe">SPE</Term>, unnamed and at NL
                  Hydro’s sole discretion. Do not invent the name, the dollar figure, or a federal
                  share.
                </>
              }
            />

            <TrackerCard
              n={5}
              item={R.qc}
              id="st-qc"
              label="5 Oct"
              figure={<Pill>P1</Pill>}
              plain={
                <>
                  Québec votes <Fig id="a">5 October</Fig>; the party that signed is running third.
                  Ottawa has not confirmed this plant matches the older review of roughly{" "}
                  <Fig id="b">2,000 MW</Fig>. Hydro-Québec’s <Fig id="c">13¢</Fig> compute rate
                  awaits the Régie. Political gate, live assessment gap, displacement context.
                </>
              }
              technical={
                <>
                  <p>{R.qc.body.technical}</p>
                  <p>{SCALE_ANCHORS.federalAssessmentEngage.technical}</p>
                  <p>{P.qc13.note}</p>
                </>
              }
              sources={[
                DESK_SOURCES.qcElection,
                DESK_SOURCES.radioCanadaQcOpposition,
                DESK_SOURCES.cbcIaac,
                DESK_SOURCES.hqDataCentreTariff,
              ]}
            />
          </div>
        </div>
      </DeskSection>

      {/* 08 ─────────────────────────────────────────────────────────────── */}
      <DeskSection
        id="you"
        num="08 — Where you fit"
        title="A coalition to keep the power here, not to join a campus we do not have."
        intro={
          <p>
            We are not raising from you in this conversation. The coalition is mines, towns,
            Indigenous partners, infrastructure, and whoever would actually use in-province power. A
            partner list makes the provincial ask credible. It is not a substitute for offtake Open
            People does not hold.
          </p>
        }
      >
        <div className="border-y border-[var(--hairline)]" data-rise>
          {ASKS.map((a) => (
            <div key={a.who} className="border-t border-[var(--hairline)] py-5 first:border-t-0">
              <p className="desk-kicker" style={{ color: "var(--steel)" }}>
                {a.who}
              </p>
              <p className="mt-2 text-[15px] font-semibold text-[var(--ink)]">{a.lead}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-[var(--ink-2)]">{a.body}</p>
            </div>
          ))}
        </div>
      </DeskSection>

      {/* 09 ─────────────────────────────────────────────────────────────── */}
      <DeskSection
        id="rules"
        num="09 — How we work"
        title="The rules we hold ourselves to, and ask you to hold too."
      >
        <ol className="desk-rule-list" data-rise>
          {RULES.map((r, i) => (
            <li key={r.t}>
              <span className="n">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-[15px] text-[var(--ink-2)]">
                <strong className="font-semibold text-[var(--ink)]">{r.t}</strong> {r.d}
              </span>
            </li>
          ))}
        </ol>

        <aside className="mt-12 border-l-2 border-[var(--amber)] p-5 sm:p-6" data-rise>
          <p className="desk-kicker" style={{ color: "var(--amber)" }}>
            What is not proven — our standing honesty list
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-2)]">
            We would rather you hear this from us.
          </p>
          <ul className="desk-rule-list mt-4">
            {[...COMPUTE_HONESTY, ...HONESTY_EXTRA].map((line, i) => (
              <li key={line}>
                <span className="n">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[15px] text-[var(--ink-2)]">{line}</span>
              </li>
            ))}
            <li>
              <span className="n">{String(COMPUTE_HONESTY.length + HONESTY_EXTRA.length + 1).padStart(2, "0")}</span>
              <span className="text-[15px] text-[var(--ink-2)]">
                The current Labrador industrial rate is a formula (<Term k="lab-ind-1">LAB-IND-1</Term>
                ), not one posted cent. Anyone quoting a single mine ¢/kWh has flattened it. See{" "}
                <Link href="/costs#lab-ind-1" className="desk-link">
                  Costs
                </Link>
                .
              </span>
            </li>
          </ul>
          <p className="mt-5 text-[15px] leading-relaxed text-[var(--ink-2)]">
            Anyone who tells you these are settled is selling something. We are telling you they are
            the work.
          </p>
        </aside>
      </DeskSection>

      {/* close ──────────────────────────────────────────────────────────── */}
      <DeskSection id="close">
        <p className="desk-h2">
          If the next generation’s firm power is going to be priced while this paper is still paper,
          we’d rather a coalition were in it than writing about it afterward.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/engage" className="btn-primary">
            Get involved — keep firm power here
          </Link>
          <a
            href="mailto:tom@openpeople.ai?subject=Coalition%20%E2%80%94%20keep%20firm%20power%20in%20NL"
            className="btn-secondary"
          >
            Partner note to Tom
          </a>
        </div>
        <div className="desk-fact mt-10 leading-relaxed text-[var(--ink-2)]">
          <div>Tom Lane · Founder, Open People</div>
          <div className="mt-1 text-[var(--ink-3)]">
            Constituent / catalyst — not a DCIA party, offtake seat, or demand seat
          </div>
          <div className="mt-1">
            <Link href="/engage" className="desk-link">
              openpeople.ai/engage
            </Link>{" "}
            ·{" "}
            <a href="mailto:tom@openpeople.ai" className="desk-link">
              tom@openpeople.ai
            </a>
          </div>
          <div className="mt-1 text-[var(--ink-3)]">St. John&apos;s, Newfoundland and Labrador</div>
        </div>
        <div className="desk-fact mt-10 border-t border-[var(--hairline)] pt-5 leading-[1.9] text-[var(--ink-4)]">
          <div>PARTNER-CONFIDENTIAL — NOT FOR ONWARD DISTRIBUTION.</div>
          <div>
            Capital figures and structural detail in sections 04–07 are internal working numbers for
            a hypothetical partner node, shared in confidence. They are not an offtake, a FID, or a
            reserved megawatt block.
          </div>
          <div>
            Energy, market and timeline figures on this page render from the same source registry as
            the public desk (Canada Energy Regulator, NL Hydro, the Independent Review Committee, the
            DCIA text, and cited press), last verified {DESK_VERIFIED}. They map to Open People’s
            internal validity pack (audited 2026-07-24).
          </div>
          <div>
            Cost ranges are planning estimates with 16 of 38 lines flagged as open research gaps.
            Nothing here is an offer, a commitment, or investment advice.
          </div>
          <div>Open People · Phase 2 · coalition brief · {DESK_VERIFIED}</div>
        </div>
      </DeskSection>
    </DeskPage>
  );
}
