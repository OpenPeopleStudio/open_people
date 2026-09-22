/**
 * Shared geometry for the desk share card.
 * ImageResponse (image.tsx) and the SVG twin (svg.ts) must stay in lockstep.
 * Instrument, not poster: 8px plasma chassis, left column, abstract ticks.
 * No glow, no HUD brackets, no invented ¢/MW.
 */

export const OG_SIZE = { width: 1200, height: 630 } as const;

export const OG_COLOR = {
  void: "#040404",
  surface: "#0a0a0b",
  ink: "#f2f4f6",
  ink2: "rgba(242,244,246,0.74)",
  ink3: "rgba(242,244,246,0.58)",
  plasma: "#e8893c",
  steel: "#8a9bb0",
  hairline: "rgba(255,255,255,0.08)",
  hairlineStrong: "rgba(255,255,255,0.16)",
  field: "rgba(255,255,255,0.028)",
} as const;

/** Structural plasma rail / top bar. 6–8px; 8px is the committed weight. */
export const OG_RAIL = 8;

export const OG_FONT = {
  sans: "Inter, ui-sans-serif, system-ui, sans-serif",
  mono: "ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace",
  svgSans: "Inter, ui-sans-serif, system-ui, sans-serif",
  svgMono: "JetBrains Mono, ui-monospace, SF Mono, Menlo, monospace",
} as const;

export const OG_LAYOUT = {
  rail: OG_RAIL,
  padX: 80,
  padTop: 44,
  padBottom: 38,
  columnW: 780,
  foot: 280,
  kickerSize: 14,
  kickerTracking: 3.1,
  headlineSize: 72,
  headlineTracking: -2.9,
  headlineLine: 0.94,
  accentSize: 24,
  accentTracking: 2.2,
  footerSize: 13,
  footerTracking: 2.6,
  chipSize: 11,
  chipTracking: 1.8,
} as const;

/** Abstract gate ticks. Lengths are marks, not data. One `now` tick, unlabelled. */
export const OG_MARK = {
  spineX: 1048,
  y: 88,
  h: 412,
} as const;

export type OgTick = {
  t: number;
  len: number;
  now?: boolean;
};

export const OG_TICKS: readonly OgTick[] = [
  { t: 0, len: 18 },
  { t: 0.16, len: 34 },
  { t: 0.33, len: 64, now: true },
  { t: 0.52, len: 28 },
  { t: 0.73, len: 22 },
  { t: 1, len: 14 },
] as const;

export function ogAccent(quiet?: boolean): string {
  return quiet ? OG_COLOR.steel : OG_COLOR.plasma;
}

export function ogTickY(tick: OgTick): number {
  return OG_MARK.y + tick.t * OG_MARK.h;
}

export function wrapHeadline(
  text: string,
  fontSize: number,
  maxWidth: number,
): string[] {
  const widthOf = (value: string) =>
    value.length * fontSize * 0.48 + Math.max(0, value.length - 1) * OG_LAYOUT.headlineTracking;

  if (widthOf(text) <= maxWidth) return [text];

  const sentence = text.match(/^(.+?[.])\s+(.+)$/);
  if (sentence && widthOf(sentence[1]) <= maxWidth) {
    return [sentence[1], sentence[2]];
  }

  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (widthOf(next) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}
