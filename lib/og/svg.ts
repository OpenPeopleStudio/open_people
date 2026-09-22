import type { DeskOgCard } from "./copy";

const VOID = "#040404";
const INK = "#f2f4f6";
const INK_2 = "rgba(242,244,246,0.74)";
const PLASMA = "#e8893c";
const STEEL = "#8a9bb0";
const HAIRLINE = "rgba(255,255,255,0.16)";

function xml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Desk v2 share card as SVG. Rasterized to 1200×630 PNG so /og-image.png
 * cannot be an empty placeholder. Runtime routes use ImageResponse of the
 * same layout.
 */
export function deskOgSvg(card: DeskOgCard): string {
  const kickerColor = card.quiet ? STEEL : PLASMA;
  const accentColor = card.quiet ? STEEL : PLASMA;
  const kickerRest = card.quiet ? STEEL : INK_2;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${VOID}"/>
  <rect width="1200" height="2" fill="${PLASMA}"/>
  <text x="72" y="108" font-family="JetBrains Mono, ui-monospace, monospace" font-size="18" letter-spacing="2.6" fill="${kickerColor}">${xml(card.kicker.toUpperCase())}<tspan fill="${STEEL}" dx="14">·</tspan><tspan fill="${kickerRest}" dx="14">${xml(card.kickerAccent.toUpperCase())}</tspan></text>
  <text x="72" y="268" font-family="Noto Serif, Georgia, serif" font-size="58" fill="${INK}">${xml(card.headline)}</text>
  <text x="72" y="340" font-family="Noto Serif, Georgia, serif" font-size="58" fill="${accentColor}">${xml(card.accent)}</text>
  <line x1="72" y1="528" x2="1128" y2="528" stroke="${HAIRLINE}" stroke-width="1"/>
  <text x="72" y="572" font-family="JetBrains Mono, ui-monospace, monospace" font-size="16" letter-spacing="1.8" fill="${STEEL}">OPEN PEOPLE<tspan fill="${PLASMA}"> · NL</tspan></text>
  <text x="1128" y="572" text-anchor="end" font-family="JetBrains Mono, ui-monospace, monospace" font-size="16" letter-spacing="1.6" fill="${STEEL}">${xml(card.footer.toUpperCase())}</text>
</svg>
`;
}
