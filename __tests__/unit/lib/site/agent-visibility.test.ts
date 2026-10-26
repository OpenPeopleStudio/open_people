import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function source(path: string): string {
  return readFileSync(resolve(ROOT, path), "utf8");
}

describe("search and agent visibility", () => {
  it("names Churchill Falls on the home search title and keeps the data centre off that title", () => {
    const home = source("app/(marketing)/page.tsx");
    expect(home).toMatch(/Churchill Falls power — Open People/);
    expect(home).not.toMatch(/data centre|data center/i);
  });

  it("gives /compute the data centre search title without calling it built", () => {
    const compute = source("app/(marketing)/compute/page.tsx");
    expect(compute).toMatch(/title: "Churchill Falls data centre"/);
    expect(compute).toMatch(/proposed 500 MW Labrador data centre, in feasibility/);
    expect(compute).toMatch(/Mining comes first/);
    expect(compute).toMatch(/Not approved, not funded, and not under construction/);
  });

  it("publishes an llms.txt that points agents at the right page", () => {
    const llms = source("public/llms.txt");
    expect(llms).toMatch(/Churchill Falls/);
    expect(llms).toMatch(/data centre/);
    expect(llms).toMatch(/https:\/\/www\.openpeople\.ai\/compute/);
    expect(llms).toMatch(/Mining comes first/);
    expect(llms).toMatch(/not the opener/);
    expect(llms).not.toMatch(/super-admin|multi-tenant|SaaS/i);
  });

  it("lets agents crawl and lists the data centre page above a footnote", () => {
    const robots = source("app/robots.ts");
    expect(robots).toMatch(/GPTBot/);
    expect(robots).toMatch(/PerplexityBot/);
    expect(robots).toMatch(/ClaudeBot/);
    expect(robots).not.toMatch(/disallow/i);
    const sitemap = source("app/sitemap.ts");
    expect(sitemap).toMatch(/path: "\/compute", priority: 0\.85/);
    expect(sitemap).toMatch(/path: "\/", priority: 1/);
  });
});
