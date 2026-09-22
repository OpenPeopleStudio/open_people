import { describe, expect, it } from "vitest";
import { COST_ERA_NOTE, COST_MARKERS, INDUSTRY_CARDS, TRACKER_ITEMS } from "@/lib/desk";
import { SCALE_ANCHORS } from "@/lib/voice-mode";

describe("horizon desk facts", () => {
  it("gives every tracker row sources, a last-verified date, and dual voice", () => {
    expect(TRACKER_ITEMS.length).toBeGreaterThanOrEqual(10);
    for (const item of TRACKER_ITEMS) {
      expect(item.sources.length).toBeGreaterThan(0);
      expect(item.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(item.body.plain.trim().length).toBeGreaterThan(40);
      expect(item.body.technical.trim().length).toBeGreaterThan(40);
    }
  });

  it("does not invent a Wind SPE name or CPP $8B company", () => {
    const wind = TRACKER_ITEMS.find((item) => item.id === "wind-spe");
    expect(wind?.status).toBe("unknown");
    expect(wind?.body.technical).toMatch(/UNKNOWN/);
    expect(wind?.body.technical).not.toMatch(/Pattern Energy|Invenergy|Brookfield Wind/i);
    expect(wind?.body.plain).toMatch(/not named|Do not invent/i);
  });

  it("labels metering, domestic load, and signed industrial cents UNKNOWN", () => {
    expect(TRACKER_ITEMS.find((item) => item.id === "metering")?.status).toBe("unknown");
    expect(TRACKER_ITEMS.find((item) => item.id === "domestic-load")?.status).toBe("unknown");
    const signed = COST_MARKERS.find((row) => row.id === "dcia-industrial-alloc");
    expect(signed?.value).toBe("UNKNOWN");
    expect(signed?.status).toBe("unknown");
  });

  it("leads industries with mining and keeps compute off the card list", () => {
    expect(INDUSTRY_CARDS[0]?.rank).toBe("first");
    expect(INDUSTRY_CARDS.every((card) => card.rank !== "secondary")).toBe(true);
    expect(INDUSTRY_CARDS.some((card) => /compute|data.?centre|AI campus/i.test(card.title))).toBe(
      false
    );
  });

  it("does not present the rejected MOU ¢ path as a locked PPA", () => {
    const mou = COST_MARKERS.find((row) => row.id === "mou-irc-path");
    expect(mou?.status).toBe("structure");
    expect(mou?.note.technical).toMatch(/Do not model the DCIA as this/);
    const reported = COST_MARKERS.find((row) => row.id === "reported-export-path");
    expect(reported?.status).toBe("reported");
  });

  it("cites Labrador Interconnected domestic 3.154¢ from NL Hydro, not as industrial", () => {
    const domestic = COST_MARKERS.find((row) => row.id === "lab-domestic");
    expect(domestic?.value).toBe("3.154");
    expect(domestic?.status).toBe("published-rate");
    expect(domestic?.note.technical).toMatch(/Rate No\. 1\.1L/);
    expect(domestic?.note.technical).toMatch(/electicity/);
    expect(domestic?.note.plain).toMatch(/domestic|household/i);
    expect(domestic?.sources).toEqual(expect.arrayContaining(["nlhCurrentRates", "nlhRates2026"]));
  });

  it("does not collapse LAB-IND-1 into a single ¢/kWh", () => {
    expect(COST_MARKERS.some((row) => row.id === "lab-ind-dev" || row.id === "lab-ind-mkt")).toBe(
      false
    );
    const lab = COST_MARKERS.find((row) => row.id === "lab-ind-1");
    expect(lab).toBeDefined();
    expect(lab?.value).not.toMatch(/^\d+(\.\d+)?$/);
    expect(lab?.unit).toMatch(/formula/i);
    expect(lab?.note.technical).toMatch(/RFIRM/);
    expect(lab?.note.technical).toMatch(/not a single ¢\/kWh/);
    expect(lab?.note.plain).toMatch(/Do not flatten/i);
    expect(lab?.sources).toContain("nlhRates2026");
  });

  it("labels Island Industrial as Island grid, not Labrador", () => {
    const island = COST_MARKERS.find((row) => row.id === "island-industrial");
    expect(island?.label).toMatch(/Island grid — not Labrador/);
    expect(island?.note.technical).toMatch(/Interconnected Island/);
    expect(island?.note.technical).toMatch(/not LAB-IND-1/);
  });

  it("keeps older Labrador Industrial PDF figures as schedule-era, not current", () => {
    expect(COST_ERA_NOTE.body.technical).toMatch(/2015/);
    expect(COST_ERA_NOTE.body.technical).toMatch(/Do not quote 2015 figures as current/);
    expect(COST_ERA_NOTE.sources).toContain("labIndHist");
  });

  it("pairs new desk metaphors with sourced technical twins", () => {
    expect(SCALE_ANCHORS.heritagePrice.source.length).toBeGreaterThan(0);
    expect(SCALE_ANCHORS.gulIslandRange.technical).toMatch(/2,250 MW or 2,700 MW/);
    expect(SCALE_ANCHORS.miningLoad.technical).toMatch(/312 MW/);
    expect(SCALE_ANCHORS.computeOptional.plain).toMatch(/not the front door/i);
  });
});
