import { describe, expect, it } from "vitest";
import {
  VISION_CONTACT,
  VISION_DESCRIPTION,
  VISION_LEDE,
  VISION_SECTIONS,
  VISION_SENTENCES,
  VISION_TITLE,
  visionPublicText,
} from "@/lib/marketing/vision";

const text = visionPublicText();

describe("vision copy", () => {
  it("keeps Tom Lane’s four sentences verbatim as the close", () => {
    expect(VISION_SENTENCES.join(" ")).toBe(
      "People who care for this land should prosper from it. People working toward a shared goal should share in what it yields. Big goals raise hard questions; hard questions lead to discovery, and a better life for everyone who calls Earth home. Explorers bring us together.",
    );
  });

  it("states the public thesis, campus, research campus, and near-term feasibility", () => {
    expect(VISION_TITLE).toBe("Vision — Open People");
    expect(VISION_DESCRIPTION).toMatch(/Newfoundland and Labrador hydro/i);
    expect(VISION_DESCRIPTION).toMatch(/sovereign AI compute/i);
    expect(VISION_LEDE.plain).toMatch(/national grid/i);
    expect(VISION_LEDE.plain).toMatch(/federal sovereign-AI/i);
    expect(text).toMatch(/Open People leads/i);
    expect(text).toMatch(/Partnership, if any, will be on terms each nation sets/);
    expect(text).toMatch(/No nation has been asked about this project/);
    expect(text).toMatch(/500 MW/);
    expect(text).toMatch(/Labrador/);
    expect(text).toMatch(/proposed/i);
    expect(text).toMatch(/feasibility/i);
    expect(text).toMatch(/research campus/i);
    expect(text).toMatch(/residencies/i);
    expect(text).toMatch(/fellowships/i);
    expect(text).toMatch(/gatherings/i);
    expect(text).toMatch(/Perimeter Institute/);
    expect(text).toMatch(/Banff Centre/);
    expect(VISION_CONTACT).toBe("tom@openpeople.ai");
    expect(VISION_SECTIONS.map((s) => s.id)).toEqual(["thesis", "campus", "research", "near-term"]);
  });

  it("never claims the campus is approved, funded, or under construction", () => {
    expect(text).toMatch(/not approved/i);
    expect(text).toMatch(/not funded/i);
    expect(text).toMatch(/not under construction/i);
    expect(text).not.toMatch(/(is|are|was|were)\s+(approved|funded|under construction)/i);
  });

  it("omits funding asks, dollar figures, named customers, and forbidden names", () => {
    expect(text).not.toMatch(/ACOA/i);
    expect(text).not.toMatch(/\$/);
    expect(text).not.toMatch(/\bcapex\b/i);
    expect(text).not.toMatch(/SpaceX|xAI/i);
    expect(text).not.toMatch(/Brendan/i);
    expect(text).not.toMatch(/sn[oō]w white/i);
    expect(text).not.toMatch(/\bSWL\b/);
    expect(text).not.toMatch(/Water Street/i);
    expect(text).not.toMatch(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/);
    expect(text).not.toMatch(/\b281\b/);
  });
});
