import { describe, expect, it } from "vitest";
import { CAPITAL_HERO, CAPITAL_SECTIONS } from "@/lib/desk";

const BANNED = [
  /ACOA/i,
  /\$/,
  /SpaceX|xAI/i,
  /Brendan/i,
  /sn[oō]w white/i,
  /\bSWL\b/,
  /Water Street/i,
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  /\b281\b/,
  /catalyst/i,
];

describe("capital funding stance", () => {
  it("keeps capital unnamed and unsigned", () => {
    const blob = [
      CAPITAL_HERO.plain,
      CAPITAL_HERO.technical,
      ...CAPITAL_SECTIONS.flatMap((section) => [section.body.plain, section.body.technical]),
    ].join("\n");

    expect(blob).toMatch(/Capital is a proposed partner/i);
    expect(blob).toMatch(/unnamed/i);
    expect(blob).toMatch(/Nothing is signed|no signed/i);
    expect(blob).toMatch(/No named funder|not a named funder/i);
    for (const pattern of BANNED) {
      expect(blob).not.toMatch(pattern);
    }
  });

  it("covers public, unpublished, and enter sections", () => {
    expect(CAPITAL_SECTIONS.map((section) => section.id)).toEqual([
      "public",
      "unpublished",
      "enter",
    ]);
  });
});
