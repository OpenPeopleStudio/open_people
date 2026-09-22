import Link from "next/link";
import { DESK_SOURCES } from "@/lib/desk";
import { Figure } from "@/components/marketing/depth";

/**
 * I7 — Default Path. What the Material Terms already decide if nobody writes
 * anything else: retained power used at home, or not used and bought by
 * Hydro-Québec, at a discount when there is no three-year notice.
 */
export function DefaultPath() {
  const W = 1000;
  const H = 330;
  const src = { x: 130, y: 165 };
  const home = { x: 560, y: 70 };
  const west = { x: 560, y: 235 };

  const options = [
    { label: "Synthetic export", cap: "up to 280 MW", note: "3-yr notice" },
    { label: "CHPE-equivalent", cap: "up to 240 MW", note: "3-yr notice" },
    { label: "NECEC-equivalent", cap: "up to 200 MW", note: "3-yr notice" },
    { label: "Discounted PPA price", cap: "95% of PPA", note: "no notice · HQ must buy" },
  ];

  return (
    <div className="inst default-path">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="dp-title dp-desc">
        <title id="dp-title">The default path for unused retained power</title>
        <desc id="dp-desc">
          Retained power either serves domestic load in Newfoundland and Labrador, or, if unused,
          flows to Hydro-Québec under Section 4 options: synthetic export up to 280 MW, CHPE-equivalent
          up to 240 MW, NECEC-equivalent up to 200 MW, each on three years&apos; notice, or unplanned
          unused energy at 95 percent of the PPA price with no notice, which Hydro-Québec must buy.
        </desc>

        {/* source node */}
        <g transform={`translate(${src.x} ${src.y})`}>
          <rect x={-100} y={-34} width={200} height={68} fill="var(--surface-2)" stroke="var(--ink)" strokeWidth={1} />
          <text y={-6} textAnchor="middle" className="lbl lbl-strong">
            Retained power
          </text>
          <text y={14} textAnchor="middle" className="num" style={{ fontSize: 12 }}>
            up to 2,350 MW · framing
          </text>
        </g>

        {/* branches */}
        <path d={`M ${src.x + 100} ${src.y - 10} C 300 ${src.y - 10}, 300 ${home.y}, ${home.x - 130} ${home.y}`} fill="none" className="stroke-plasma draw" strokeWidth={2} pathLength={1} />
        <path d={`M ${src.x + 100} ${src.y + 10} C 300 ${src.y + 10}, 300 ${west.y}, ${west.x - 130} ${west.y}`} fill="none" className="stroke-amber draw" strokeWidth={2} strokeDasharray="6 5" pathLength={1} />

        <text x={300} y={home.y - 26} textAnchor="middle" className="lbl plasma">
          used here · “domestic load”
        </text>
        <text x={300} y={west.y + 34} textAnchor="middle" className="lbl amber">
          not used · §4 options
        </text>

        {/* home node */}
        <g transform={`translate(${home.x} ${home.y})`}>
          <rect x={-130} y={-30} width={260} height={60} fill="none" stroke="var(--plasma)" strokeWidth={1} />
          <text y={-6} textAnchor="middle" className="lbl lbl-strong">
            Mines · towns · Labrador industry
          </text>
          <text y={14} textAnchor="middle" className="lbl alert" style={{ fontSize: 9.5 }}>
            definition of “domestic load”: not published
          </text>
        </g>

        {/* west node + options */}
        <g transform={`translate(${west.x} ${west.y})`}>
          <rect x={-130} y={-30} width={260} height={60} fill="none" stroke="var(--amber)" strokeWidth={1} strokeDasharray="4 4" />
          <text y={-6} textAnchor="middle" className="lbl lbl-strong">
            Hydro-Québec buys it
          </text>
          <text y={14} textAnchor="middle" className="lbl" style={{ fontSize: 9.5 }}>
            already written in the Material Terms
          </text>
        </g>

        {options.map((o, i) => {
          const y = 40 + i * 62;
          return (
            <g key={o.label} transform={`translate(760 ${y})`}>
              <line x1={-70} x2={-8} y1={west.y - y + 0} y2={20} className="hair" />
              <rect x={0} y={0} width={210} height={40} fill="var(--surface-1)" stroke="var(--hairline-strong)" strokeWidth={1} />
              <text x={10} y={16} className="lbl lbl-strong" style={{ fontSize: 10 }}>
                {o.label}
              </text>
              <text x={10} y={31} className="lbl" style={{ fontSize: 9.5 }}>
                {o.cap} · {o.note}
              </text>
            </g>
          );
        })}
      </svg>

      <ul className="inst-legend" aria-label="Default path figures">
        <li className="inst-legend-item">
          <span className="inst-swatch" data-fill="dashed" />
          <span>
            <Figure
              value="95%"
              unit="of PPA price · no notice"
              status="framework"
              size="sm"
              sources={[DESK_SOURCES.dciaHq, DESK_SOURCES.dciaNl]}
              lastVerified="2026-09-22"
              note="Schedule B §4(b)(iv): unplanned unused energy to serve domestic load may be sold to HQ at the Discounted PPA Price, 95% of the applicable PPA price. HQ is obligated to purchase."
            />
          </span>
        </li>
        <li className="inst-legend-item">
          <span className="inst-swatch" data-fill="outline" />
          <span>
            <Figure
              value="280 / 240 / 200 MW"
              unit="§4 caps · three years' notice"
              status="framework"
              size="sm"
              sources={[DESK_SOURCES.dciaHq]}
              lastVerified="2026-09-22"
              note="Synthetic export up to 280 MW (⅓ New England, ⅓ New York Astoria, ⅓ Ontario PQAT, net of transmission); CHPE-equivalent up to 240 MW; NECEC-equivalent up to 200 MW. Three years' prior notice."
            />
          </span>
        </li>
      </ul>
      <p className="inst-caption">
        Framework, not executed. These are Material Terms for later contracts. The point is that the
        west branch is already written and the home branch is not.{" "}
        <Link href="/tracker#unused-retain" className="desk-link">
          Tracker row →
        </Link>
      </p>
    </div>
  );
}
