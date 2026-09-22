import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { DESK_VERIFIED, GATES, railPosition } from "@/lib/desk";

/**
 * Share-card renderer for the Churchill River desk. One design, per-page
 * words. 1200×630. Black field, serif headline, mono labels, the gate rail
 * along the bottom. Fonts are the site's own (Newsreader, Inter, JetBrains
 * Mono), read from lib/og/fonts at render time.
 */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const INK = "#f2f4f6";
const INK_2 = "rgba(242,244,246,0.74)";
const INK_3 = "rgba(242,244,246,0.56)";
const PLASMA = "#e8893c";
const STEEL = "#8a9bb0";
const AMBER = "#d4a84b";
const ALERT = "#e07a5f";
const HAIR = "rgba(255,255,255,0.14)";

export type DeskCardStat = {
  value: string;
  unit: string;
  /** dashed = not published */
  tone?: "ink" | "plasma" | "alert" | "steel";
};

export type DeskCardProps = {
  kicker: string;
  /** headline; the part in `em` renders in plasma */
  title: string;
  em?: string | undefined;
  lede: string;
  stat?: DeskCardStat | undefined;
  /** show the gate rail (default true) */
  rail?: boolean | undefined;
};

async function font(name: string): Promise<ArrayBuffer> {
  const buf = await readFile(join(process.cwd(), "lib", "og", "fonts", name));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

async function fonts() {
  const [nr400, nr500, nrIt, in400, in500, jb400, jb500] = await Promise.all([
    font("Newsreader-400.woff"),
    font("Newsreader-500.woff"),
    font("Newsreader-400-italic.woff"),
    font("Inter-400.woff"),
    font("Inter-500.woff"),
    font("JetBrainsMono-Regular.ttf"),
    font("JetBrainsMono-Medium.ttf"),
  ]);
  return [
    { name: "Newsreader", data: nr400, weight: 400 as const, style: "normal" as const },
    { name: "Newsreader", data: nr500, weight: 500 as const, style: "normal" as const },
    { name: "Newsreader", data: nrIt, weight: 400 as const, style: "italic" as const },
    { name: "Inter", data: in400, weight: 400 as const, style: "normal" as const },
    { name: "Inter", data: in500, weight: 500 as const, style: "normal" as const },
    { name: "JetBrains Mono", data: jb400, weight: 400 as const, style: "normal" as const },
    { name: "JetBrains Mono", data: jb500, weight: 500 as const, style: "normal" as const },
  ];
}

const mono = (size: number, color = INK_3, weight: 400 | 500 = 400) => ({
  fontFamily: "JetBrains Mono",
  fontSize: size,
  fontWeight: weight,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const,
  color,
});

function GateRail() {
  const onScale = GATES.filter((g) => !g.offscale);
  const left = 72;
  const width = 1200 - 72 - 72 - 120;
  const y = 0;
  return (
    <div style={{ position: "relative", width: 1200, height: 74, display: "flex" }}>
      <div
        style={{
          position: "absolute",
          left,
          top: y + 36,
          width,
          height: 1,
          background: HAIR,
        }}
      />
      {onScale.map((g, i) => {
        const x = left + railPosition(g.date, GATES) * width;
        const above = i % 2 === 0;
        const color = g.status === "open" ? AMBER : PLASMA;
        return (
          <div key={g.id} style={{ position: "absolute", left: x - 60, top: 0, width: 120, height: 74, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ ...mono(11, INK, 500), letterSpacing: "0.06em", textTransform: "none", height: 16, display: "flex", opacity: above ? 1 : 0 }}>{g.short}</div>
            <div style={{ height: 14, width: 1, background: HAIR, display: "flex", opacity: above ? 1 : 0 }} />
            <div style={{ width: 10, height: 10, borderRadius: 5, background: color, display: "flex", marginTop: 1, border: g.kind === "target" ? `1px solid ${color}` : "none" }} />
            <div style={{ height: 14, width: 1, background: HAIR, display: "flex", opacity: above ? 0 : 1 }} />
            <div style={{ ...mono(11, INK, 500), letterSpacing: "0.06em", textTransform: "none", height: 16, display: "flex", opacity: above ? 0 : 1 }}>{g.short}</div>
          </div>
        );
      })}
      {/* break + off-scale year */}
      <div style={{ position: "absolute", left: left + width + 18, top: y + 30, display: "flex", ...mono(12, INK_3) }}>⋯</div>
      <div style={{ position: "absolute", left: left + width + 56, top: y + 22, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 12, height: 12, border: `1px solid ${STEEL}`, background: "repeating-linear-gradient(135deg, #8a9bb0 0 1px, transparent 1px 4px)", display: "flex" }} />
        <div style={{ ...mono(11, INK_3), letterSpacing: "0.06em", textTransform: "none", marginTop: 6, display: "flex" }}>2036</div>
      </div>
    </div>
  );
}

export async function deskCard({ kicker, title, em, lede, stat, rail = true }: DeskCardProps) {
  const chars = title.length + (em?.length ?? 0);
  const headSize = chars > 52 ? 54 : chars > 40 ? 62 : stat ? 72 : 78;
  const statColor =
    stat?.tone === "plasma" ? PLASMA : stat?.tone === "alert" ? ALERT : stat?.tone === "steel" ? STEEL : INK;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#040404",
          color: INK,
          padding: "56px 72px 44px",
          position: "relative",
          fontFamily: "Inter",
        }}
      >
        {/* top row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", ...mono(15, INK, 500) }}>
            Open People
            <span style={{ color: PLASMA, marginLeft: 12 }}>· {kicker}</span>
          </div>
          <div style={{ display: "flex", ...mono(13, INK_3) }}>openpeople.ai</div>
        </div>

        {/* headline + lede */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 34, flexGrow: 1 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontFamily: "Newsreader",
              fontWeight: 400,
              fontSize: headSize,
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
              maxWidth: stat ? 760 : 1000,
            }}
          >
            <span>{title}</span>
            {em ? <span style={{ color: PLASMA, marginLeft: "0.28em" }}>{em}</span> : null}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 22,
              fontSize: chars > 40 ? 22 : 25,
              lineHeight: 1.4,
              color: INK_2,
              maxWidth: stat ? 720 : 960,
            }}
          >
            {lede}
          </div>
        </div>

        {/* stat tile */}
        {stat ? (
          <div
            style={{
              position: "absolute",
              right: 72,
              top: 150,
              width: 300,
              display: "flex",
              flexDirection: "column",
              padding: "26px 28px 24px",
              border: `1px ${stat.tone === "alert" ? "dashed" : "solid"} ${stat.tone === "alert" ? ALERT : HAIR}`,
              background: "#0a0a0b",
            }}
          >
            <div
              style={{
                display: "flex",
                fontFamily: "JetBrains Mono",
                fontWeight: 500,
                fontSize: stat.value.length > 7 ? 44 : 64,
                lineHeight: 1,
                letterSpacing: "-0.04em",
                color: statColor,
              }}
            >
              {stat.value}
            </div>
            <div style={{ display: "flex", marginTop: 14, ...mono(12, INK_3), lineHeight: 1.5, textTransform: "uppercase" }}>{stat.unit}</div>
          </div>
        ) : null}

        {/* rail + verified */}
        {rail ? <GateRail /> : null}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: rail ? 14 : 0, paddingTop: 14, borderTop: `1px solid ${HAIR}` }}>
          <div style={{ display: "flex", ...mono(12, INK_3) }}>Last verified {DESK_VERIFIED} · public documents only · unknown labelled</div>
          <div style={{ display: "flex", ...mono(12, INK_3) }}>Framework, not binding contracts · mining first</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts() }
  );
}
