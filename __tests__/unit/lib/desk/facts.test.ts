import { describe, expect, it } from "vitest";
import {
  CONTESTED_EXPORT,
  COST_ERA_NOTE,
  COST_MARKERS,
  INDUSTRY_CARDS,
  TRACKER_ITEMS,
} from "@/lib/desk";
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

  it("records the Innu Nation urged-no-vote and open partnership, including the Premier-contact gap", () => {
    const innu = TRACKER_ITEMS.find((item) => item.id === "innu");
    expect(innu?.status).toBe("open");
    expect(innu?.body.technical).toMatch(/urging a no vote/i);
    expect(innu?.body.plain).toMatch(/urged MHAs not to vote/i);
    expect(innu?.body.plain).toMatch(/Partnership remains open/i);
    expect(innu?.body.technical).toMatch(/Partnership remains open/i);
    expect(innu?.body.technical).toMatch(/yet to contact/i);
    expect(innu?.sources).toEqual(
      expect.arrayContaining(["vocmInnu", "vocmInnuContact", "saltwireInnu"])
    );
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

  it("keeps 1.8 start and 7.4 50-year average labeled, not merged, with an unpublished Annex D bridge", () => {
    expect(CONTESTED_EXPORT.annexPath.value).toBe("1.8");
    expect(CONTESTED_EXPORT.annexPath.label).toMatch(/Starting reported price/i);
    expect(CONTESTED_EXPORT.annexPath.unit).toMatch(/2027/);
    expect(CONTESTED_EXPORT.annexPath.note.technical).toMatch(/1\.8¢\/kWh beginning in 2027/);
    expect(CONTESTED_EXPORT.annexPath.note.technical).toMatch(/\$0\.531B/);
    expect(CONTESTED_EXPORT.annexPath.note.technical).toMatch(/29\.207 TWh/);
    expect(CONTESTED_EXPORT.annexPath.note.technical).toMatch(/11\.5¢\/kWh by 2041/);
    expect(CONTESTED_EXPORT.annexPath.note.technical).toMatch(
      /Do not treat 11\.5 as the raw 2041 Annex D division/
    );
    expect(CONTESTED_EXPORT.annexPath.sources).toEqual(
      expect.arrayContaining(["dciaHq", "cpChurchillGraph", "financialPostPath"])
    );

    expect(CONTESTED_EXPORT.campaign.value).toBe("7.4");
    expect(CONTESTED_EXPORT.campaign.label).toMatch(/Average effective price/i);
    expect(CONTESTED_EXPORT.campaign.unit).toMatch(/50 years/);
    expect(CONTESTED_EXPORT.campaign.note.technical).toMatch(/7\.4 cents per kilowatt hour over the next 50 years/i);
    expect(CONTESTED_EXPORT.campaign.note.technical).toMatch(/2027 dollars/);
    expect(CONTESTED_EXPORT.campaign.note.technical).toMatch(/premium rate/);
    expect(CONTESTED_EXPORT.campaign.note.technical).toMatch(/not a locked industrial PPA/);
    expect(CONTESTED_EXPORT.campaign.sources).toEqual(
      expect.arrayContaining(["abetterDealFaq", "cpChurchillGraph"])
    );

    expect(CONTESTED_EXPORT.title).toMatch(/1\.8/);
    expect(CONTESTED_EXPORT.title).toMatch(/7\.4/);
    expect(CONTESTED_EXPORT.intro.plain).toMatch(/different measurements/i);
    expect(CONTESTED_EXPORT.intro.plain).toMatch(/mash into one number/i);
    expect(CONTESTED_EXPORT.campaign.value).not.toBe(CONTESTED_EXPORT.annexPath.value);

    expect(CONTESTED_EXPORT.bridge.value).toBe("UNKNOWN");
    expect(CONTESTED_EXPORT.bridge.status).toBe("unknown");
    expect(CONTESTED_EXPORT.bridge.note.technical).toMatch(/UNKNOWN/);
    expect(CONTESTED_EXPORT.bridge.note.technical).toMatch(/does not invent a bridge formula/i);
    expect(CONTESTED_EXPORT.bridge.note.technical).not.toMatch(
      /therefore 7\.4 =|bridge formula is|equals 7\.4 because/i
    );
  });

  it("does not present contested export ¢ as a locked industrial PPA for mines or compute", () => {
    const blob = [
      CONTESTED_EXPORT.campaign.note.technical,
      CONTESTED_EXPORT.annexPath.note.technical,
      CONTESTED_EXPORT.bridge.note.technical,
      CONTESTED_EXPORT.intro.technical,
    ].join("\n");
    expect(blob).toMatch(/Labrador mines or compute/);
    expect(blob).not.toMatch(/Pattern Energy|Invenergy/i);
    expect(blob).not.toMatch(/\b\d{2,4}\s*MW reserved\b/i);
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

  it("labels heritage 0.2¢ as heritage lore, not a current industrial ¢", () => {
    const heritage = COST_MARKERS.find((row) => row.id === "heritage-mills");
    expect(heritage?.value).toBe("0.2");
    expect(heritage?.status).toBe("heritage");
    expect(heritage?.note.technical).toMatch(/two mills/);
    expect(heritage?.note.plain).toMatch(/not a rate anyone in this province can buy/i);
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
