import { describe, expect, it } from "vitest";
import { FEASIBILITY_HERO, FEASIBILITY_SECTIONS } from "@/lib/desk";

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

describe("feasibility work record", () => {
  it("keeps Phase 1 non-firm and invents no rates", () => {
    const blob = [
      FEASIBILITY_HERO.plain,
      FEASIBILITY_HERO.technical,
      ...FEASIBILITY_SECTIONS.flatMap((section) => [section.body.plain, section.body.technical]),
    ].join("\n");

    expect(blob).toMatch(/feasibility/i);
    expect(blob).toMatch(/written request to NL Hydro/i);
    expect(blob).toMatch(/non-firm, interruptible pilot/i);
    expect(blob).toMatch(/No megawatts are reserved/i);
    expect(blob).toMatch(/not approved/i);
    expect(blob).toMatch(/not funded/i);
    expect(blob).toMatch(/not under construction/i);
    for (const pattern of BANNED) {
      expect(blob).not.toMatch(pattern);
    }
  });

  it("covers means, phase-1, unpublished, and records sections", () => {
    expect(FEASIBILITY_SECTIONS.map((section) => section.id)).toEqual([
      "means",
      "phase-1",
      "unpublished",
      "records",
    ]);
  });
});
