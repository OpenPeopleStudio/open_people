import { DESK_SOURCES } from "@/lib/desk";
import { Figure } from "@/components/marketing/depth";

/**
 * I5 — Corridor Schematic. Not a map. Churchill Falls in the centre; the
 * existing 230 kV lines west to Labrador West (at limit); the proposed
 * 735 kV line (funded, no in-service date); the export lines east and south
 * to Québec; the towns that already sit on the system.
 */
export function CorridorSchematic() {
  const W = 1000;
  const H = 360;
  const cf = { x: 520, y: 180 };
  const lw = { x: 150, y: 180 };
  const qc = { x: 900, y: 180 };
  const hvgb = { x: 700, y: 300 };

  return (
    <div className="inst corridor">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="cs-title cs-desc">
        <title id="cs-title">The corridor the mines need</title>
        <desc id="cs-desc">
          Schematic, not a map. Churchill Falls at the centre. Two existing 230 kV lines run west to
          Labrador West and are at their operational limit. A proposed 735 kV line with about 1,500 MW
          of transfer is funded but has no in-service date. Export lines run to Québec. Happy
          Valley–Goose Bay and the Churchill Falls townsite also sit on the system.
        </desc>

        {/* existing 230 kV west, two lines */}
        <line x1={cf.x - 30} y1={cf.y - 8} x2={lw.x + 30} y2={lw.y - 8} className="hair" strokeWidth={1.5} />
        <line x1={cf.x - 30} y1={cf.y + 8} x2={lw.x + 30} y2={lw.y + 8} className="hair" strokeWidth={1.5} />
        <text x={(cf.x + lw.x) / 2} y={cf.y - 22} textAnchor="middle" className="lbl">
          2 × 230 kV · existing
        </text>
        <text x={(cf.x + lw.x) / 2} y={cf.y + 30} textAnchor="middle" className="lbl amber">
          at operational limit
        </text>

        {/* proposed 735 kV */}
        <line
          x1={cf.x - 30}
          y1={cf.y + 60}
          x2={lw.x + 30}
          y2={lw.y + 60}
          className="stroke-steel draw"
          strokeWidth={2.5}
          strokeDasharray="8 6"
          pathLength={1}
        />
        <text x={(cf.x + lw.x) / 2} y={cf.y + 84} textAnchor="middle" className="lbl steel">
          735 kV proposed · ~1,500 MW · funded · in-service date not published
        </text>

        {/* export east to Québec */}
        <line x1={cf.x + 30} y1={cf.y - 10} x2={qc.x - 40} y2={qc.y - 10} className="stroke-plasma" strokeWidth={1.5} />
        <line x1={cf.x + 30} y1={cf.y} x2={qc.x - 40} y2={qc.y} className="stroke-plasma" strokeWidth={1.5} />
        <line x1={cf.x + 30} y1={cf.y + 10} x2={qc.x - 40} y2={qc.y + 10} className="stroke-plasma" strokeWidth={1.5} />
        <text x={(cf.x + qc.x) / 2} y={cf.y - 24} textAnchor="middle" className="lbl plasma">
          735 kV export · ~90% of output flows to Québec
        </text>

        {/* HVGB spur */}
        <line x1={cf.x + 20} y1={cf.y + 20} x2={hvgb.x - 20} y2={hvgb.y - 10} className="hair" strokeWidth={1.5} />

        {/* nodes */}
        <g transform={`translate(${cf.x} ${cf.y})`}>
          <rect x={-30} y={-30} width={60} height={60} fill="var(--surface-2)" stroke="var(--ink)" strokeWidth={1} />
          <text y={-38} textAnchor="middle" className="lbl lbl-strong">
            Churchill Falls
          </text>
          <text y={5} textAnchor="middle" className="num" style={{ fontSize: 12 }}>
            5,428
          </text>
          <text y={18} textAnchor="middle" className="lbl" style={{ fontSize: 8.5 }}>
            MW
          </text>
          <text y={48} textAnchor="middle" className="lbl" style={{ fontSize: 9.5 }}>
            townsite on the system
          </text>
        </g>

        <g transform={`translate(${lw.x} ${lw.y})`}>
          <rect x={-30} y={-30} width={60} height={60} fill="var(--surface-2)" stroke="var(--plasma)" strokeWidth={1} />
          <text y={-38} textAnchor="middle" className="lbl lbl-strong">
            Labrador West
          </text>
          <text y={-2} textAnchor="middle" className="lbl" style={{ fontSize: 9 }}>
            IOC · Tacora
          </text>
          <text y={12} textAnchor="middle" className="num" style={{ fontSize: 12 }}>
            ~312 MW
          </text>
          <text y={48} textAnchor="middle" className="lbl" style={{ fontSize: 9.5 }}>
            Labrador City · Wabush
          </text>
          <text y={62} textAnchor="middle" className="lbl plasma" style={{ fontSize: 9.5 }}>
            mining first
          </text>
        </g>

        <g transform={`translate(${qc.x} ${qc.y})`}>
          <rect x={-40} y={-30} width={80} height={60} fill="none" stroke="var(--plasma)" strokeWidth={1} strokeDasharray="3 3" />
          <text y={5} textAnchor="middle" className="lbl lbl-strong">
            Québec
          </text>
          <text y={48} textAnchor="middle" className="lbl" style={{ fontSize: 9.5 }}>
            Hydro-Québec
          </text>
        </g>

        <g transform={`translate(${hvgb.x} ${hvgb.y})`}>
          <circle r={6} fill="var(--surface-2)" stroke="var(--ink-3)" strokeWidth={1} />
          <text x={12} y={4} className="lbl">
            Happy Valley–Goose Bay
          </text>
        </g>
      </svg>

      <ul className="inst-legend" aria-label="Corridor figures">
        <li className="inst-legend-item">
          <span className="inst-swatch" data-fill="solid" />
          <span>
            <Figure
              value="~1,500 MW"
              status="framework"
              size="sm"
              sources={[DESK_SOURCES.nlhLabWest, DESK_SOURCES.govNlDcia]}
              lastVerified="2026-09-22"
              note="NL Hydro Phase 1 preferred a single 735 kV line with a maximum transfer of approximately 1,500 MW. FEED under way; completion targeted December 2026. No in-service date."
            />{" "}
            <span className="text-[var(--ink-3)]">— proposed 735 kV transfer limit, a planning figure</span>
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
              lastVerified="2026-09-22"
              note="Mining load sold to IOC and Tacora on the two Labrador West lines, per NL Hydro officials (CBC, Jan 2025). Press cite."
            />{" "}
            <span className="text-[var(--ink-3)]">— on the two 230 kV lines today</span>
          </span>
        </li>
      </ul>
      <p className="inst-caption">
        Schematic only. Line lengths and positions carry no geographic meaning. Export share from the
        CER provincial profile. Corridor status from NL Hydro&apos;s Labrador West study page.
      </p>
    </div>
  );
}
