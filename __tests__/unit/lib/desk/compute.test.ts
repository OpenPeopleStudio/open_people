import { describe, expect, it } from "vitest";
import { COMPUTE_HERO, COMPUTE_PAGE_PLAIN } from "@/lib/desk";
import { BOARD_ENTRIES } from "@/lib/board";

describe("compute page vs build seed", () => {
  it("keeps the campus-only sentence on the compute page plain string, not the build seed", () => {
    expect(COMPUTE_HERO.plain).not.toContain("This page is the campus");
    expect(COMPUTE_PAGE_PLAIN).toContain("This page is the campus, and only that.");
    expect(COMPUTE_PAGE_PLAIN).toContain(
      "The public work right now is keeping firm power in the province.",
    );
    expect(COMPUTE_PAGE_PLAIN.startsWith(COMPUTE_HERO.plain)).toBe(true);

    const seed = BOARD_ENTRIES.find((row) => row.id === "build-campus");
    expect(seed?.plain).toBe(COMPUTE_HERO.plain);
    expect(seed?.plain).not.toContain("This page is the campus");
  });
});
