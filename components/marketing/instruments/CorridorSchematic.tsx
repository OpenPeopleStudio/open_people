"use client";

import { DESK_SOURCES, DESK_VERIFIED } from "@/lib/desk";
import { InstDetail, useInstSelect, type InstFigure } from "./InstDetail";
import { InstFit } from "./svg";

/**
 * I5 — Corridor Schematic. Not a map. The drawing shows the route and one
 * label per line. The sentences and sources sit in the legend.
 */
type PartId = "west" | "plant" | "export" | "proposed" | "town";

const PARTS: Record<
  PartId,
  { kicker: string; body: string; figure?: InstFigure }
> = {
  west: {
    kicker: "Labrador West",
    body: "Mining load on the two 230 kV lines. Those lines are at their operational limit. Press cite, not a PUB order.",
    figure: {
      value: "~312 MW",
      status: "reported",
      sources: [DESK_SOURCES.cbcMining, DESK_SOURCES.nlhLabWest],
      lastVerified: DESK_VERIFIED,
      note: "Mining load sold to IOC and Tacora on the two Labrador West lines, per NL Hydro officials (CBC, Jan 2025). Press cite, not a PUB order. Those 230 kV lines are at their operational limit.",
    },
  },
  plant: {
    kicker: "Churchill Falls",
    body: "Rated capacity of the existing plant.",
    figure: {
      value: "5,428 MW",
      status: "published-rate",
      sources: [DESK_SOURCES.cerNl],
      lastVerified: DESK_VERIFIED,
      note: "Rated capacity of the existing Churchill Falls plant (CER provincial profile).",
    },
  },
  export: {
    kicker: "Québec",
    body: "Roughly 90% of Churchill Falls output flows to Québec.",
    figure: {
      value: "~90%",
      status: "reported",
      sources: [DESK_SOURCES.cerNl],
      lastVerified: DESK_VERIFIED,
      note: "CER provincial profile: roughly 90% of Churchill Falls output flows to Québec.",
    },
  },
  proposed: {
    kicker: "735 kV proposed",
    body: "A single 735 kV line, transfer limit about 1,500 MW. Funded in the public framing. No in-service date.",
    figure: {
      value: "~1,500 MW",
      status: "framework",
      sources: [DESK_SOURCES.nlhContractorOct, DESK_SOURCES.nlhLabWest, DESK_SOURCES.govNlDcia],
      lastVerified: DESK_VERIFIED,
      note: "NL Hydro October 2026 contractor notice: a single 735 kV line with a maximum transfer of approximately 1,500 MW — a ceiling, not a reserved block. Funded in the public framing. No in-service date.",
    },
  },
  town: {
    kicker: "Happy Valley–Goose Bay",
    body: "Drawn because the town already sits on the system. Not a new industrial allocation.",
  },
};

