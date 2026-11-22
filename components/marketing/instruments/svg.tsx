import type { CSSProperties, ReactNode } from "react";
import { wrapLabel, type LabelAnchor } from "./layout";

/**
 * Wide drawing when the instrument has room; stacked drawing when it does not.
 * CSS switches on the container, so the first paint does not scroll sideways.
 */
export function InstFit({ wide, narrow }: { wide: ReactNode; narrow: ReactNode }) {
  return (
    <div className="inst-fit">
      <div className="inst-fit-wide">{wide}</div>
      <div className="inst-fit-narrow">{narrow}</div>
    </div>
  );
}

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
