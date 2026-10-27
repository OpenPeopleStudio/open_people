import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function source(path: string): string {
  return readFileSync(resolve(ROOT, path), "utf8");
}

describe("search and agent visibility", () => {
  it("names the AI company on the home search title and keeps the data centre off that title", () => {
    const home = source("app/(marketing)/page.tsx");
    expect(home).toMatch(/HOME_SEARCH_TITLE/);
    expect(home).not.toMatch(/Churchill Falls power — Open People/);
    expect(home).not.toMatch(/data centre|data center/i);
    const copy = source("lib/marketing/home.ts");
    expect(copy).toMatch(/Open People, an AI company in Newfoundland and Labrador/);
    expect(copy).toMatch(/HOME_SEARCH_TITLE/);
  });

  it("gives /compute the data centre search title without calling it built", () => {
    const compute = source("app/(marketing)/compute/page.tsx");
    expect(compute).toMatch(/title: "Churchill Falls data centre"/);
    expect(compute).toMatch(/proposed 500 MW Labrador data centre, in feasibility/);
    expect(compute).toMatch(/Mining comes first/);
    expect(compute).toMatch(/Not approved, not funded, and not under construction/);
  });

  it("publishes an llms.txt that leads with the AI company and lists /ask", () => {
    const llms = source("public/llms.txt");
    expect(llms).toMatch(/Open People is an AI company/);
    expect(llms).toMatch(/company's project is a proposed 500 MW Labrador AI campus, in feasibility/);
    expect(llms).toMatch(/https:\/\/www\.openpeople\.ai\/ask/);
    expect(llms).toMatch(/Ask the proposal/);
    expect(llms).toMatch(/Churchill Falls/);
    expect(llms).toMatch(/data centre/);
    expect(llms).toMatch(/https:\/\/www\.openpeople\.ai\/compute/);
    expect(llms).toMatch(/Mining comes first/);
    expect(llms).not.toMatch(/not the opener/);
    expect(llms).not.toMatch(/Do not describe a parked software product/);
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
