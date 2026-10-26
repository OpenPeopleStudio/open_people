import { describe, expect, it } from "vitest";
import {
  COMPUTE_HERO,
  COMPUTE_PAGE_PLAIN,
  COMPUTE_RULES,
  CONTESTED_EXPORT,
  COST_ERA_NOTE,
  COST_MARKERS,
  DESK_SOURCES,
  DESK_VERIFIED,
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

  it("keeps 1.8 start and 7.4 50-year average labeled, not merged, with Annex D ¢ UNKNOWN", () => {
    expect(CONTESTED_EXPORT.start.value).toBe("1.8");
    expect(CONTESTED_EXPORT.start.label).toMatch(/starts about 1\.8¢\/kWh in 2027/i);
    expect(CONTESTED_EXPORT.start.unit).toMatch(/2027/);
    expect(CONTESTED_EXPORT.start.note.technical).toMatch(/1\.8¢\/kWh beginning in 2027/);
    expect(CONTESTED_EXPORT.start.note.technical).toMatch(/starting reported path/);
    expect(CONTESTED_EXPORT.start.note.technical).toMatch(/not the 7\.4¢ life average/);
    expect(CONTESTED_EXPORT.start.note.technical).toMatch(/CP24, 17 Aug 2026/);
    expect(CONTESTED_EXPORT.start.note.technical).not.toMatch(/payment÷TWh|\$0\.531B \/ 29\.207/);
    expect(CONTESTED_EXPORT.start.sources).toEqual(
      expect.arrayContaining(["cpChurchillGraph"])
    );

    expect(CONTESTED_EXPORT.average.value).toBe("7.4");
    expect(CONTESTED_EXPORT.average.label).toMatch(
      /averages about 7\.4¢\/kWh over ~50 years/i
    );
    expect(CONTESTED_EXPORT.average.unit).toMatch(/50 years/);
    expect(CONTESTED_EXPORT.average.note.technical).toMatch(
      /7\.4 cents per kilowatt hour over the next 50 years/i
    );
    expect(CONTESTED_EXPORT.average.note.technical).toMatch(/5\.9/);
    expect(CONTESTED_EXPORT.average.note.technical).toMatch(/prefers CP24/);
    expect(CONTESTED_EXPORT.average.note.technical).not.toMatch(/premium rate|2027 dollars/);
    expect(CONTESTED_EXPORT.average.sources).toEqual(["cpChurchillGraph"]);

    expect(CONTESTED_EXPORT.title).toMatch(/Starts about 1\.8¢\/kWh in 2027/);
    expect(CONTESTED_EXPORT.title).toMatch(/Averages about 7\.4¢\/kWh over ~50 years/);
    expect(CONTESTED_EXPORT.intro.plain).toMatch(/different measurements/i);
    expect(CONTESTED_EXPORT.intro.plain).toMatch(/not a contradiction/i);
    expect(CONTESTED_EXPORT.intro.plain.split(".").filter(Boolean)).toHaveLength(1);
    expect(CONTESTED_EXPORT.intro.technical).toMatch(/Do not reconcile them into one number/);
    expect(CONTESTED_EXPORT.intro.technical).toMatch(/Annex D \(17 Aug 2026\) is target \$ payments/);
    expect(CONTESTED_EXPORT.intro.technical).toMatch(/LAB-IND-1 stays a formula/);
    expect(CONTESTED_EXPORT.average.value).not.toBe(CONTESTED_EXPORT.start.value);

    expect(CONTESTED_EXPORT.bridge.value).toBe("UNKNOWN");
    expect(CONTESTED_EXPORT.bridge.status).toBe("unknown");
    expect(CONTESTED_EXPORT.bridge.note.technical).toMatch(/UNKNOWN/);
    expect(CONTESTED_EXPORT.bridge.note.technical).toMatch(/target \$ payments/);
    expect(CONTESTED_EXPORT.bridge.note.technical).toMatch(/Annex F/);
    expect(CONTESTED_EXPORT.bridge.note.technical).toMatch(/does not invent a payment÷TWh industrial ¢/);
    expect(CONTESTED_EXPORT.bridge.note.technical).toMatch(/Heritage 0\.2¢/);
    expect(CONTESTED_EXPORT.bridge.note.technical).toMatch(/labeled heritage/);
    expect(CONTESTED_EXPORT.bridge.note.technical).not.toMatch(
      /therefore 7\.4 =|bridge formula is|equals 7\.4 because/i
    );
  });

  it("does not present contested export ¢ as a locked industrial PPA for mines or compute", () => {
    const blob = [
      CONTESTED_EXPORT.average.note.technical,
      CONTESTED_EXPORT.start.note.technical,
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
    expect(SCALE_ANCHORS.computeOptional.plain).toMatch(/Open People leads/i);
    expect(SCALE_ANCHORS.computeOptional.plain).toMatch(/real constraints/i);
    const computeBlob = [
      COMPUTE_HERO.plain,
      COMPUTE_HERO.technical,
      COMPUTE_PAGE_PLAIN,
      ...COMPUTE_RULES.flatMap((rule) => [rule.body.plain, rule.body.technical]),
    ].join("\n");
    expect(computeBlob).toMatch(/Open People leads/i);
    expect(computeBlob).toMatch(/No partnership or agreement exists/);
    expect(computeBlob).toMatch(/Partnership, if any, is on terms each nation sets/);
    expect(computeBlob).not.toMatch(/Proposed partners/i);
    expect(computeBlob).not.toMatch(/consent first/i);
    expect(computeBlob).not.toMatch(/catalyst/i);
    expect(computeBlob).not.toMatch(/wrong page/i);
    expect(computeBlob).not.toMatch(/wrong organisation/i);
    expect(computeBlob).not.toMatch(/leftover-firm-power/i);
    expect(computeBlob).not.toMatch(/bankable offtake/i);
  });

  it("gives tracker rows a plain-English title that is not a Transparency prefix", () => {
    for (const item of TRACKER_ITEMS) {
      expect(item.title.trim().length).toBeGreaterThan(8);
      expect(item.title).not.toMatch(/^Transparency —/);
      expect(item.body.plain.trim().length).toBeGreaterThan(40);
    }
  });
});

