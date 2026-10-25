import Link from "next/link";
import { DESK_SOURCES, FLOW_BARS, type FlowFill } from "@/lib/desk";
import { Figure } from "@/components/marketing/depth";
import { SvgLines } from "./svg";

/**
 * I4 — Flow Bars. Proportional megawatt bars. Fill encodes how hard the
 * number is: solid published, outlined announced, hatched preliminary,
 * dashed not published.
 */
const W = 1100;
const LEFT = 340;
const RIGHT = 150;
const ROW_H = 54;
const TOP = 10;
const MAX_MW = 5500;
const BAR_H = 22;

function bw(mw: number): number {
  return ((W - LEFT - RIGHT) * Math.min(mw, MAX_MW)) / MAX_MW;
}

function fillAttrs(fill: FlowFill) {
  switch (fill) {
    case "solid":
      return {
        fill: "var(--ink-3)",
        stroke: "none",
        strokeDasharray: undefined,
      };
    case "outline":
      return {
        fill: "rgba(232,137,60,0.08)",
        stroke: "var(--plasma)",
        strokeDasharray: undefined,
      };
    case "hatch":
      return {
        fill: "url(#fb-hatch)",
        stroke: "var(--steel)",
        strokeDasharray: undefined,
      };
    case "dashed":
      return { fill: "none", stroke: "var(--alert)", strokeDasharray: "4 4" };
  }
}

export function FlowBars() {
  const H = TOP + FLOW_BARS.length * ROW_H + 8;
  return (
    <div className="inst flow-bars">
      <div className="inst-scroll">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-labelledby="fb-title fb-desc"
        >
          <title id="fb-title">
            Megawatts: published, announced, preliminary, not published
          </title>
          <desc id="fb-desc">
            Proportional bars for Churchill Falls capacity, NL Hydro&apos;s
            current Labrador allocation, mining load, the public retain framing,
            Gull Island, upgrades, the wind study, and the unpublished
            industrial queue.
          </desc>
          <defs>
            <pattern
              id="fb-hatch"
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="6"
                stroke="var(--steel)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          {FLOW_BARS.map((b, i) => {
            const y = TOP + i * ROW_H;
            const attrs = fillAttrs(b.fill);
            const indent = b.id === "mining-now" ? 16 : 0;
            const width = b.mw === null ? bw(2350) : bw(b.mw);
            const lowWidth = b.mwLow ? bw(b.mwLow) : null;
            const barX = LEFT + indent;
            const valueX = barX + width + 10;
            return (
              <g key={b.id} transform={`translate(0 ${y})`}>
                <SvgLines
                  text={b.label}
                  x={LEFT - 14}
                  y={24}
                  maxChars={22}
                  lineHeight={12}
                  textAnchor="end"
                  className="lbl lbl-strong"
                />
                {b.fill === "hatch" && lowWidth !== null ? (
                  <>
                    <rect
                      x={barX}
                      y={12}
                      width={lowWidth}
                      height={BAR_H}
                      fill="url(#fb-hatch)"
                      stroke="var(--steel)"
                      strokeWidth={1}
                    />
                    <rect
                      x={barX + lowWidth}
                      y={12}
                      width={Math.max(0, width - lowWidth)}
                      height={BAR_H}
                      fill="none"
                      stroke="var(--steel)"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                    />
                  </>
                ) : (
                  <rect
                    x={barX}
                    y={12}
                    width={width}
                    height={BAR_H}
                    {...attrs}
                    strokeWidth={1}
                  />
                )}
                <text
                  x={valueX}
                  y={28}
                  className="num"
                  style={{ fontSize: 12.5 }}
                >
                  {b.value}
                </text>
              </g>
            );
          })}
        </svg>
        <span className="inst-scroll-hint" aria-hidden>
          scroll sideways →
        </span>
      </div>

      <ul className="inst-legend" aria-label="Fill key">
        <li className="inst-legend-item">
          <span className="inst-swatch" data-fill="solid" />
          <span>Published or in a regulatory document</span>
        </li>
        <li className="inst-legend-item">
          <span className="inst-swatch" data-fill="outline" />
          <span>Announcement language (Government of NL release)</span>
        </li>
        <li className="inst-legend-item">
          <span className="inst-swatch" data-fill="hatch" />
          <span>Preliminary range or study, subject to studies</span>
        </li>
        <li className="inst-legend-item">
          <span className="inst-swatch" data-fill="dashed" />
          <span>Not published</span>
        </li>
      </ul>

      <div className="ladder-rows" role="list" aria-label="Megawatt figures">
        {FLOW_BARS.map((b) => (
          <div key={b.id} className="ladder-row" role="listitem">
            <div>
              <Figure
                value={b.value}
                status={b.status}
                size="sm"
                sources={b.sources.map((id) => DESK_SOURCES[id])}
                lastVerified={b.lastVerified}
                note={b.note}
              />
            </div>
            <div className="fam">{b.label}</div>
            <div className="d">
              {b.note}{" "}
              {b.href ? (
                <Link href={b.href} className="desk-link">
                  More →
                </Link>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
