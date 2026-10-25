import { DESK_SOURCES, DESK_VERIFIED } from "@/lib/desk";
import { Figure } from "@/components/marketing/depth";
import { SvgLines } from "./svg";

/**
 * I5 — Corridor Schematic. Not a map. Churchill Falls in the centre; the
 * existing 230 kV lines west to Labrador West (at limit); the proposed
 * 735 kV line (funded, no in-service date); the export lines east and south
 * to Québec; the towns that already sit on the system.
 */
export function CorridorSchematic() {
  const W = 1100;
  const H = 400;
  const cf = { x: 540, y: 168 };
  const lw = { x: 168, y: 168 };
  const qc = { x: 960, y: 168 };
  const hvgb = { x: 730, y: 328 };
  const nodeW = 72;
  const nodeH = 56;

  return (
    <div className="inst corridor">
      <div className="inst-scroll">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-labelledby="cs-title cs-desc"
        >
          <title id="cs-title">The corridor the mines need</title>
          <desc id="cs-desc">
            Schematic, not a map. Churchill Falls at the centre. Two existing
            230 kV lines run west to Labrador West and are at their operational
            limit. A proposed 735 kV line with about 1,500 MW of transfer is
            funded but has no in-service date. Export lines run to Québec. Happy
            Valley–Goose Bay and the Churchill Falls townsite also sit on the
            system.
          </desc>

          <line
            x1={cf.x - nodeW / 2}
            y1={cf.y - 8}
            x2={lw.x + nodeW / 2}
            y2={lw.y - 8}
            className="hair"
            strokeWidth={1.5}
          />
          <line
            x1={cf.x - nodeW / 2}
            y1={cf.y + 8}
            x2={lw.x + nodeW / 2}
            y2={lw.y + 8}
            className="hair"
            strokeWidth={1.5}
          />
          <text
            x={(cf.x + lw.x) / 2}
            y={cf.y - 48}
            textAnchor="middle"
            className="lbl"
          >
            2 × 230 kV · existing
          </text>
          <text
            x={(cf.x + lw.x) / 2}
            y={cf.y + 44}
            textAnchor="middle"
            className="lbl amber"
          >
            at operational limit
          </text>

          <line
            x1={cf.x - nodeW / 2}
            y1={cf.y + 92}
            x2={lw.x + nodeW / 2}
            y2={lw.y + 92}
            className="stroke-steel"
            strokeWidth={2}
            strokeDasharray="8 6"
          />
          <SvgLines
            text="735 kV proposed · ~1,500 MW · funded · in-service date not published"
            x={(cf.x + lw.x) / 2}
            y={cf.y + 116}
            maxChars={36}
            lineHeight={12}
            textAnchor="middle"
            className="lbl steel"
          />

          <line
            x1={cf.x + nodeW / 2}
            y1={cf.y - 10}
            x2={qc.x - 44}
            y2={qc.y - 10}
            className="stroke-plasma"
            strokeWidth={1.5}
          />
          <line
            x1={cf.x + nodeW / 2}
            y1={cf.y}
            x2={qc.x - 44}
            y2={qc.y}
            className="stroke-plasma"
            strokeWidth={1.5}
          />
          <line
            x1={cf.x + nodeW / 2}
            y1={cf.y + 10}
            x2={qc.x - 44}
            y2={qc.y + 10}
            className="stroke-plasma"
            strokeWidth={1.5}
          />
          <SvgLines
            text="735 kV export · ~90% of output flows to Québec"
            x={(cf.x + qc.x) / 2 + 24}
            y={cf.y - 52}
            maxChars={26}
            lineHeight={12}
            textAnchor="middle"
            className="lbl plasma"
          />

          <line
            x1={cf.x + 16}
            y1={cf.y + nodeH / 2}
            x2={hvgb.x - 14}
            y2={hvgb.y - 8}
            className="hair"
            strokeWidth={1.5}
          />

          <g transform={`translate(${cf.x} ${cf.y})`}>
            <rect
              x={-nodeW / 2}
              y={-nodeH / 2}
              width={nodeW}
              height={nodeH}
              fill="var(--surface-2)"
              stroke="var(--ink)"
              strokeWidth={1}
            />
            <text y={-nodeH / 2 - 12} textAnchor="middle" className="lbl lbl-strong">
              Churchill Falls
            </text>
            <text y={2} textAnchor="middle" className="num" style={{ fontSize: 13 }}>
              5,428
            </text>
            <text y={16} textAnchor="middle" className="lbl" style={{ fontSize: 8.5 }}>
              MW
            </text>
            <text
              y={nodeH / 2 + 16}
              textAnchor="middle"
              className="lbl"
              style={{ fontSize: 9.5 }}
            >
              townsite on the system
            </text>
          </g>

          <g transform={`translate(${lw.x} ${lw.y})`}>
            <rect
              x={-nodeW / 2}
              y={-nodeH / 2}
              width={nodeW}
              height={nodeH}
              fill="var(--surface-2)"
              stroke="var(--plasma)"
              strokeWidth={1}
            />
            <text y={-nodeH / 2 - 12} textAnchor="middle" className="lbl lbl-strong">
              Labrador West
            </text>
            <text y={-2} textAnchor="middle" className="lbl" style={{ fontSize: 9 }}>
              IOC · Tacora
            </text>
            <text y={14} textAnchor="middle" className="num" style={{ fontSize: 12 }}>
              ~312 MW
            </text>
            <text
              y={nodeH / 2 + 16}
              textAnchor="middle"
              className="lbl"
              style={{ fontSize: 9.5 }}
            >
              Labrador City · Wabush
            </text>
            <text
              y={nodeH / 2 + 30}
              textAnchor="middle"
              className="lbl plasma"
              style={{ fontSize: 9.5 }}
            >
              mining first
            </text>
          </g>

          <g transform={`translate(${qc.x} ${qc.y})`}>
            <rect
              x={-44}
              y={-nodeH / 2}
              width={88}
              height={nodeH}
              fill="none"
              stroke="var(--plasma)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <text y={4} textAnchor="middle" className="lbl lbl-strong">
              Québec
            </text>
            <text
              y={nodeH / 2 + 16}
              textAnchor="middle"
              className="lbl"
              style={{ fontSize: 9.5 }}
            >
              Hydro-Québec
            </text>
          </g>

          <g transform={`translate(${hvgb.x} ${hvgb.y})`}>
            <circle
              r={6}
              fill="var(--surface-2)"
              stroke="var(--ink-3)"
              strokeWidth={1}
            />
            <text x={12} y={4} className="lbl">
              Happy Valley–Goose Bay
            </text>
          </g>
        </svg>
        <span className="inst-scroll-hint" aria-hidden>
          scroll sideways →
        </span>
      </div>

      <ul className="inst-legend" aria-label="Corridor figures">
        <li className="inst-legend-item">
          <span className="inst-swatch" data-fill="solid" />
          <span>
            <Figure
              value="~1,500 MW"
              status="framework"
              size="sm"
              sources={[DESK_SOURCES.nlhContractorOct, DESK_SOURCES.nlhLabWest, DESK_SOURCES.govNlDcia]}
              lastVerified={DESK_VERIFIED}
              note="NL Hydro October 2026 contractor notice: a single 735 kV line with a maximum transfer of approximately 1,500 MW — a ceiling, not a reserved block. FEED targeted December 2026. Construction contracts expected Q1 2028. No in-service date."
            />{" "}
            <span className="text-[var(--ink-3)]">
              — proposed 735 kV transfer limit, a planning figure
            </span>
          </span>
        </li>
        <li className="inst-legend-item">
          <span className="inst-swatch" data-fill="solid" />
          <span>
            <Figure
              value="~312 MW"
              status="reported"
              size="sm"
              sources={[DESK_SOURCES.cbcMining]}
              lastVerified={DESK_VERIFIED}
              note="Mining load sold to IOC and Tacora on the two Labrador West lines, per NL Hydro officials (CBC, Jan 2025). Press cite."
            />{" "}
            <span className="text-[var(--ink-3)]">
              — on the two 230 kV lines today
            </span>
          </span>
        </li>
      </ul>
      <p className="inst-caption">
        Schematic only. Line lengths and positions carry no geographic meaning.
        Export share from the CER provincial profile. Corridor status from NL
        Hydro&apos;s Labrador West study page.
      </p>
    </div>
  );
}
