import { ImageResponse } from "next/og";
import type { DeskOgCard } from "./copy";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const VOID = "#040404";
const INK = "#f2f4f6";
const INK_2 = "rgba(242,244,246,0.74)";
const PLASMA = "#e8893c";
const STEEL = "#8a9bb0";
const HAIRLINE = "rgba(255,255,255,0.08)";

const SERIF = "Georgia, 'Times New Roman', Times, serif";
const MONO = "ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace";

/**
 * Desk v2 share card: void field, plasma hairline, serif headline, mono kicker.
 * No glow, no HUD, no invented ¢/MW. Satori-safe (flex + inline styles only).
 */
export function deskOgImage(card: DeskOgCard) {
  return new ImageResponse(deskOgElement(card), OG_SIZE);
}

export function deskOgElement(card: DeskOgCard) {
  const kickerColor = card.quiet ? STEEL : PLASMA;
  const accentColor = card.quiet ? STEEL : PLASMA;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: VOID,
        color: INK,
        padding: "56px 72px 52px",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: PLASMA,
        }}
      />

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "baseline",
            fontFamily: MONO,
            fontSize: 18,
            letterSpacing: "0.16em",
            color: kickerColor,
          }}
        >
          <span>{card.kicker.toUpperCase()}</span>
          <span style={{ color: STEEL, marginLeft: 12, marginRight: 12 }}>·</span>
          <span style={{ color: card.quiet ? STEEL : INK_2 }}>{card.kickerAccent.toUpperCase()}</span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 36,
            fontFamily: SERIF,
            fontSize: 58,
            lineHeight: 1.08,
            letterSpacing: "-0.025em",
            maxWidth: 1020,
          }}
        >
          <span>{card.headline}</span>
          <span style={{ color: accentColor, marginTop: 8 }}>{card.accent}</span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: `1px solid ${HAIRLINE}`,
          paddingTop: 22,
          fontFamily: MONO,
          fontSize: 16,
          letterSpacing: "0.12em",
          color: STEEL,
        }}
      >
        <span>
          OPEN PEOPLE
          <span style={{ color: PLASMA }}> · NL</span>
        </span>
        <span>{card.footer.toUpperCase()}</span>
      </div>
    </div>
  );
}
