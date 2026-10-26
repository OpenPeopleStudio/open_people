import { describe, expect, it } from "vitest";
import { CONSENT_HERO, CONSENT_SECTIONS } from "@/lib/desk";

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

describe("consent partnership stance", () => {
  it("claims consent first and invents no agreement", () => {
    const blob = [
      CONSENT_HERO.plain,
      CONSENT_HERO.technical,
      ...CONSENT_SECTIONS.flatMap((section) => [section.body.plain, section.body.technical]),
    ].join("\n");

    expect(blob).toMatch(/Indigenous partnership comes first/i);
    expect(blob).toMatch(/No agreement is claimed|No partnership or agreement exists/i);
    expect(blob).toMatch(/No nation has been asked/i);
    expect(blob).toMatch(/terms each nation sets/i);
    expect(blob).toMatch(/ISED lists Indigenous participation/i);
    for (const pattern of BANNED) {
      expect(blob).not.toMatch(pattern);
    }
  });

  it("covers claimed, not-claimed, ised, and enter sections", () => {
    expect(CONSENT_SECTIONS.map((section) => section.id)).toEqual([
      "claimed",
      "not-claimed",
      "ised",
      "enter",
    ]);
  });
});
