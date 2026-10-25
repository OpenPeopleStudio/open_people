import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { layoutGateLabels, staggerByX, wrapLabel } from "@/components/marketing/instruments/layout";

describe("wrapLabel", () => {
  it("keeps a short phrase on one line", () => {
    expect(wrapLabel("Heritage export", 22)).toEqual(["Heritage export"]);
  });

  it("breaks long instrument titles on word boundaries", () => {
    expect(wrapLabel("Québec data-centre rate (proposed)", 18)).toEqual([
      "Québec data-centre",
      "rate (proposed)",
    ]);
    expect(wrapLabel("Signed industrial ¢ for retained power", 20)).toEqual([
      "Signed industrial ¢",
      "for retained power",
    ]);
  });

  it("does not drop an over-long token", () => {
    expect(wrapLabel("NOT-PUBLISHED", 8)).toEqual(["NOT-PUBLISHED"]);
  });
});

describe("layoutGateLabels", () => {
  it("alternates sides and bumps a close neighbour to the outer tier", () => {
    const slots = layoutGateLabels([52, 160, 223, 280, 374, 528, 842], {
      minSep: 170,
      leftEdge: 122,
      rightEdge: 772,
    });
    expect(slots[0]).toMatchObject({ side: "above", tier: 0, anchor: "start" });
    expect(slots[1]).toMatchObject({ side: "below", tier: 0 });
    expect(slots[3]?.tier).toBe(1);
    expect(slots[6]).toMatchObject({ side: "above", anchor: "end" });
    const closeBelow = slots.filter((s, i) => s.side === "below" && s.tier === 0 && i < 4);
    expect(closeBelow.length).toBeGreaterThanOrEqual(1);
  });
});

describe("staggerByX", () => {
  it("puts 6¢ and 7.4¢ on opposite sides of the reported row", () => {
    // ¢ positions on a 676-wide 0–18 axis (LEFT=288, RIGHT=36).
    const cx = (c: number) => 288 + (c / 18) * 676;
    const sides = staggerByX([1.8, 6, 7.4, 11.5].map(cx), 70);
    expect(sides[1]).not.toBe(sides[2]);
  });
});

describe("dashed strokes keep their dash", () => {
  const root = join(__dirname, "../../../components/marketing/instruments");
  const files = [
    "PriceLadder.tsx",
    "CorridorSchematic.tsx",
    "DefaultPath.tsx",
    "GateClock.tsx",
    "FlowBars.tsx",
    "AnnexRamp.tsx",
  ];

  it("does not combine the draw-in class with strokeDasharray (that paints dashes solid)", () => {
    const hits: string[] = [];
    const re =
      /<[^>]*\bdraw\b[^>]*strokeDasharray[^>]*>|<[^>]*strokeDasharray[^>]*\bdraw\b[^>]*>/g;
    for (const file of files) {
      const src = readFileSync(join(root, file), "utf8");
      const found = src.match(re);
      if (found) hits.push(`${file}: ${found.join(" | ")}`);
    }
    expect(hits).toEqual([]);
  });
});
