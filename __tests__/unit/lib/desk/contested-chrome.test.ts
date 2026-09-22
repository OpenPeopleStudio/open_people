import { describe, expect, it } from "vitest";
import { CONTESTED_RATE_SLOTS, resolveContestedSlots } from "@/components/marketing/desk/contested";
import { CONTESTED_EXPORT } from "@/lib/desk";

describe("contested rate chrome", () => {
  it("defines two equal-weight columns: start vs life-average", () => {
    expect(CONTESTED_RATE_SLOTS.map((slot) => slot.id)).toEqual(["start", "life-average"]);
    expect(CONTESTED_RATE_SLOTS).toHaveLength(2);
  });

  it("leads each column with a one-breath human kicker, then a sourced ¢", () => {
    const cells = resolveContestedSlots();
    expect(cells[0]?.slot.kicker).toBe("Starts ~1.8¢ in 2027");
    expect(cells[0]?.marker.id).toBe("start-18");
    expect(cells[0]?.marker.value).toBe("1.8");
    expect(cells[0]?.marker.unit).toMatch(/2027/);
    expect(cells[1]?.slot.kicker).toBe("Averages ~7.4¢ over the life");
    expect(cells[1]?.marker.id).toBe("average-74");
    expect(cells[1]?.marker.value).toBe("7.4");
    expect(cells[1]?.marker.unit).toMatch(/50 years/);
    expect(cells[0]?.marker.value).not.toBe(cells[1]?.marker.value);
  });

  it("labels the pair as different measurements, not one industrial ¢", () => {
    expect(CONTESTED_EXPORT.intro.plain).toMatch(/different measurements/i);
    expect(CONTESTED_EXPORT.intro.technical).toMatch(/Annex D/);
    expect(CONTESTED_EXPORT.intro.technical).toMatch(/UNKNOWN/);
  });

  it("keeps Annex D $ structure, CPI, and the unpublished bridge in the technical layer", () => {
    expect(CONTESTED_EXPORT.bridge.note.technical).toMatch(/\$0\.531B/);
    expect(CONTESTED_EXPORT.bridge.note.technical).toMatch(/29\.207 TWh/);
    expect(CONTESTED_EXPORT.bridge.note.technical).toMatch(/Annex F/);
    expect(CONTESTED_EXPORT.bridge.value).toBe("UNKNOWN");
    expect(CONTESTED_EXPORT.bridge.note.technical).toMatch(/does not invent a payment÷TWh industrial ¢/);
    expect(CONTESTED_EXPORT.bridge.note.technical).not.toMatch(
      /therefore 7\.4 =|bridge formula is|equals 7\.4 because/i,
    );
  });

  it("does not put heritage 0.2¢ in the two contested columns", () => {
    const values = resolveContestedSlots().map((cell) => cell.marker.value);
    expect(values).not.toContain("0.2");
    expect(CONTESTED_RATE_SLOTS.map((slot) => slot.id)).not.toContain("heritage");
  });
});
