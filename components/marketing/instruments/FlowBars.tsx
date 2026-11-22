"use client";

import { useState } from "react";
import { DESK_SOURCES, FLOW_BARS, type FlowFill } from "@/lib/desk";
import { InstDetail, useInstSelect } from "./InstDetail";
import { InstFit, SvgLines } from "./svg";

/**
 * I4 — Flow Bars. Proportional megawatt bars. Fill encodes how hard the
 * number is: solid published, outlined announced, hatched preliminary,
 * dashed not published.
 */
const W = 1000;
const LEFT = 300;
const RIGHT = 120;
const ROW_H = 54;
const TOP = 16;
const MAX_MW = 5500;

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
        fill: "rgba(242, 80, 31, 0.12)",
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
  const { active, select, hit } = useInstSelect(FLOW_BARS[0].id);
  const [listOpen, setListOpen] = useState(false);
  const bar = FLOW_BARS.find((item) => item.id === active) ?? FLOW_BARS[0];
  const H = TOP + FLOW_BARS.length * ROW_H + 8;
  return (
    <div className="inst flow-bars">
      <InstFit
        wide={
        <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Megawatt figures">
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
            const width = b.mw === null ? bw(2350) : bw(b.mw);
            const lowWidth = b.mwLow ? bw(b.mwLow) : null;
            return (
              <g key={b.id} transform={`translate(0 ${y})`} {...hit(b.id, `${b.label}, ${b.value}`)}>
                <rect x={0} y={0} width={W} height={ROW_H} fill="transparent" />
                <SvgLines
                  text={b.label}
                  x={LEFT - 14}
                  y={27}
                  maxChars={22}
                  lineHeight={12}
                  textAnchor="end"
                  className="lbl lbl-strong"
                />
                {b.fill === "hatch" && lowWidth !== null ? (
                  <>
                    <rect
                      className="bar-grow"
                      x={LEFT}
                      y={12}
                      width={lowWidth}
                      height={22}
                      fill="url(#fb-hatch)"
                      stroke="var(--steel)"
                      strokeWidth={1}
                    />
                    <rect
                      className="bar-grow"
                      x={LEFT + lowWidth}
                      y={12}
                      width={width - lowWidth}
                      height={22}
                      fill="none"
                      stroke="var(--steel)"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                    />
                  </>
                ) : (
                  <rect
                    className="bar-grow"
                    x={LEFT}
                    y={12}
                    width={width}
                    height={22}
                    {...attrs}
                    strokeWidth={1}
                  />
                )}
                <text
                  x={LEFT + width + 10}
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
        }
        narrow={<NarrowFlows active={active} hit={hit} />}
      />

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

      <button
        type="button"
        className="inst-chunk-btn"
        aria-expanded={listOpen}
        onClick={() => setListOpen((open) => !open)}
      >
        {listOpen ? "Hide the full list" : "Show every figure"}
      </button>
      {listOpen ? (
      <div className="ladder-rows" role="list" aria-label="Megawatt figures">
        {FLOW_BARS.map((b) => (
          <button
            key={b.id}
            type="button"
            className="ladder-row"
            aria-pressed={active === b.id}
            data-on={active === b.id ? "true" : "false"}
            onClick={() => select(b.id)}
          >
            <span className="v">{b.value}</span>
            <span className="fam">{b.label}</span>
          </button>
        ))}
      </div>
      ) : null}
      <InstDetail
        kicker={bar.label}
        body={bar.note}
        {...(bar.href ? { href: bar.href, hrefLabel: "Record →" } : {})}
        figure={{
          value: bar.value,
          status: bar.status,
          sources: bar.sources.map((id) => DESK_SOURCES[id]),
          lastVerified: bar.lastVerified,
          note: bar.note,
        }}
      />
    </div>
  );
}

function NarrowFlows({
  active,
  hit,
}: {
  active: string;
  hit: ReturnType<typeof useInstSelect<string>>["hit"];
}) {
  const width = 400;
  const row = 96;
  const height = 8 + FLOW_BARS.length * row;
  const inner = width - 32;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="group" aria-label="Megawatt figures">
      <title>Megawatts, one figure per row</title>
      <defs>
        <pattern
          id="fb-hatch-n"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--steel)" strokeWidth="1" />
        </pattern>
      </defs>
      {FLOW_BARS.map((bar, index) => {
        const y = 6 + index * row;
        const on = active === bar.id;
        const span = bar.mw === null ? inner * 0.42 : (inner * Math.min(bar.mw, MAX_MW)) / MAX_MW;
        const low = bar.mwLow ? (inner * bar.mwLow) / MAX_MW : null;
        const attrs = fillAttrs(bar.fill);
        const fill = bar.fill === "hatch" ? "url(#fb-hatch-n)" : attrs.fill;
        return (
          <g key={bar.id} {...hit(bar.id, `${bar.label}, ${bar.value}`)}>
            <rect x={4} y={y} width={width - 8} height={row - 8} fill={on ? "var(--surface-2)" : "transparent"} />
            <SvgLines
              text={bar.label}
              x={16}
              y={y + 22}
              maxChars={36}
              lineHeight={15}
              className="lbl-read"
            />
            <SvgLines
              text={bar.value}
              x={16}
              y={y + 52}
              maxChars={34}
              lineHeight={15}
              className="num"
              style={{ fontSize: 14 }}
            />
            {bar.fill === "hatch" && low !== null ? (
              <>
                <rect className="bar-grow" x={16} y={y + 70} width={low} height={12} fill={fill} stroke="var(--steel)" strokeWidth={1} />
                <rect
                  className="bar-grow"
                  x={16 + low}
                  y={y + 70}
                  width={Math.max(span - low, 0)}
                  height={12}
                  fill="none"
                  stroke="var(--steel)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
              </>
            ) : (
              <rect
                className="bar-grow"
                x={16}
                y={y + 70}
                width={Math.max(span, 8)}
                height={12}
                fill={fill}
                stroke={attrs.stroke}
                strokeWidth={1}
                strokeDasharray={attrs.strokeDasharray}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
