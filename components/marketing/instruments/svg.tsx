import type { CSSProperties } from "react";
import { wrapLabel, type LabelAnchor } from "./layout";

/** Multiline SVG label, vertically centred on `y`. */
export function SvgLines({
  text,
  x,
  y,
  maxChars,
  lineHeight = 12,
  textAnchor = "start",
  className,
  style,
}: {
  text: string;
  x: number;
  y: number;
  maxChars: number;
  lineHeight?: number;
  textAnchor?: LabelAnchor;
  className?: string;
  style?: CSSProperties;
}) {
  const lines = wrapLabel(text, maxChars);
  const start = y - ((lines.length - 1) * lineHeight) / 2;
  return (
    <text textAnchor={textAnchor} className={className} style={style}>
      {lines.map((line, i) => (
        <tspan key={`${i}-${line}`} x={x} y={start + i * lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}
