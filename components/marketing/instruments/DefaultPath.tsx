"use client";

import { DESK_SOURCES, DESK_VERIFIED } from "@/lib/desk";
import { InstDetail, useInstSelect } from "./InstDetail";
import { InstFit } from "./svg";

/**
 * I7 — Default Path. The drawing is the fork. One branch is selected.
 * The four Hydro-Québec options open from the unused branch.
 */
const FACTS = {
  retain: {
    kicker: "Retained power",
    body: "Public framing: up to 2,350 MW from Churchill Falls and Gull Island. Announcement language, not a signed allocation.",
    figure: {
      value: "up to 2,350 MW",
      status: "framework" as const,
      sources: [DESK_SOURCES.govNlDcia, DESK_SOURCES.dciaHq],
      lastVerified: DESK_VERIFIED,
      note: "Gov NL 17 Aug 2026 announcement language. Not a signed industrial allocation, not a queue.",
    },
  },
  home: {
    kicker: "Used here",
    body: "Mines, towns, and Labrador industry. The definition of domestic load is not published.",
  },
  hq: {
    kicker: "Not used",
    body: "If it is not used at home, Hydro-Québec buys it. That branch is already written in the Material Terms. The home branch is not.",
    href: "/tracker#unused-retain",
    hrefLabel: "Tracker row →",
  },
  synthetic: {
    kicker: "Synthetic export",
    body: "Up to 280 MW, on three years' notice. One third New England, one third New York Astoria, one third Ontario PQAT, net of transmission.",
    figure: {
      value: "280 MW",
      status: "framework" as const,
      sources: [DESK_SOURCES.dciaHq],
      lastVerified: DESK_VERIFIED,
      note: "Synthetic export up to 280 MW (⅓ New England, ⅓ New York Astoria, ⅓ Ontario PQAT, net of transmission). Three years' prior notice.",
    },
  },
  chpe: {
    kicker: "CHPE-equivalent",
    body: "Up to 240 MW, on three years' notice.",
    figure: {
      value: "240 MW",
      status: "framework" as const,
      sources: [DESK_SOURCES.dciaHq],
      lastVerified: DESK_VERIFIED,
      note: "CHPE-equivalent access up to 240 MW. Three years' prior notice.",
    },
  },
  necec: {
    kicker: "NECEC-equivalent",
    body: "Up to 200 MW, on three years' notice.",
    figure: {
      value: "200 MW",
      status: "framework" as const,
      sources: [DESK_SOURCES.dciaHq],
      lastVerified: DESK_VERIFIED,
      note: "NECEC-equivalent access up to 200 MW. Three years' prior notice.",
    },
  },
  discount: {
    kicker: "Discounted PPA price",
    body: "Unplanned unused energy at 95% of the PPA price. No notice. Hydro-Québec must buy it.",
    figure: {
      value: "95%",
      status: "framework" as const,
      sources: [DESK_SOURCES.dciaHq, DESK_SOURCES.dciaNl],
      lastVerified: DESK_VERIFIED,
      note: "Schedule B §4(b)(iv): unplanned unused energy to serve domestic load may be sold to HQ at the Discounted PPA Price, 95% of the applicable PPA price. HQ is obligated to purchase.",
    },
  },
};

const OPTIONS = [
  { id: "synthetic", label: "Synthetic export", meta: "280 MW · 3-yr notice" },
  { id: "chpe", label: "CHPE-equivalent", meta: "240 MW · 3-yr notice" },
  { id: "necec", label: "NECEC-equivalent", meta: "200 MW · 3-yr notice" },
  { id: "discount", label: "Discounted PPA price", meta: "95% · no notice" },
] as const;

type FactId = keyof typeof FACTS;

