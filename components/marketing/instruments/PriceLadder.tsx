import Link from "next/link";
import {
  DESK_SOURCES,
  LADDER_FAMILIES,
  LADDER_POINTS,
  type LadderFamily,
} from "@/lib/desk";
import { Figure } from "@/components/marketing/depth";

/**
 * I3 — the Price Ladder. One ¢/kWh axis, each price family on its own row.
 * Labelled, not merged. The reported HQ path is a faint dashed rise. The
 * mine rate is a formula badge, not a rung. The signed industrial ¢ is a
 * dashed empty slot.
 */
const W = 1000;
const LEFT = 250;
const RIGHT = 40;
const ROW_H = 44;
const TOP = 34;
const MAX_C = 18;

function toneClass(tone: LadderFamily["tone"]): string {
  switch (tone) {
    case "heritage":
      return "steel";
    case "reported":
      return "amber";
    case "structure":
      return "steel";
    case "published":
      return "plasma";
    case "island":
      return "steel";
    case "neighbour":
      return "steel";
    case "unknown":
      return "alert";
  }
}

function cx(cents: number): number {
  const w = W - LEFT - RIGHT;
  return LEFT + (Math.min(cents, MAX_C) / MAX_C) * w;
}

export function PriceLadder() {
  const H = TOP + LADDER_FAMILIES.length * ROW_H + 40;
  const reported = LADDER_POINTS.filter(
    (p) => p.family === "reported" && p.cents !== null,
  ).sort((a, b) => (a.cents ?? 0) - (b.cents ?? 0));
  const reportedRow = LADDER_FAMILIES.findIndex((f) => f.id === "reported");
  const ticks = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18];

  return (
    <div className="inst price-ladder">
      <div className="inst-scroll">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-labelledby="pl-title pl-desc"
        >
          <title id="pl-title">The price ladder</title>
          <desc id="pl-desc">
            Cents per kilowatt-hour on one axis, with each price family on its
            own row: heritage export, the rejected 2024 MOU, the reported new
            Hydro-Québec export path, published Labrador tariffs, the Island
            grid, Québec&apos;s proposed data-centre rate, and the signed
            industrial rate for retained power, which is not published.
          </desc>

          {/* axis */}
          {ticks.map((t) => (
            <g key={t} transform={`translate(${cx(t)} 0)`}>
              <line y1={TOP - 10} y2={H - 30} className="hair-soft" />
              <text y={H - 14} textAnchor="middle" className="lbl">
                {t}¢
              </text>
            </g>
          ))}

          {LADDER_FAMILIES.map((fam, i) => {
            const y = TOP + i * ROW_H + ROW_H / 2;
            const pts = LADDER_POINTS.filter((p) => p.family === fam.id);
            const tone = toneClass(fam.tone);
            return (
              <g key={fam.id}>
                <line x1={LEFT} x2={W - RIGHT} y1={y} y2={y} className="hair" />
                <text
                  x={LEFT - 14}
                  y={y + 4}
                  textAnchor="end"
                  className="lbl lbl-strong"
                >
                  {fam.label}
                </text>
                {fam.id === "reported" && reported.length > 1 ? (
                  <path
                    d={reported
                      .map(
                        (p, k) => `${k === 0 ? "M" : "L"} ${cx(p.cents!)} ${y}`,
                      )
                      .join(" ")}
                    fill="none"
                    className="stroke-amber draw"
                    strokeWidth={1.5}
                    strokeDasharray="3 4"
                    pathLength={1}
                  />
                ) : null}
                {fam.id === "signed" ? (
                  <g>
                    <rect
                      x={cx(2)}
                      y={y - 12}
                      width={cx(12) - cx(2)}
                      height={24}
                      fill="none"
                      className="stroke-alert"
                      strokeDasharray="4 4"
                      strokeWidth={1}
                    />
                    <text
                      x={(cx(2) + cx(12)) / 2}
                      y={y + 4}
                      textAnchor="middle"
                      className="lbl alert"
                    >
                      not published
                    </text>
                  </g>
                ) : null}
                {pts
                  .filter((p) => p.cents !== null)
                  .map((p, k) => (
                    <g key={p.id} transform={`translate(${cx(p.cents!)} ${y})`}>
                      <circle r={5} className={tone} />
                      <text
                        y={k % 2 === 0 ? -11 : 19}
                        textAnchor="middle"
                        className="num"
                        style={{ fontSize: 12 }}
                      >
                        {p.value}¢
                      </text>
                    </g>
                  ))}
              </g>
            );
          })}

          {/* divider note under the reported row */}
          {reportedRow >= 0 ? (
            <text
              x={W - RIGHT}
              y={TOP + reportedRow * ROW_H + ROW_H - 4}
              textAnchor="end"
              className="lbl"
              style={{ fontSize: 9.5, fill: "var(--amber)" }}
            >
              different measurements · labelled, not merged
            </text>
          ) : null}
        </svg>
        <span className="inst-scroll-hint" aria-hidden>
          scroll sideways →
        </span>
      </div>

      <div className="ladder-rows" role="list" aria-label="Price ladder rungs">
        {LADDER_FAMILIES.map((fam) => {
          const pts = LADDER_POINTS.filter((p) => p.family === fam.id);
          return pts.map((p) => (
            <div
              key={p.id}
              className="ladder-row"
              role="listitem"
              id={`ladder-${p.id}`}
            >
              <div>
                <Figure
                  value={`${p.value}${p.cents === null ? "" : "¢"}`}
                  status={p.status}
                  size="sm"
                  sources={p.sources.map((id) => DESK_SOURCES[id])}
                  lastVerified={p.lastVerified}
                  note={p.note}
                />
              </div>
              <div className="fam">{fam.label}</div>
              <div className="d">
                {p.label}. {p.note}{" "}
                {p.href ? (
                  <Link href={p.href} className="desk-link">
                    Card →
                  </Link>
                ) : null}
              </div>
            </div>
          ));
        })}
        <div className="ladder-row" role="listitem">
          <div>
            <span className="desk-cite">LAB-IND-1</span>
          </div>
          <div className="fam">Published Labrador tariffs</div>
          <div className="d">
            The mine rate is demand charges plus a monthly formula, RFIRM ={" "}
            {"{"}(ED × RD) + (EM × RM){"}"} / ETOTAL. It is not one cent and is
            not drawn as a rung.{" "}
            <Link href="/costs#lab-ind-1" className="desk-link">
              Card →
            </Link>
          </div>
        </div>
      </div>

      <p className="inst-caption">
        Each row measures something different. A starting price, a fifty-year
        average and a household tariff cannot be subtracted from one another.
        The desk labels them and refuses to merge them. Source for each rung is
        under its number.
      </p>
    </div>
  );
}
