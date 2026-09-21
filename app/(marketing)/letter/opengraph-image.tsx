import { ImageResponse } from "next/og";

export const alt =
  "Churchill Falls — put the next generations first. A 15 September 2026 constituent letter from Tom Lane to Premier Tony Wakeham.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#040404",
          color: "#f2f4f6",
          padding: "64px 72px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 280,
            background:
              "radial-gradient(900px 280px at 50% -40px, rgba(232,137,60,0.16), transparent 70%)",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 18,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#e8893c",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
          >
            Letter · 15 September 2026
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              marginTop: 28,
              fontSize: 56,
              lineHeight: 1.1,
              letterSpacing: "-0.025em",
              fontFamily: "Georgia, 'Palatino Linotype', Palatino, serif",
              maxWidth: 980,
            }}
          >
            <span>Churchill Falls — put the&nbsp;</span>
            <span style={{ color: "#e8893c" }}>next generations first</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: "rgba(242,244,246,0.72)",
              fontFamily:
                "-apple-system, BlinkMacSystemFont, Inter, 'Segoe UI', sans-serif",
            }}
          >
            Tom Lane → Premier Tony Wakeham
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid rgba(255,255,255,0.12)",
              paddingTop: 22,
              fontSize: 16,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(242,244,246,0.46)",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
          >
            <span>
              Open People <span style={{ color: "#e8893c" }}>· NL</span>
            </span>
            <span>openpeople.ai/letter</span>
          </div>
        </div>
      </div>
    ),
    size
  );
}