export function DefaultPath() {
  const { active, select, hit } = useInstSelect<FactId>("retain");
  const fact = FACTS[active];
  const W = 1000;
  const H = 300;
  const src = { x: 180, y: 150 };
  const home = { x: 720, y: 72 };
  const hq = { x: 720, y: 228 };

  return (
    <div className="inst default-path">
      <InstFit
        wide={
        <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Default path for retained power">
          <title>The default path for unused retained power</title>
          <path
            d={`M ${src.x + 110} ${src.y - 16} C 420 ${src.y - 16}, 420 ${home.y}, ${home.x - 130} ${home.y}`}
            fill="none"
            className="stroke-plasma"
            strokeWidth={2}
          />
          <path
            d={`M ${src.x + 110} ${src.y + 16} C 420 ${src.y + 16}, 420 ${hq.y}, ${hq.x - 130} ${hq.y}`}
            fill="none"
            className="stroke-amber"
            strokeWidth={2}
            strokeDasharray="6 5"
          />

          <g transform={`translate(${src.x} ${src.y})`} {...hit("retain", "Retained power")}>
            <rect x={-110} y={-32} width={220} height={64} fill="var(--surface-2)" stroke="var(--ink)" strokeWidth={1} />
            <text y={-4} textAnchor="middle" className="lbl lbl-strong">
              Retained power
            </text>
            <text y={16} textAnchor="middle" className="num" style={{ fontSize: 13 }}>
              up to 2,350 MW
            </text>
          </g>

          <g transform={`translate(${home.x} ${home.y})`} {...hit("home", "Used here")}>
            <rect x={-130} y={-28} width={260} height={56} fill="var(--surface-2)" stroke="var(--plasma)" strokeWidth={1} />
            <text y={-4} textAnchor="middle" className="lbl plasma">
              Used here
            </text>
            <text y={16} textAnchor="middle" className="lbl lbl-strong">
              Mines, towns, industry
            </text>
          </g>

          <g transform={`translate(${hq.x} ${hq.y})`} {...hit("hq", "Hydro-Québec buys it")}>
            <rect
              x={-130}
              y={-28}
              width={260}
              height={56}
              fill="var(--surface-2)"
              stroke="var(--amber)"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <text y={-4} textAnchor="middle" className="lbl amber">
              Not used
            </text>
            <text y={16} textAnchor="middle" className="lbl lbl-strong">
              Hydro-Québec buys it
            </text>
          </g>
        </svg>
        }
        narrow={<NarrowPath active={active} hit={hit} />}
      />

      <div className="inst-choices" role="group" aria-label="Section 4 options">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className="inst-choice"
            aria-pressed={active === option.id}
            onClick={() => select(option.id)}
          >
            {option.label}
            <span>{option.meta}</span>
          </button>
        ))}
      </div>

      <InstDetail {...fact} />
      <p className="inst-caption">
        Framework, not executed. These are Material Terms for later contracts.
      </p>
    </div>
  );
}

function NarrowPath({
  active,
  hit,
}: {
  active: FactId;
  hit: ReturnType<typeof useInstSelect<FactId>>["hit"];
}) {
  const cards: { id: FactId; y: number; title: string; value: string }[] = [
    { id: "retain", y: 16, title: "Retained power", value: FACTS.retain.figure?.value ?? "" },
    { id: "home", y: 156, title: "Used here", value: "Mines, towns, industry" },
    { id: "hq", y: 296, title: "Not used", value: "Hydro-Québec buys it" },
  ];
  return (
    <svg viewBox="0 0 400 420" role="group" aria-label="Default path for retained power">
      <title>Retained power, then the fork</title>
      <line x1={28} y1={96} x2={28} y2={300} className="hair" />
      {cards.map((card) => {
        const on = active === card.id;
        return (
          <g key={card.id} {...hit(card.id, `${card.title}, ${card.value}`)}>
            <rect
              x={48}
              y={card.y}
              width={336}
              height={84}
              fill={on ? "var(--surface-2)" : "var(--surface-1)"}
              stroke={card.id === "hq" ? "var(--amber)" : card.id === "home" ? "var(--plasma)" : "var(--ink)"}
              strokeDasharray={card.id === "hq" ? "4 4" : undefined}
            />
            <text x={68} y={card.y + 32} className="lbl-read">
              {card.title}
            </text>
            <text x={68} y={card.y + 58} className="num" style={{ fontSize: 16 }}>
              {card.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
