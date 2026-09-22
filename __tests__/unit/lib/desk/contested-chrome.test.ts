import { describe, expect, it } from "vitest";
import {
  CONTESTED_RATE_SLOTS,
  findContestedMarker,
  resolveContestedSlots,
} from "@/components/marketing/desk/contested";
import { COST_MARKERS } from "@/lib/desk";

describe("contested rate chrome", () => {
  it("defines three equal-weight slots", () => {
    expect(CONTESTED_RATE_SLOTS.map((slot) => slot.id)).toEqual([
      "life-average",
      "start",
      "heritage",
    ]);
  });

  it("wires start and heritage from existing desk facts", () => {
    const start = findContestedMarker(CONTESTED_RATE_SLOTS[1]);
    const heritage = findContestedMarker(CONTESTED_RATE_SLOTS[2]);
    expect(start?.id).toBe("reported-export-path");
    expect(start?.value).toMatch(/1\.8/);
    expect(start?.status).toBe("reported");
    expect(heritage?.id).toBe("heritage-mills");
    expect(heritage?.value).toBe("0.2");
    expect(heritage?.unit).toBe("¢/kWh");
  });

  it("does not invent a life-average ¢ when no marker exists", () => {
    const life = findContestedMarker(CONTESTED_RATE_SLOTS[0]);
    if (!life) {
      expect(resolveContestedSlots().find((cell) => cell.slot.id === "life-average")?.marker).toBeNull();
      return;
    }
    expect(life.sources.length).toBeGreaterThan(0);
    expect(life.value).not.toBe("");
    expect(life.note.technical.length).toBeGreaterThan(20);
  });

  it("picks up a later life-average marker without changing chrome ids", () => {
    const injected = [
      ...COST_MARKERS,
      {
        id: "life-average",
        label: "Test life-average (injected)",
        value: "TEST",
        unit: "¢/kWh",
        status: "reported" as const,
        lastVerified: "2026-09-22",
        note: { plain: "Injected for chrome lookup.", technical: "Injected for chrome lookup." },
        sources: ["dciaHq" as const],
      },
    ];
    const hit = findContestedMarker(CONTESTED_RATE_SLOTS[0], injected);
    expect(hit?.id).toBe("life-average");
    expect(hit?.value).toBe("TEST");
  });
});