describe("horizon desk facts — 22 Sep 2026 verification pass", () => {
  it("dates the IRC levelized MOU path 2025–2041, not 2024–2041", () => {
    const mou = COST_MARKERS.find((row) => row.id === "mou-irc-path");
    expect(mou?.note.technical).toMatch(/3\.8¢\/kWh over 2025–2041/);
    expect(mou?.note.technical).not.toMatch(/2024–2041/);
  });

  it("attributes 31 March 2027 to the DCIA Term clause and records Gull Island exclusivity", () => {
    const window = TRACKER_ITEMS.find((item) => item.id === "binding-window");
    expect(window?.body.technical).toMatch(/Article 2\.1/);
    expect(window?.body.technical).toMatch(/§6\.3\(a\)/);
    expect(window?.body.technical).toMatch(/exclusivity on Gull Island/);
    expect(window?.body.plain).toMatch(/exclusive/i);
  });

  it("carries the post-vote return-to-House gap and the Québec Innu file as open rows", () => {
    const back = TRACKER_ITEMS.find((item) => item.id === "house-return");
    expect(back?.status).toBe("open");
    expect(back?.body.technical).toMatch(/would not commit to a vote/);
    expect(back?.body.technical).toMatch(/UNKNOWN/);
    const qcInnu = TRACKER_ITEMS.find((item) => item.id === "qc-innu");
    expect(qcInnu?.status).toBe("open");
    expect(qcInnu?.sources).toContain("aptnQcInnu");
  });

  it("does not ship a source URL nobody has opened (SaltWire guess replaced by a loadable mirror)", () => {
    for (const source of Object.values(DESK_SOURCES)) {
      if (source.href) {
        expect(source.href).not.toMatch(/saltwire\.com/);
        expect(source.href).toMatch(/^https?:\/\//);
      } else {
        expect(source.label.length).toBeGreaterThan(10);
      }
      expect(source.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(DESK_SOURCES.cbcMining.date).toBe("2025-01-15");
    expect(DESK_SOURCES.cerNl.href).toMatch(/province-territory-energy-profiles\/newfoundland-labrador/);
    expect(DESK_SOURCES.saltwireParrott.href).toBeUndefined();
    expect(DESK_SOURCES.pubTechConf.href).toBeUndefined();
  });

  it("keeps every tracker source id resolvable", () => {
    for (const item of TRACKER_ITEMS) {
      for (const id of item.sources) expect(DESK_SOURCES[id]).toBeDefined();
    }
  });
});

describe("horizon desk facts — 14 Oct 2026 verification pass", () => {
  it("bumps the desk verified date to 2026-10-14", () => {
    expect(DESK_VERIFIED).toBe("2026-10-14");
    for (const item of TRACKER_ITEMS) {
      expect(item.lastVerified).toBe("2026-10-14");
    }
  });

  it("records Williams: material terms will not be reopened, and ~17–18 agreements still in draft", () => {
    const row = TRACKER_ITEMS.find((item) => item.id === "material-terms-lock");
    expect(row?.status).toBe("open");
    expect(row?.body.technical).toMatch(/will not renegotiate the material terms/i);
    expect(row?.body.technical).toMatch(/17 to 18/);
    expect(row?.sources).toContain("cbcWilliamsTerms");
  });

  it("treats 31 December as a soft target that can run to the 31 March 2027 Term", () => {
    const window = TRACKER_ITEMS.find((item) => item.id === "binding-window");
    expect(window?.body.plain).toMatch(/not the end of the world/i);
    expect(window?.body.technical).toMatch(/Saltwire\/Telegram, 9 Oct 2026/);
    expect(window?.body.technical).toMatch(/31 March 2027/);
    expect(window?.sources).toEqual(expect.arrayContaining(["dciaHq", "saltwireParrott"]));
  });

  it("records the PQ minority, the 13 Oct transition meeting, cabinet 21 Oct, and Assembly 17 Nov", () => {
    const qc = TRACKER_ITEMS.find((item) => item.id === "qc-gate");
    expect(qc?.title).toMatch(/PQ minority/i);
    expect(qc?.body.plain).toMatch(/5 October/);
    expect(qc?.body.plain).toMatch(/13 October/);
    expect(qc?.body.plain).toMatch(/21 October/);
    expect(qc?.body.plain).toMatch(/17 November/);
    expect(qc?.body.technical).toMatch(/no decision/i);
    expect(qc?.sources).toEqual(
      expect.arrayContaining(["qcElectionResult", "lactualiteTransition", "assnatReturn"]),
    );
  });

  it("records the cancelled PUB technical conference without inventing a URL", () => {
    const pub = TRACKER_ITEMS.find((item) => item.id === "pub-tech-conf");
    expect(pub?.status).toBe("open");
    expect(pub?.body.plain).toMatch(/cancelled/i);
    expect(pub?.sources).toContain("pubTechConf");
    expect(DESK_SOURCES.pubTechConf.href).toBeUndefined();
  });

  it("labels the Labrador West 1,500 MW as a ceiling, with FEED Dec 2026 and construction early 2028", () => {
    const line = TRACKER_ITEMS.find((item) => item.id === "labrador-west");
    expect(line?.body.plain).toMatch(/ceiling/i);
    expect(line?.body.technical).toMatch(/1,500 MW/);
    expect(line?.body.technical).toMatch(/December 2026/);
    expect(line?.body.technical).toMatch(/Q1 2028/);
    expect(line?.sources).toContain("nlhContractorOct");
  });

  it("sources NECEC in-service and hold-back, and CHPE commercial then outage", () => {
    const lines = TRACKER_ITEMS.find((item) => item.id === "necec-chpe");
    expect(lines?.body.technical).toMatch(/16 January 2026/);
    expect(lines?.body.technical).toMatch(/24–26 January/);
    expect(lines?.body.technical).toMatch(/May 2026/);
    expect(lines?.sources).toEqual(expect.arrayContaining(["eiaNecec", "eiaChpe"]));
  });

  it("keeps Gull Island unfiled with IAAC and the Innu file unresolved", () => {
    const gull = TRACKER_ITEMS.find((item) => item.id === "gull-island");
    expect(gull?.body.technical).toMatch(/still not filed/i);
    expect(gull?.body.plain).toMatch(/Innu dispute is unresolved/);
    const innu = TRACKER_ITEMS.find((item) => item.id === "innu");
    expect(innu?.status).toBe("open");
  });

  it("carries the 17 Aug package figures as announcement language, not a locked ¢", () => {
    const pack = COST_MARKERS.find((row) => row.id === "dcia-package");
    expect(pack?.note.technical).toMatch(/2,350 MW/);
    expect(pack?.note.technical).toMatch(/150 per cent/);
    expect(pack?.note.technical).toMatch(/985 MW/);
    expect(pack?.note.technical).toMatch(/\$49 billion/);
    expect(pack?.note.technical).toMatch(/\$3\.5 billion/);
    expect(pack?.note.technical).toMatch(/15%/);
    expect(pack?.note.technical).toMatch(/Not executed PPAs/);
    expect(pack?.sources).toEqual(expect.arrayContaining(["govNlDcia", "pmCarneyAug17"]));
  });

  it("sources the $8B wind capital cost and still does not name a developer", () => {
    const wind = TRACKER_ITEMS.find((item) => item.id === "wind-spe");
    expect(wind?.status).toBe("unknown");
    expect(wind?.body.technical).toMatch(/estimated capital cost \$8B/);
    expect(wind?.body.technical).toMatch(/developer: UNKNOWN/);
    expect(wind?.body.plain).toMatch(/not named/i);
    const marker = COST_MARKERS.find((row) => row.id === "wind-8b");
    expect(marker?.value).toBe("$8B");
    expect(marker?.sources).toContain("agreementSummary");
  });

  it("dates the 15% rebate after definitive agreements, with a possible April slip", () => {
    const rebate = COST_MARKERS.find((row) => row.id === "rebate-timing");
    expect(rebate?.note.technical).toMatch(/upon the finalization of the definitive agreements/);
    expect(rebate?.note.technical).toMatch(/April/);
    expect(rebate?.sources).toEqual(expect.arrayContaining(["govNlDcia", "vocmRebateOct"]));
  });

  it("carries HQ Rate CD as a two-part tariff, not a mashed 13¢", () => {
    const rate = COST_MARKERS.find((row) => row.id === "hq-rate-cd");
    expect(rate?.value).toBe("$32.704 + 8.710¢");
    expect(rate?.note.technical).toMatch(/\$32\.704\/kW-month/);
    expect(rate?.note.technical).toMatch(/8\.710¢\/kWh/);
    expect(rate?.note.technical).toMatch(/NL data-centre rate: UNKNOWN/);
    expect(rate?.sources).toContain("hqRateCd");
  });

  it("sources the 10% US energy duty pass-through and Goose Bay Labrador electricity contract", () => {
    const duty = COST_MARKERS.find((row) => row.id === "us-energy-duty");
    expect(duty?.value).toBe("10%");
    expect(duty?.sources).toContain("fercEnergyDuty");
    const goose = COST_MARKERS.find((row) => row.id === "goose-bay");
    expect(goose?.note.technical).toMatch(/\$187M/);
    expect(goose?.note.technical).toMatch(/MW requirement: UNKNOWN/);
    expect(goose?.sources).toContain("gooseBayDnd");
  });

  it("keeps domestic load, signed industrial ¢, and firm-MW unpublished", () => {
    expect(TRACKER_ITEMS.find((item) => item.id === "domestic-load")?.status).toBe("unknown");
    expect(COST_MARKERS.find((row) => row.id === "dcia-industrial-alloc")?.value).toBe("UNKNOWN");
    expect(COST_MARKERS.find((row) => row.id === "dcia-industrial-alloc")?.note.technical).toMatch(
      /firm-MW value/,
    );
  });

  it("records mines competing for the same megawatts, with Iron Bear and Kami sourced", () => {
    const mines = TRACKER_ITEMS.find((item) => item.id === "mine-queue");
    expect(mines?.status).toBe("open");
    expect(mines?.body.technical).toMatch(/nearly a third of all the expansions of Churchill Falls/);
    expect(mines?.body.technical).toMatch(/Nippon Steel and Sojitz/);
    expect(mines?.body.technical).toMatch(/UNKNOWN: a published queue/);
    expect(mines?.sources).toEqual(expect.arrayContaining(["cbcIronBear", "championKami"]));
  });
});
