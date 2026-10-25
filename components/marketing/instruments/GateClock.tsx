import Link from "next/link";
import { DESK_SOURCES, DESK_VERIFIED, GATES, railPosition, type Gate } from "@/lib/desk";
import { Figure } from "@/components/marketing/depth";
import { layoutGateLabels } from "./layout";
import { SvgLines } from "./svg";
import { GateLive, TodayMarker } from "./GateClockLive";

/**
 * I1 — the Gate Clock. A horizontal time rail from the framework signing to
 * the end of its term, with the off-scale Gull Island year beyond a break.
 * Geometry is static (server); the today marker and the day counters are
 * small client islands so the page can stay static.
 */
const W = 1100;
const H = 210;
const PAD = 56;
const RAIL_Y = 108;
const ON_SCALE_W = 790;
const OFF_X = PAD + ON_SCALE_W + 96;

function x(gate: Gate): number {
  if (gate.offscale) return OFF_X;
  return PAD + railPosition(gate.date, GATES) * ON_SCALE_W;
}

export function GateClock({ compact = false }: { compact?: boolean }) {
  const onScale = GATES.filter((g) => !g.offscale);
  const off = GATES.filter((g) => g.offscale);
  const compactY = 40;
  const compactXs = onScale.map((g) => x(g));
  const compactSlots = layoutGateLabels(compactXs, {
    minSep: 70,
    leftEdge: PAD + 40,
    rightEdge: PAD + ON_SCALE_W - 40,
  });

  if (compact) {
    return (
      <div className="gate-clock-compact inst" aria-label="Gate clock">
        <div className="inst-scroll">
          <svg viewBox={`0 0 ${W} 80`} role="img" aria-labelledby="gc-c-title">
            <title id="gc-c-title">
              Gates on the Churchill Falls framework, with today marked
            </title>
            <desc>
              Dates on the rail: 17 August framework signed, 17 September House
              endorsement, 5 October Québec election, 21 October Québec cabinet,
              17 November National Assembly returns, 31 December binding target,
              31 March term end. Full names sit in the tracker.
            </desc>
            <line
              x1={PAD}
              x2={PAD + ON_SCALE_W}
              y1={compactY}
              y2={compactY}
              className="hair"
            />
            {onScale.map((g, i) => {
              const slot = compactSlots[i]!;
              const dir = slot.side === "above" ? -1 : 1;
              return (
                <g key={g.id} transform={`translate(${x(g)} ${compactY})`}>
                  <line y1={dir * 12} y2={0} className="hair" />
                  <circle
                    r={3.5}
                    className={g.status === "open" ? "amber" : "plasma"}
                  />
                  <text
                    y={dir * 26}
                    textAnchor={slot.anchor}
                    className="num"
                    style={{ fontSize: 12 }}
                  >
                    {g.short}
                  </text>
                </g>
              );
            })}
            <TodayMarker
              pad={PAD}
              width={ON_SCALE_W}
              railY={compactY}
              compact
            />
          </svg>
        </div>
      </div>
    );
  }

  const xs = onScale.map((g) => x(g));
  const slots = layoutGateLabels(xs, {
    minSep: 168,
    leftEdge: PAD + 70,
    rightEdge: PAD + ON_SCALE_W - 70,
  });

  return (
    <div
      id="gate-clock"
      className="inst gate-clock"
      aria-label="Gate clock"
      style={{ scrollMarginTop: "calc(var(--desk-nav-offset) + 1rem)" }}
    >
      <div className="inst-scroll">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-labelledby="gc-title gc-desc"
        >
          <title id="gc-title">The gate clock</title>
          <desc id="gc-desc">
            A time rail from 17 August 2026, when the framework was signed, to
            31 March 2027, when its term ends. Gates: House vote 17 September,
            Québec PQ minority 5 October, cabinet 21 October, National Assembly
            17 November, binding target 31 December, term end 31 March. First
            Gull Island power is pencilled for 2036, off the scale.
          </desc>
          <defs>
            <pattern
              id="gc-hatch"
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

          <line
            x1={PAD}
            x2={PAD + ON_SCALE_W}
            y1={RAIL_Y}
            y2={RAIL_Y}
            className="hair draw"
            pathLength={1}
          />
          <path
            d={`M ${PAD + ON_SCALE_W + 14} ${RAIL_Y} l 8 -8 l 8 16 l 8 -16 l 8 16 l 8 -8`}
            fill="none"
            className="hair"
          />
          <line
            x1={PAD + ON_SCALE_W + 62}
            x2={OFF_X - 14}
            y1={RAIL_Y}
            y2={RAIL_Y}
            className="hair"
            strokeDasharray="2 3"
          />

          {onScale.map((g, i) => {
            const gx = x(g);
            const slot = slots[i]!;
            const dir = slot.side === "above" ? -1 : 1;
            const cls =
              g.status === "open"
                ? "amber"
                : g.status === "endorsed"
                  ? "plasma"
                  : "plasma";
            const dateY = dir * 34;
            const labelY = dir * (52 + slot.tier * 28);
            return (
              <g key={g.id} transform={`translate(${gx} ${RAIL_Y})`}>
                <line y1={dir * 22} y2={0} className="hair" />
                <circle r={4.5} className={cls} />
                {g.kind === "target" ? (
                  <circle
                    r={9}
                    fill="none"
                    className={`stroke-${cls}`}
                    strokeDasharray="2 3"
                    strokeWidth={1}
                  />
                ) : null}
                <text
                  y={dateY}
                  textAnchor={slot.anchor}
                  className="num"
                  style={{ fontSize: 14 }}
                >
                  {g.short}
                </text>
                <SvgLines
                  text={g.label}
                  x={0}
                  y={labelY}
                  maxChars={16}
                  lineHeight={11}
                  textAnchor={slot.anchor}
                  className="lbl"
                />
              </g>
            );
          })}

          {off.map((g) => (
            <g key={g.id} transform={`translate(${x(g)} ${RAIL_Y})`}>
              <rect
                x={-9}
                y={-9}
                width={18}
                height={18}
                fill="url(#gc-hatch)"
                stroke="var(--steel)"
                strokeWidth={1}
              />
              <text
                y={-36}
                textAnchor="middle"
                className="num"
                style={{ fontSize: 14 }}
              >
                {g.short}
              </text>
              <SvgLines
                text="first Gull Island power"
                x={0}
                y={-56}
                maxChars={14}
                lineHeight={11}
                textAnchor="middle"
                className="lbl"
              />
              <text
                y={44}
                textAnchor="middle"
                className="lbl steel"
                style={{ fontSize: 9.5 }}
              >
                preliminary · Annex B
              </text>
            </g>
          ))}

          <TodayMarker pad={PAD} width={ON_SCALE_W} railY={RAIL_Y} />
        </svg>
        <span className="inst-scroll-hint" aria-hidden>
          scroll sideways →
        </span>
      </div>

      <GateLive />

      <table className="inst-table">
        <caption>Gates on the Churchill Falls framework</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Gate</th>
            <th>Kind</th>
          </tr>
        </thead>
        <tbody>
          {GATES.map((g) => (
            <tr key={g.id}>
              <td>{g.date}</td>
              <td>{g.label}</td>
              <td>{g.kind}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="inst-caption">
        Solid dots are fixed dates. Dashed rings are stated targets in the DCIA
        text. The hatched square is a preliminary Annex B year. Nothing on this
        rail is a forecast by Open People.{" "}
        <Link href="/tracker" className="desk-link">
          Full tracker →
        </Link>
      </p>
      <ul className="inst-legend" aria-label="Gate sources">
        {GATES.map((g) => (
          <li key={g.id} className="inst-legend-item">
            <span
              className="inst-swatch"
              data-fill={
                g.kind === "preliminary"
                  ? "hatch"
                  : g.kind === "target"
                    ? "outline"
                    : "solid"
              }
            />
            <span>
              <Figure
                value={g.short}
                status={g.status}
                size="sm"
                sources={g.sources.map((id) => DESK_SOURCES[id])}
                lastVerified={DESK_VERIFIED}
                note={g.body.technical}
              />{" "}
              <span className="text-[var(--ink-3)]">— {g.body.plain}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
