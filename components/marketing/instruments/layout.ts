/**
 * Geometry helpers for the desk instruments. Numbers still come from
 * lib/desk; this file only places labels so they can be read.
 */

export type LabelAnchor = "start" | "middle" | "end";
export type LabelSide = "above" | "below";

export type GateLabelLayout = {
  side: LabelSide;
  /** 0 = closer to the rail, 1 = outer row when neighbours collide. */
  tier: 0 | 1;
  anchor: LabelAnchor;
};

/** Greedy word wrap. A single over-long token is left intact. */
export function wrapLabel(text: string, maxChars: number): string[] {
  if (maxChars < 1) return [text];
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const lines: string[] = [];
  let current = words[0]!;
  for (const word of words.slice(1)) {
    const next = `${current} ${word}`;
    if (next.length <= maxChars) current = next;
    else {
      lines.push(current);
      current = word;
    }
  }
  lines.push(current);
  return lines;
}

/**
 * Alternate above/below, then bump a later same-side label to an outer
 * tier when two ticks sit closer than `minSep`. Edge ticks left-align or
 * right-align so they do not run off the canvas.
 */
export function layoutGateLabels(
  xs: readonly number[],
  opts: { minSep?: number; leftEdge?: number; rightEdge?: number } = {},
): GateLabelLayout[] {
  const minSep = opts.minSep ?? 170;
  const leftEdge = opts.leftEdge ?? Number.NEGATIVE_INFINITY;
  const rightEdge = opts.rightEdge ?? Number.POSITIVE_INFINITY;
  const slots: GateLabelLayout[] = xs.map((x, i) => ({
    side: i % 2 === 0 ? "above" : "below",
    tier: 0,
    anchor: x <= leftEdge ? "start" : x >= rightEdge ? "end" : "middle",
  }));
  for (let i = 0; i < xs.length; i++) {
    for (let j = i + 1; j < xs.length; j++) {
      if (slots[i]!.side !== slots[j]!.side) continue;
      if (slots[i]!.tier !== slots[j]!.tier) continue;
      if (Math.abs(xs[j]! - xs[i]!) < minSep) slots[j]!.tier = 1;
    }
  }
  return slots;
}

/**
 * Place rung labels on a shared axis. Close neighbours take opposite
 * sides of the row so 6¢ and 7.4¢ do not sit on top of each other.
 */
export function staggerByX(
  xs: readonly number[],
  minSep: number,
): Array<LabelSide> {
  const out: LabelSide[] = [];
  for (let i = 0; i < xs.length; i++) {
    if (i === 0) {
      out.push("above");
      continue;
    }
    const close = Math.abs(xs[i]! - xs[i - 1]!) < minSep;
    if (close) out.push(out[i - 1] === "above" ? "below" : "above");
    else out.push(i % 2 === 0 ? "above" : "below");
  }
  return out;
}
