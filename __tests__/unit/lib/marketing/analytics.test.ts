import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

describe("Vercel Web Analytics", () => {
  it("mounts Analytics once in the root layout from @vercel/analytics/next", () => {
    const layout = read("app/layout.tsx");
    const marketing = read("app/(marketing)/layout.tsx");
    expect(layout).toMatch(/from ["']@vercel\/analytics\/next["']/);
    expect(layout).toMatch(/<Analytics\s*\/>/);
    expect(layout.match(/<Analytics/g)?.length).toBe(1);
    expect(layout).not.toMatch(/speed-insights/i);
    expect(layout).not.toMatch(/SpeedInsights/);
    expect(marketing).not.toMatch(/@vercel\/analytics/);
    expect(marketing).not.toMatch(/SpeedInsights/);
  });

  it("does not add Speed Insights anywhere on the public site", () => {
    const files = [
      "app/layout.tsx",
      "app/(marketing)/layout.tsx",
      "components/marketing/ask/AskDesk.tsx",
      "app/(marketing)/contact/ContactForm.tsx",
      "app/(marketing)/contact/page.tsx",
      "app/(marketing)/privacy/page.tsx",
      "package.json",
    ];
    for (const file of files) {
      const text = read(file);
      expect(text, file).not.toMatch(/@vercel\/speed-insights/);
      expect(text, file).not.toMatch(/SpeedInsights/);
    }
    expect(JSON.parse(read("package.json")).dependencies["@vercel/analytics"]).toBeTruthy();
    expect(JSON.parse(read("package.json")).dependencies["@vercel/speed-insights"]).toBeUndefined();
  });

  it("tracks /ask submits by event name only", () => {
    const ask = read("components/marketing/ask/AskDesk.tsx");
    expect(ask).toMatch(/from ["']@vercel\/analytics["']/);
    expect(ask).toMatch(/track\(["']Ask question submitted["']\)/);
    expect(ask).toMatch(/track\(["']Ask follow-up submitted["']\)/);
    expect(ask.match(/track\(/g)?.length).toBe(2);
    expect(ask).not.toMatch(/track\([^)]+,\s*\{/);
    expect(ask).not.toMatch(/no analytics trackers/);
    expect(ask).toMatch(/event name only, not the question text/);
  });

  it("tracks contact submits by event name only", () => {
    const form = read("app/(marketing)/contact/ContactForm.tsx");
    const page = read("app/(marketing)/contact/page.tsx");
    expect(form).toMatch(/track\(["']Contact form submitted["']\)/);
    expect(form).not.toMatch(/track\([^)]+,\s*\{/);
    expect(page).toMatch(/ContactMailLink/);
  });

  it("states Vercel Web Analytics on /privacy in short cookieless terms", () => {
    const privacy = read("app/(marketing)/privacy/page.tsx");
    expect(privacy).toMatch(/October 26, 2026/);
    expect(privacy).toMatch(/This site uses Vercel Web Analytics/);
    expect(privacy).toMatch(/It is cookieless/);
    expect(privacy).toMatch(/aggregate page views/);
    expect(privacy).toMatch(/referrers, country, and device/);
    expect(privacy).toMatch(/does not collect personal identity/);
    expect(privacy).not.toMatch(/We may use cookies or similar technologies/);
    expect(privacy.toLowerCase()).not.toMatch(/fully anonymous/);
    expect(privacy.toLowerCase()).not.toMatch(/never collect any data/);
  });

  it("keeps the installed analytics package on disk", () => {
    expect(existsSync(resolve(ROOT, "node_modules/@vercel/analytics/package.json"))).toBe(true);
  });
});
