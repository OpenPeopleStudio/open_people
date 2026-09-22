import type { DeskOgCard } from "./copy";
import { deskOgFooterUrl, deskOgKicker } from "./copy";
import {
  OG_COLOR,
  OG_FONT,
  OG_LAYOUT,
  OG_MARK,
  OG_RAIL,
  OG_SIZE,
  OG_TICKS,
  ogAccent,
  ogTickY,
  wrapHeadline,
} from "./layout";

function xml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Desk share card as SVG. Same chassis / type / ticks as image.tsx.
 * Rasterized to 1200×630 PNG so /og-image.png cannot be an empty placeholder.
 */
export function deskOgSvg(card: DeskOgCard): string {
  const accent = ogAccent(card.quiet);
  const kicker = deskOgKicker(card);
  const [kickerBrand = kicker, ...kickerRestParts] = kicker.split(" · ");
  const kickerRest = kickerRestParts.join(" · ");
  const kickerRestFill = card.quiet ? OG_COLOR.steel : OG_COLOR.ink2;
  const footerUrl = deskOgFooterUrl(card);
  const lines = wrapHeadline(
    card.headline,
    OG_LAYOUT.headlineSize,
    OG_LAYOUT.columnW,
  );
  const headlineStart = 186;
  const headlineGap = OG_LAYOUT.headlineSize * OG_LAYOUT.headlineLine;
  const accentY = headlineStart + (lines.length - 1) * headlineGap + 50;
  const footerY = 574;
  const hairY = 532;
  const chipX = OG_LAYOUT.padX + 152;
  const chipY = 556;

  const ticks = OG_TICKS.map((tick) => {
    const y = ogTickY(tick);
    const now = Boolean(tick.now) && !card.quiet;
    const color = now ? accent : OG_COLOR.steel;
    const thickness = now ? 2 : 1;
    const square = now
      ? `<rect x="${OG_MARK.spineX - tick.len - 7}" y="${y - 3}" width="7" height="7" fill="${color}"/>`
      : "";
    return `<rect x="${OG_MARK.spineX - tick.len}" y="${y}" width="${tick.len}" height="${thickness}" fill="${color}"/>${square}`;
  }).join("\n  ");

  const headline = lines
    .map((line, i) => {
      const y = headlineStart + i * headlineGap;
      return `<text x="${OG_LAYOUT.padX}" y="${y}" font-family="${OG_FONT.svgSans}" font-size="${OG_LAYOUT.headlineSize}" font-weight="700" letter-spacing="${OG_LAYOUT.headlineTracking}" fill="${OG_COLOR.ink}">${xml(line)}</text>`;
    })
    .join("\n  ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${OG_SIZE.width}" height="${OG_SIZE.height}" viewBox="0 0 ${OG_SIZE.width} ${OG_SIZE.height}">
  <defs>
    <linearGradient id="og-field" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.034"/>
      <stop offset="42%" stop-color="#ffffff" stop-opacity="0.012"/>
      <stop offset="74%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${OG_SIZE.width}" height="${OG_SIZE.height}" fill="${OG_COLOR.void}"/>
  <rect width="${OG_SIZE.width}" height="${OG_SIZE.height}" fill="url(#og-field)"/>
  <text x="${OG_LAYOUT.padX}" y="78" font-family="${OG_FONT.svgMono}" font-size="${OG_LAYOUT.kickerSize}" letter-spacing="${OG_LAYOUT.kickerTracking}" fill="${accent}">${xml(kickerBrand)}<tspan fill="${OG_COLOR.steel}" dx="10">·</tspan><tspan fill="${kickerRestFill}" dx="10">${xml(kickerRest)}</tspan></text>
  ${headline}
  <text x="${OG_LAYOUT.padX}" y="${accentY}" font-family="${OG_FONT.svgMono}" font-size="${OG_LAYOUT.accentSize}" letter-spacing="${OG_LAYOUT.accentTracking}" fill="${accent}">${xml(card.accent)}</text>
  <line x1="${OG_LAYOUT.padX}" y1="${hairY}" x2="${OG_LAYOUT.padX + OG_LAYOUT.columnW}" y2="${hairY}" stroke="${OG_COLOR.hairline}" stroke-width="1"/>
  <text x="${OG_LAYOUT.padX}" y="${footerY}" font-family="${OG_FONT.svgMono}" font-size="${OG_LAYOUT.footerSize}" letter-spacing="${OG_LAYOUT.footerTracking}" fill="${OG_COLOR.steel}">OPEN PEOPLE</text>
  <rect x="${chipX}" y="${chipY}" width="40" height="22" fill="none" stroke="${accent}" stroke-width="1"/>
  <text x="${chipX + 20}" y="${chipY + 16}" text-anchor="middle" font-family="${OG_FONT.svgMono}" font-size="${OG_LAYOUT.chipSize}" letter-spacing="${OG_LAYOUT.chipTracking}" fill="${accent}">NL</text>
  <text x="${OG_LAYOUT.padX + OG_LAYOUT.columnW}" y="${footerY}" text-anchor="end" font-family="${OG_FONT.svgMono}" font-size="${OG_LAYOUT.footerSize}" letter-spacing="${OG_LAYOUT.footerTracking}" fill="${OG_COLOR.steel}">${xml(footerUrl)}</text>
  <rect x="${OG_MARK.spineX}" y="${OG_MARK.y}" width="1" height="${OG_MARK.h}" fill="${OG_COLOR.hairlineStrong}"/>
  ${ticks}
  <rect width="${OG_SIZE.width}" height="${OG_RAIL}" fill="${accent}"/>
  <rect width="${OG_RAIL}" height="${OG_SIZE.height}" fill="${accent}"/>
  <rect y="${OG_SIZE.height - OG_RAIL}" width="${OG_LAYOUT.foot}" height="${OG_RAIL}" fill="${accent}"/>
</svg>
`;
}
