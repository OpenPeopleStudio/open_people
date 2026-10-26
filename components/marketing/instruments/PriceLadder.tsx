"use client";

import { useState } from "react";
import {
  DESK_SOURCES,
  LADDER_FAMILIES,
  LADDER_POINTS,
  type LadderFamily,
} from "@/lib/desk";
import { InstDetail, useInstSelect } from "./InstDetail";
import { clampLabelX, staggerByX } from "./layout";
import { InstFit, SvgLines } from "./svg";

/**
 * I3 — the Price Ladder. One ¢/kWh axis, each price family on its own row.
 * Labelled, not merged. The reported HQ path is a faint dashed rise. The
 * mine rate is a formula badge, not a rung. The signed industrial ¢ is a
 * dashed empty slot.
 */
const W = 1000;
const LEFT = 168;
const RIGHT = 28;
const ROW_H = 56;
const TOP = 28;
const MAX_C = 18;
const AXIS_W = W - LEFT - RIGHT;

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
  return LEFT + (Math.min(cents, MAX_C) / MAX_C) * AXIS_W;
}

export function PriceLadder() {
  const { active, select, hit } = useInstSelect(LADDER_POINTS[0].id);
  const [showAll, setShowAll] = useState(false);
  const point = LADDER_POINTS.find((item) => item.id === active);
  const H = TOP + LADDER_FAMILIES.length * ROW_H + 32;
  const reported = LADDER_POINTS.filter(
    (p) => p.family === "reported" && p.cents !== null,
  ).sort((a, b) => (a.cents ?? 0) - (b.cents ?? 0));
  const ticks = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18];
  const minSep = (2 / MAX_C) * AXIS_W;

  return (
    <div className="inst price-ladder">
      <InstFit
        wide={
        <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Price ladder">
          <title id="pl-title">The price ladder</title>
          <desc id="pl-desc">
            Cents per kilowatt-hour on one axis, with each price family on its
            own row: heritage export, the rejected 2024 MOU, the reported new
            Hydro-Québec export path, published Labrador tariffs, the Island
            grid, Québec&apos;s proposed data-centre rate, and the signed
            industrial rate for retained power, which is not published.
          </desc>

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
            const placed = pts.filter((p) => p.cents !== null);
            const sides = staggerByX(
              placed.map((p) => cx(p.cents!)),
              minSep,
            );
            const tone = toneClass(fam.tone);
            return (
              <g key={fam.id}>
                <line x1={LEFT} x2={W - RIGHT} y1={y} y2={y} className="hair" />
                <SvgLines
                  text={fam.short}
                  x={LEFT - 14}
                  y={y + 1}
                  maxChars={14}
                  lineHeight={12}
                  textAnchor="end"
                  className={
                    pts.some((p) => p.id === active) ? "lbl lbl-strong" : "lbl"
                  }
                />
                {fam.id === "reported" && reported.length > 1 ? (
                  <path
                    d={reported
                      .map(
                        (p, k) => `${k === 0 ? "M" : "L"} ${cx(p.cents!)} ${y}`,
                      )
                      .join(" ")}
                    fill="none"
                    className="stroke-amber"
                    strokeWidth={1.5}
                    strokeDasharray="4 5"
                  />
                ) : null}
                {fam.id === "signed" ? (
                  <g {...(pts.find((p) => p.cents === null)
                    ? hit(
                        pts.find((p) => p.cents === null)!.id,
                        "Signed industrial rate, not published",
                      )
                    : {})}>
                    <rect
                      x={cx(2)}
                      y={y - 12}
                      width={cx(12) - cx(2)}
                      height={24}
                      fill="none"
                      className="stroke-alert"
                      strokeDasharray="4 4"
                      strokeWidth={active === pts.find((p) => p.cents === null)?.id ? 1.5 : 1}
                    />
                  </g>
                ) : null}
                {placed.map((p, k) => {
                  const above = sides[k] === "above";
                  return (
                    <g
                      key={p.id}
                      transform={`translate(${cx(p.cents!)} ${y})`}
                      {...hit(p.id, `${p.value} cents, ${p.label}`)}
                    >
                      <circle r={12} fill="transparent" />
                      <circle r={active === p.id ? 6 : 4} className={tone} />
                      {active === p.id ? (
                        <circle
                          r={9}
                          fill="none"
                          stroke="var(--ink)"
                          strokeWidth={1.5}
                        />
                      ) : null}
                      <text
                        y={above ? -16 : 22}
                        textAnchor="middle"
                        className="num"
                        style={{ fontSize: 12 }}
                      >
                        {p.value}¢
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
        }
        narrow={<NarrowLadder active={active} hit={hit} />}
      />

      <div className="ladder-rows" data-all={showAll ? "true" : "false"} role="list" aria-label="Price ladder rungs">
        {LADDER_FAMILIES.map((fam) => {
          const pts = LADDER_POINTS.filter((p) => p.family === fam.id);
          const groupOn =
            pts.some((p) => p.id === active) ||
            (fam.id === "labrador" && active === "lab-ind-1");
          return (
            <div key={fam.id} className="ladder-group" data-open={groupOn ? "true" : "false"}>
              <button
                type="button"
                className="ladder-family"
                data-on={groupOn ? "true" : "false"}
                aria-expanded={showAll || groupOn}
                onClick={() => {
                  const first = pts[0];
                  if (first) select(first.id);
                }}
              >
                {fam.label}
              </button>
              <p className="ladder-group-measures">{fam.measures}</p>
              {pts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="ladder-row"
                  id={`ladder-${p.id}`}
                  aria-pressed={active === p.id}
                  data-on={active === p.id ? "true" : "false"}
                  onClick={() => select(p.id)}
                >
                  <span className="v">
                    {p.value}
                    {p.cents === null ? "" : "¢"}
                  </span>
                  <span className="fam">{p.label}</span>
                </button>
              ))}
              {fam.id === "labrador" ? (
                <button
                  type="button"
                  className="ladder-row"
                  aria-pressed={active === "lab-ind-1"}
                  data-on={active === "lab-ind-1" ? "true" : "false"}
                  onClick={() => select("lab-ind-1")}
                >
                  <span className="v">LAB-IND-1</span>
                  <span className="fam">Mine rate, a formula</span>
                </button>
              ) : null}
            </div>
          );
        })}
        <button
          type="button"
          className="inst-chunk-btn"
          aria-expanded={showAll}
          onClick={() => setShowAll((open) => !open)}
        >
          {showAll ? "Show this family" : "Show every rung"}
        </button>
      </div>

      {point ? (
        <InstDetail
          kicker={point.label}
          body={point.note}
          {...(point.href ? { href: point.href, hrefLabel: "Card →" } : {})}
          figure={{
            value: `${point.value}${point.cents === null ? "" : "¢"}`,
            status: point.status,
            sources: point.sources.map((id) => DESK_SOURCES[id]),
            lastVerified: point.lastVerified,
            note: point.note,
          }}
        />
      ) : (
        <InstDetail
          kicker="Mine rate"
          body="The mine rate is demand charges plus a monthly formula, RFIRM = {(ED × RD) + (EM × RM)} / ETOTAL. It is not one cent and is not drawn as a rung."
          href="/costs#lab-ind-1"
          hrefLabel="Card →"
        />
      )}

      <p className="inst-caption">
        Each row measures something different. A starting price, a fifty-year
        average and a household tariff cannot be subtracted from one another.
        The desk labels them and refuses to merge them. Source for each rung is
        under its number.
      </p>
    </div>
  );
}

function NarrowLadder({
  active,
  hit,
}: {
  active: string;
  hit: ReturnType<typeof useInstSelect<string>>["hit"];
}) {
  const fam =
    LADDER_FAMILIES.find((family) =>
      LADDER_POINTS.some((point) => point.family === family.id && point.id === active),
    ) ??
    (active === "lab-ind-1"
      ? LADDER_FAMILIES.find((family) => family.id === "labrador")
      : undefined) ??
    LADDER_FAMILIES[0]!;
  const placed = LADDER_POINTS.filter((point) => point.family === fam.id && point.cents !== null);
  const missing = LADDER_POINTS.find((point) => point.family === fam.id && point.cents === null);
  const width = 400;
  const height = 176;
  const left = 28;
  const right = 28;
  const axisY = 108;
  const axisW = width - left - right;
  const xOf = (cents: number) => left + (Math.min(cents, MAX_C) / MAX_C) * axisW;
  const sides = staggerByX(
    placed.map((point) => xOf(point.cents!)),
    72,
  );
  const tone = toneClass(fam.tone);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="group" aria-label={`${fam.label} on the price ladder`}>
      <title>{fam.label}</title>
      <text x={left} y={32} className="lbl-read">
        {fam.short}
      </text>
      <text x={width - right} y={32} textAnchor="end" className="lbl">
        0–18¢
      </text>
      <line x1={left} x2={width - right} y1={axisY} y2={axisY} className="hair" />
      {[0, 9, 18].map((tick) => (
        <text key={tick} x={xOf(tick)} y={axisY + 46} textAnchor="middle" className="lbl">
          {tick}¢
        </text>
      ))}
      {missing ? (
        <g {...hit(missing.id, `${missing.value}, ${missing.label}`)}>
          <rect
            x={left}
            y={axisY - 18}
            width={axisW}
            height={36}
            fill="transparent"
            className="stroke-alert"
            strokeDasharray="4 4"
            strokeWidth={active === missing.id ? 1.5 : 1}
          />
          <text x={width / 2} y={axisY + 5} textAnchor="middle" className="num" style={{ fontSize: 14 }}>
            {missing.value}
          </text>
        </g>
      ) : null}
      {placed.map((point, index) => {
        const px = xOf(point.cents!);
        const label = clampLabelX(px, width, 48);
        const above = sides[index] !== "below";
        const on = active === point.id;
        return (
          <g key={point.id} {...hit(point.id, `${point.value} cents, ${point.label}`)}>
            <circle cx={px} cy={axisY} r={18} fill="transparent" />
            <circle cx={px} cy={axisY} r={on ? 6 : 4} className={tone} />
            {on ? (
              <circle cx={px} cy={axisY} r={10} fill="none" stroke="var(--ink)" strokeWidth={1.5} />
            ) : null}
            <text
              x={label.x}
              y={above ? axisY - 16 : axisY + 22}
              textAnchor={label.anchor}
              className="num"
              style={{ fontSize: 14 }}
            >
              {point.value}¢
            </text>
          </g>
        );
      })}
    </svg>
  );
}
