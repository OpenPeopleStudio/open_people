import { ANNEX_B_NOTE, CF_UPGRADES_RAMP, DESK_SOURCES, GULL_RAMP } from "@/lib/desk";
import { Figure } from "@/components/marketing/depth";

/**
 * I6 — Annex Ramp. Preliminary Annex B schedule bands, hatched throughout.
 * Everything here is subject to studies; the badge says so.
 */
export function AnnexRamp() {
  const W = 1000;
  const H = 260;
  const LEFT = 70;
  const RIGHT = 30;
  const TOP = 40;
  const BOTTOM = 40;
  const years = Array.from({ length: 2043 - 2034 }, (_, i) => 2034 + i);
  const MAX = 2800;
  const xw = (W - LEFT - RIGHT) / years.length;
  const yy = (mw: number) => TOP + (H - TOP - BOTTOM) * (1 - mw / MAX);

  return (
    <div className="inst annex-ramp">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="ar-title ar-desc">
        <title id="ar-title">Annex B preliminary ramp</title>
        <desc id="ar-desc">
          Churchill Falls upgrades ramp from 464 MW in 2035 to 1,275 MW in 2042. Gull Island first
          volumes of 1,350 MW in 2036 and 2,700 MW from 2037 in the 2,700 MW case. All preliminary.
        </desc>
        <defs>
          <pattern id="ar-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--steel)" strokeWidth="1" />
          </pattern>
          <pattern id="ar-hatch2" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--plasma)" strokeWidth="1" />
          </pattern>
        </defs>

        {[0, 1000, 2000].map((mw) => (
          <g key={mw}>
            <line x1={LEFT} x2={W - RIGHT} y1={yy(mw)} y2={yy(mw)} className="hair-soft" />
            <text x={LEFT - 8} y={yy(mw) + 4} textAnchor="end" className="lbl">
              {mw.toLocaleString("en-CA")}
            </text>
          </g>
        ))}
        <text x={LEFT - 8} y={TOP - 14} textAnchor="end" className="lbl">
          MW
        </text>

        {years.map((yr, i) => {
          const x = LEFT + i * xw;
          const cf = CF_UPGRADES_RAMP.find((r) => r.year === yr);
          const gi = GULL_RAMP.find((r) => r.year === yr) ?? (yr > 2037 ? { year: yr, mw: 2700 } : null);
          return (
            <g key={yr}>
              {gi ? (
                <rect
                  x={x + 4}
                  y={yy(gi.mw)}
                  width={xw / 2 - 6}
                  height={yy(0) - yy(gi.mw)}
                  fill="url(#ar-hatch2)"
                  stroke="var(--plasma)"
                  strokeWidth={0.8}
                />
              ) : null}
              {cf ? (
                <rect
                  x={x + xw / 2 + 2}
                  y={yy(cf.mw)}
                  width={xw / 2 - 6}
                  height={yy(0) - yy(cf.mw)}
                  fill="url(#ar-hatch)"
                  stroke="var(--steel)"
                  strokeWidth={0.8}
                />
              ) : null}
              <text x={x + xw / 2} y={H - 16} textAnchor="middle" className="lbl">
                {yr}
              </text>
            </g>
          );
        })}
        <text x={W - RIGHT} y={TOP - 14} textAnchor="end" className="lbl steel">
          preliminary · Annex B · subject to studies
        </text>
      </svg>

      <ul className="inst-legend" aria-label="Ramp key">
        <li className="inst-legend-item">
          <span className="inst-swatch" data-fill="outline" />
          <span>
            Gull Island (2,700 MW case):{" "}
            <Figure
              value="1,350 MW in 2036, 2,700 MW from 2037"
              status="framework"
              size="sm"
              sources={ANNEX_B_NOTE.sources.map((id) => DESK_SOURCES[id])}
              lastVerified={ANNEX_B_NOTE.lastVerified}
              note={ANNEX_B_NOTE.technical}
            />
          </span>
        </li>
        <li className="inst-legend-item">
          <span className="inst-swatch" data-fill="hatch" />
          <span>
            Churchill Falls upgrades:{" "}
            <Figure
              value="464 MW (2035) → 1,275 MW (2042)"
              status="framework"
              size="sm"
              sources={[DESK_SOURCES.dciaHq]}
              lastVerified={ANNEX_B_NOTE.lastVerified}
              note="Schedule A §1: about +23.5% across 11 units. Annex B ramp is preliminary and subject to detailed studies."
            />
          </span>
        </li>
      </ul>
      <p className="inst-caption">{ANNEX_B_NOTE.plain}</p>
    </div>
  );
}
