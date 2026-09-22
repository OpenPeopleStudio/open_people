import { ImageResponse } from "next/og";
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

export { OG_SIZE };
export const OG_CONTENT_TYPE = "image/png";

/**
 * Desk share card: 8px plasma chassis, grotesque headline, mono kicker,
 * abstract gate ticks. No glow, no HUD, no invented ¢/MW.
 * Satori-safe (flex + inline styles only).
 */
export function deskOgImage(card: DeskOgCard) {
  return new ImageResponse(deskOgElement(card), OG_SIZE);
}

export function deskOgElement(card: DeskOgCard) {
  const accent = ogAccent(card.quiet);
  const kicker = deskOgKicker(card);
  const footerUrl = deskOgFooterUrl(card);
  const kickerBrand = kicker.split(" · ")[0] ?? kicker;
  const kickerRest = kicker.split(" · ").slice(1).join(" · ");
  const headlineLines = wrapHeadline(
    card.headline,
    OG_LAYOUT.headlineSize,
    OG_LAYOUT.columnW,
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: OG_COLOR.void,
        backgroundImage:
          "linear-gradient(156deg, rgba(255,255,255,0.034) 0%, rgba(255,255,255,0.012) 42%, rgba(4,4,4,0) 74%)",
        color: OG_COLOR.ink,
        position: "relative",
      }}
    >
      {/* Chassis painted last so the field never covers the 8px rail/bar */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: OG_LAYOUT.columnW + OG_LAYOUT.padX,
          height: "100%",
          paddingTop: OG_LAYOUT.padTop,
          paddingBottom: OG_LAYOUT.padBottom,
          paddingLeft: OG_LAYOUT.padX,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "baseline",
              fontFamily: OG_FONT.mono,
              fontSize: OG_LAYOUT.kickerSize,
              letterSpacing: OG_LAYOUT.kickerTracking,
              color: accent,
            }}
          >
            <span>{kickerBrand}</span>
            <span style={{ color: OG_COLOR.steel, marginLeft: 10, marginRight: 10 }}>
              ·
            </span>
            <span style={{ color: card.quiet ? OG_COLOR.steel : OG_COLOR.ink2 }}>
              {kickerRest}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 24,
              fontFamily: OG_FONT.sans,
              fontSize: OG_LAYOUT.headlineSize,
              fontWeight: 700,
              lineHeight: OG_LAYOUT.headlineLine,
              letterSpacing: OG_LAYOUT.headlineTracking,
              maxWidth: OG_LAYOUT.columnW,
            }}
          >
            {headlineLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 14,
              fontFamily: OG_FONT.mono,
              fontSize: OG_LAYOUT.accentSize,
              letterSpacing: OG_LAYOUT.accentTracking,
              color: accent,
            }}
          >
            {card.accent}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: `1px solid ${OG_COLOR.hairline}`,
            paddingTop: 18,
            width: OG_LAYOUT.columnW,
            fontFamily: OG_FONT.mono,
            fontSize: OG_LAYOUT.footerSize,
            letterSpacing: OG_LAYOUT.footerTracking,
            color: OG_COLOR.steel,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <span>OPEN PEOPLE</span>
            <div
              style={{
                display: "flex",
                marginLeft: 12,
                border: `1px solid ${accent}`,
                padding: "3px 8px",
                fontSize: OG_LAYOUT.chipSize,
                letterSpacing: OG_LAYOUT.chipTracking,
                color: accent,
              }}
            >
              NL
            </div>
          </div>
          <span>{footerUrl}</span>
        </div>
      </div>

      {/* Abstract gate ticks — no labels, no fake data */}
      <div
        style={{
          position: "absolute",
          left: OG_MARK.spineX,
          top: OG_MARK.y,
          width: 1,
          height: OG_MARK.h,
          backgroundColor: OG_COLOR.hairlineStrong,
          display: "flex",
        }}
      />
      {OG_TICKS.map((tick, i) => {
        const y = ogTickY(tick);
        const now = Boolean(tick.now) && !card.quiet;
        const color = now ? accent : OG_COLOR.steel;
        const thickness = now ? 2 : 1;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: OG_MARK.spineX - tick.len,
              top: y,
              width: tick.len,
              height: thickness,
              backgroundColor: color,
              display: "flex",
            }}
          />
        );
      })}
      {OG_TICKS.filter((tick) => tick.now && !card.quiet).map((tick) => (
        <div
          key="now-mark"
          style={{
            position: "absolute",
            left: OG_MARK.spineX - tick.len - 7,
            top: ogTickY(tick) - 3,
            width: 7,
            height: 7,
            backgroundColor: accent,
            display: "flex",
          }}
        />
      ))}

      {/* Chassis last: 8px top bar, left rail, short bottom foot */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: OG_RAIL,
          backgroundColor: accent,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: OG_RAIL,
          backgroundColor: accent,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: OG_LAYOUT.foot,
          height: OG_RAIL,
          backgroundColor: accent,
          display: "flex",
        }}
      />
    </div>
  );
}