export function CorridorSchematic() {
  const { active, hit } = useInstSelect<PartId>("west");
  const W = 1000;
  const H = 400;
  const lw = { x: 150, y: 128 };
  const cf = { x: 500, y: 128 };
  const qc = { x: 860, y: 128 };
  const hvgb = { x: 730, y: 330 };
  const west = (lw.x + cf.x) / 2;
  const east = (cf.x + qc.x) / 2;

  return (
    <div className="inst corridor">
      <InstFit
        wide={
        <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label="The corridor the mines need">
          <title id="cs-title">The corridor the mines need</title>
          <desc id="cs-desc">
            Schematic, not a map. Churchill Falls at the centre. Two existing
            230 kV lines run west to Labrador West and are at their operational
            limit. A proposed 735 kV line with about 1,500 MW of transfer is
            funded but has no in-service date. Export lines run to Québec, and
            about 90 percent of Churchill Falls output flows there. Happy
            Valley–Goose Bay also sits on the system.
          </desc>

          {/* Existing 230 kV, west. Two circuits, one label above, status below. */}
          <line
            x1={lw.x + 46}
            y1={lw.y - 8}
            x2={cf.x - 46}
            y2={cf.y - 8}
            className="hair"
            strokeWidth={1.75}
          />
          <line
            x1={lw.x + 46}
            y1={lw.y + 8}
            x2={cf.x - 46}
            y2={cf.y + 8}
            className="hair"
            strokeWidth={1.75}
          />
          <text x={west} y={lw.y - 28} textAnchor="middle" className="lbl">
            2 × 230 kV
          </text>
          <text x={west} y={lw.y + 36} textAnchor="middle" className="lbl amber">
            at limit
          </text>

          <g {...hit("proposed", "735 kV proposed")}>
            <rect x={lw.x - 20} y={lw.y + 32} width={cf.x - lw.x + 40} height={150} fill="transparent" />
            <line
              x1={lw.x}
              y1={lw.y + 32}
              x2={lw.x}
              y2={250}
              className="stroke-steel"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
          <line
            x1={cf.x}
            y1={cf.y + 32}
            x2={cf.x}
            y2={250}
            className="stroke-steel"
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
          <line
            x1={lw.x}
            y1={250}
            x2={cf.x}
            y2={250}
            className="stroke-steel"
            strokeWidth={2}
            strokeDasharray="7 6"
          />
          <text x={west} y={274} textAnchor="middle" className="lbl steel">
            735 kV proposed
          </text>
          </g>

          {/* Export east. Three circuits, one short label. */}
          <line
            x1={cf.x + 46}
            y1={cf.y - 12}
            x2={qc.x - 52}
            y2={qc.y - 12}
            className="stroke-plasma"
            strokeWidth={1.5}
          />
          <line
            x1={cf.x + 46}
            y1={cf.y}
            x2={qc.x - 52}
            y2={qc.y}
            className="stroke-plasma"
            strokeWidth={1.5}
          />
          <line
            x1={cf.x + 46}
            y1={cf.y + 12}
            x2={qc.x - 52}
            y2={qc.y + 12}
            className="stroke-plasma"
            strokeWidth={1.5}
          />
          <text x={east} y={cf.y - 32} textAnchor="middle" className="lbl plasma">
            ~90%
          </text>

          {/* Spur south-east. Starts under Churchill Falls, clear of the proposed line. */}
          <line
            x1={cf.x + 44}
            y1={cf.y + 22}
            x2={hvgb.x - 12}
            y2={hvgb.y}
            className="hair"
            strokeWidth={1.5}
          />

          <g transform={`translate(${lw.x} ${lw.y})`} {...hit("west", "Labrador West")}>
            <rect
              x={-44}
              y={-32}
              width={88}
              height={64}
              fill="var(--surface-2)"
              stroke="var(--plasma)"
              strokeWidth={1}
            />
            <text y={-44} textAnchor="middle" className="lbl lbl-strong">
              Labrador West
            </text>
            <text y={6} textAnchor="middle" className="num" style={{ fontSize: 15 }}>
              ~312 MW
            </text>
          </g>

          <g transform={`translate(${cf.x} ${cf.y})`} {...hit("plant", "Churchill Falls")}>
            <rect
              x={-44}
              y={-32}
              width={88}
              height={64}
              fill="var(--surface-2)"
              stroke="var(--ink)"
              strokeWidth={1}
            />
            <text y={-44} textAnchor="middle" className="lbl lbl-strong">
              Churchill Falls
            </text>
            <text y={2} textAnchor="middle" className="num" style={{ fontSize: 16 }}>
              5,428
            </text>
            <text y={18} textAnchor="middle" className="lbl" style={{ fontSize: 9 }}>
              MW
            </text>
          </g>

          <g transform={`translate(${qc.x} ${qc.y})`} {...hit("export", "Québec")}>
            <rect
              x={-50}
              y={-32}
              width={100}
              height={64}
              fill="none"
              stroke="var(--plasma)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <text y={4} textAnchor="middle" className="lbl lbl-strong">
              Québec
            </text>
          </g>

          <g transform={`translate(${hvgb.x} ${hvgb.y})`} {...hit("town", "Happy Valley–Goose Bay")}>
            <circle
              r={5}
              fill="var(--surface-2)"
              stroke="var(--ink-3)"
              strokeWidth={1}
            />
            <text x={14} y={4} className="lbl">
              Happy Valley–Goose Bay
            </text>
          </g>
        </svg>
        }
        narrow={<NarrowCorridor active={active} hit={hit} />}
      />

      <InstDetail {...PARTS[active]} />
      <p className="inst-caption">
        Schematic only. Line lengths and positions are not a map. Select a part. Open the number for its source.
      </p>
    </div>
  );
}

function NarrowCorridor({
  active,
  hit,
}: {
  active: PartId;
  hit: ReturnType<typeof useInstSelect<PartId>>["hit"];
}) {
  const width = 400;
  const cards: { id: PartId; y: number; h: number; title: string; value?: string | undefined }[] = [
    { id: "west", y: 12, h: 76, title: "Labrador West", value: PARTS.west.figure?.value },
    { id: "proposed", y: 132, h: 64, title: "735 kV proposed", value: PARTS.proposed.figure?.value },
    { id: "plant", y: 248, h: 76, title: "Churchill Falls", value: PARTS.plant.figure?.value },
    { id: "export", y: 348, h: 64, title: "Québec", value: PARTS.export.figure?.value },
    { id: "town", y: 436, h: 56, title: "Happy Valley–Goose Bay" },
  ];
  return (
    <svg viewBox={`0 0 ${width} 508`} role="group" aria-label="The corridor the mines need">
      <title>The corridor, top to bottom</title>
      <text x={28} y={112} className="lbl">
        2 × 230 kV · at limit
      </text>
      <text x={28} y={224} className="lbl">
        export east
      </text>
      {cards.map((card) => {
        const on = active === card.id;
        return (
          <g key={card.id} {...hit(card.id, card.value ? `${card.title}, ${card.value}` : card.title)}>
            <rect
              x={12}
              y={card.y}
              width={width - 24}
              height={card.h}
              fill={on ? "var(--surface-2)" : "var(--surface-1)"}
              stroke="var(--hairline-strong)"
            />
            <text x={28} y={card.y + (card.value ? 28 : 34)} className="lbl-read">
              {card.title}
            </text>
            {card.value ? (
              <text x={28} y={card.y + 54} className="num" style={{ fontSize: 18 }}>
                {card.value}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
