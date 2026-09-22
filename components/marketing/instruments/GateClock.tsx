import Link from "next/link";
import { GATES, railPosition, type Gate } from "@/lib/desk";
import { Figure } from "@/components/marketing/depth";
import { DESK_SOURCES } from "@/lib/desk";
import { GateLive, TodayMarker } from "./GateClockLive";

/**
 * I1 — the Gate Clock. A horizontal time rail from the framework signing to
 * the end of its term, with the off-scale Gull Island year beyond a break.
 * Geometry is static (server); the today marker and the day counters are
 * small client islands so the page can stay static.
 */
const W = 1000;
const H = 150;
const PAD = 40;
const RAIL_Y = 86;
const ON_SCALE_W = 860;

function x(gate: Gate): number {
  if (gate.offscale) return PAD + ON_SCALE_W + 80;
  return PAD + railPosition(gate.date, GATES) * ON_SCALE_W;
}

export function GateClock({ compact = false }: { compact?: boolean }) {
  const onScale = GATES.filter((g) => !g.offscale);
  const off = GATES.filter((g) => g.offscale);

  if (compact) {
    return (
      <div className="gate-clock-compact inst" aria-label="Gate clock">
        <div className="inst-scroll">
          <svg viewBox={`0 0 ${W} 84`} role="img" aria-labelledby="gc-c-title">
            <title id="gc-c-title">
              Gates on the Churchill Falls framework, with today marked
            </title>
            <line
              x1={PAD}
              x2={PAD + ON_SCALE_W}
              y1={42}
              y2={42}
              className="hair"
            />
            {onScale.map((g, i) => {
              const above = i % 2 === 0;
              return (
                <g key={g.id} transform={`translate(${x(g)} 42)`}>
                  <line
                    y1={above ? -14 : 0}
                    y2={above ? 0 : 14}
                    className="hair"
                  />
                  <circle
                    r={3.5}
                    className={g.status === "open" ? "amber" : "plasma"}
                  />
                  <text
                    y={above ? -20 : 26}
                    textAnchor="middle"
                    className="num"
                    style={{ fontSize: 11 }}
                  >
                    {g.short}
                  </text>
                  <text
                    y={above ? -32 : 38}
                    textAnchor="middle"
                    className="lbl"
                    style={{ fontSize: 9 }}
                  >
                    {g.label}
                  </text>
                </g>
              );
            })}
            <TodayMarker pad={PAD} width={ON_SCALE_W} y1={26} y2={58} compact />
          </svg>
        </div>
      </div>
    );
  }

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
            Québec election 5 October, binding target 31 December, term end 31
            March. First Gull Island power is pencilled for 2036, off the scale.
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

          {/* rail */}
          <line
            x1={PAD}
            x2={PAD + ON_SCALE_W}
            y1={RAIL_Y}
            y2={RAIL_Y}
            className="hair draw"
            pathLength={1}
          />
          {/* break to off-scale */}
          <path
            d={`M ${PAD + ON_SCALE_W + 14} ${RAIL_Y} l 8 -8 l 8 16 l 8 -16 l 8 16 l 8 -8`}
            fill="none"
            className="hair"
          />
          <line
            x1={PAD + ON_SCALE_W + 62}
            x2={PAD + ON_SCALE_W + 80}
            y1={RAIL_Y}
            y2={RAIL_Y}
            className="hair"
            strokeDasharray="2 3"
          />

          {onScale.map((g, i) => {
            const gx = x(g);
            const above = i % 2 === 0;
            const cls =
              g.status === "open"
                ? "amber"
                : g.status === "endorsed"
                  ? "plasma"
                  : "plasma";
            return (
              <g key={g.id} transform={`translate(${gx} ${RAIL_Y})`}>
                <line
                  y1={above ? -26 : 0}
                  y2={above ? 0 : 26}
                  className="hair"
                />
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
                  y={above ? -36 : 44}
                  textAnchor="middle"
                  className="num"
                  style={{ fontSize: 14 }}
                >
                  {g.short}
                </text>
                <text y={above ? -52 : 60} textAnchor="middle" className="lbl">
                  {g.label}
                </text>
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
              <text y={-52} textAnchor="middle" className="lbl">
                first Gull Island power
              </text>
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

          <TodayMarker
            pad={PAD}
            width={ON_SCALE_W}
            y1={RAIL_Y - 70}
            y2={RAIL_Y + 66}
          />
        </svg>
        <span className="inst-scroll-hint" aria-hidden>
          scroll sideways →
        </span>
      </div>

      {/* live counters */}
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
                lastVerified={"2026-09-22"}
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
