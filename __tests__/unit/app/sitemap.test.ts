import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";

function pathOf(url: string): string {
  return new URL(url).pathname;
}

describe("sitemap ranks", () => {
  it("keeps the same routes and ranks tracks above records", () => {
    const entries = sitemap();
    const byPath = Object.fromEntries(entries.map((row) => [pathOf(row.url), row.priority]));

    expect(Object.keys(byPath).sort()).toEqual(
      [
        "/",
        "/about",
        "/ask",
        "/brief",
        "/build",
        "/capital",
        "/compute",
        "/consent",
        "/contact",
        "/costs",
        "/engage",
        "/industries",
        "/letter",
        "/power",
        "/privacy",
        "/terms",
        "/tracker",
      ].sort(),
    );

    for (const path of ["/build", "/capital", "/consent", "/power"]) {
      expect(byPath[path]).toBe(0.9);
    }
    for (const path of ["/brief", "/tracker", "/engage", "/industries", "/costs", "/letter"]) {
      expect(byPath[path]).toBe(0.8);
    }
    expect(byPath["/compute"]).toBe(0.4);
    expect(byPath["/about"]).toBe(0.8);
  });
});
