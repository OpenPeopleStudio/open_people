import Link from "next/link";
import { DESK_SOURCES, DESK_VERIFIED } from "@/lib/desk";
import { Figure } from "@/components/marketing/depth";
import { SvgLines } from "./svg";

/**
 * I7 — Default Path. What the Material Terms already decide if nobody writes
 * anything else: retained power used at home, or not used and bought by
 * Hydro-Québec, at a discount when there is no three-year notice.
 */
export function DefaultPath() {
  const W = 1100;
  const H = 430;
  const src = { x: 150, y: 200 };
  const home = { x: 540, y: 80 };
  const west = { x: 540, y: 300 };

  const options = [
    { label: "Synthetic export", cap: "up to 280 MW", note: "3-yr notice" },
    { label: "CHPE-equivalent", cap: "up to 240 MW", note: "3-yr notice" },
    { label: "NECEC-equivalent", cap: "up to 200 MW", note: "3-yr notice" },
    {
      label: "Discounted PPA price",
      cap: "95% of PPA",
      note: "no notice · HQ must buy",
    },
  ];
  const optionX = 850;
  const optionW = 230;
  const optionH = 50;
  const optionGap = 56;
  const optionTop = west.y - ((options.length - 1) * optionGap) / 2;

  return (
    <div className="inst default-path">
      <div className="inst-scroll">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-labelledby="dp-title dp-desc"
        >
          <title id="dp-title">
            The default path for unused retained power
          </title>
          <desc id="dp-desc">
            Retained power either serves domestic load in Newfoundland and
            Labrador, or, if unused, flows to Hydro-Québec under Section 4
            options: synthetic export up to 280 MW, CHPE-equivalent up to 240
            MW, NECEC-equivalent up to 200 MW, each on three years&apos; notice,
            or unplanned unused energy at 95 percent of the PPA price with no
            notice, which Hydro-Québec must buy.
          </desc>

          <g transform={`translate(${src.x} ${src.y})`}>
            <rect
              x={-108}
              y={-36}
              width={216}
              height={72}
              fill="var(--surface-2)"
              stroke="var(--ink)"
              strokeWidth={1}
            />
            <text y={-6} textAnchor="middle" className="lbl lbl-strong">
              Retained power
            </text>
            <text y={14} textAnchor="middle" className="num" style={{ fontSize: 12 }}>
              up to 2,350 MW · framing
            </text>
          </g>

          <path
            d={`M ${src.x + 108} ${src.y - 12} C 310 ${src.y - 12}, 310 ${home.y}, ${home.x - 150} ${home.y}`}
            fill="none"
            className="stroke-plasma draw"
            strokeWidth={2}
            pathLength={1}
          />
          <path
            d={`M ${src.x + 108} ${src.y + 12} C 310 ${src.y + 12}, 310 ${west.y}, ${west.x - 150} ${west.y}`}
            fill="none"
            className="stroke-amber"
            strokeWidth={2}
            strokeDasharray="7 5"
          />

          <text
            x={280}
            y={home.y - 28}
            textAnchor="middle"
            className="lbl plasma"
          >
            used here · “domestic load”
          </text>
          <text x={300} y={west.y + 40} textAnchor="middle" className="lbl amber">
            not used · §4 options
          </text>

          <g transform={`translate(${home.x} ${home.y})`}>
            <rect
              x={-150}
              y={-36}
              width={300}
              height={72}
              fill="none"
              stroke="var(--plasma)"
              strokeWidth={1}
            />
            <SvgLines
              text="Mines · towns · Labrador industry"
              x={0}
              y={-10}
              maxChars={36}
              lineHeight={12}
              textAnchor="middle"
              className="lbl lbl-strong"
            />
            <SvgLines
              text="definition of “domestic load”: not published"
              x={0}
              y={16}
              maxChars={32}
              lineHeight={11}
              textAnchor="middle"
              className="lbl alert"
              style={{ fontSize: 9.5 }}
            />
          </g>

          <g transform={`translate(${west.x} ${west.y})`}>
            <rect
              x={-150}
              y={-36}
              width={300}
              height={72}
              fill="none"
              stroke="var(--amber)"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <text y={-8} textAnchor="middle" className="lbl lbl-strong">
              Hydro-Québec buys it
            </text>
            <SvgLines
              text="already written in the Material Terms"
              x={0}
              y={14}
              maxChars={28}
              lineHeight={11}
              textAnchor="middle"
              className="lbl"
              style={{ fontSize: 9.5 }}
            />
          </g>

          {options.map((o, i) => {
            const oy = optionTop + i * optionGap;
            const joinX = west.x + 150;
            const midX = (joinX + optionX) / 2;
            return (
              <g key={o.label}>
                <path
                  d={`M ${joinX} ${west.y} L ${midX} ${west.y} L ${midX} ${oy} L ${optionX} ${oy}`}
                  fill="none"
                  className="hair"
                />
                <g transform={`translate(${optionX} ${oy - optionH / 2})`}>
                  <rect
                    x={0}
                    y={0}
                    width={optionW}
                    height={optionH}
                    fill="var(--surface-1)"
                    stroke="var(--hairline-strong)"
                    strokeWidth={1}
                  />
                  <text
                    x={10}
                    y={16}
                    className="lbl lbl-strong"
                    style={{ fontSize: 10 }}
                  >
                    {o.label}
                  </text>
                  <SvgLines
                    text={`${o.cap} · ${o.note}`}
                    x={10}
                    y={34}
                    maxChars={28}
                    lineHeight={11}
                    textAnchor="start"
                    className="lbl"
                    style={{ fontSize: 9.5 }}
                  />
                </g>
              </g>
            );
          })}
        </svg>
        <span className="inst-scroll-hint" aria-hidden>
          scroll sideways →
        </span>
      </div>

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
              lastVerified={DESK_VERIFIED}
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
              lastVerified={DESK_VERIFIED}
              note="Synthetic export up to 280 MW (⅓ New England, ⅓ New York Astoria, ⅓ Ontario PQAT, net of transmission); CHPE-equivalent up to 240 MW; NECEC-equivalent up to 200 MW. Three years' prior notice."
            />
          </span>
        </li>
      </ul>
      <p className="inst-caption">
        Framework, not executed. These are Material Terms for later contracts.
        The point is that the west branch is already written and the home branch
        is not.{" "}
        <Link href="/tracker#unused-retain" className="desk-link">
          Tracker row →
        </Link>
      </p>
    </div>
  );
}
