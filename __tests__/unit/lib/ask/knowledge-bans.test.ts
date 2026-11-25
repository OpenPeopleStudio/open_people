import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Bans for the /ask knowledge file (content/ask/proposal-knowledge.md).
 * The /ask assistant answers only from this file, so a banned line here goes public.
 * Churchill Falls stays allowed: the file cites the Churchill Falls / Gull Island deal.
 * What is banned is naming a place as a candidate site.
 */
const text = readFileSync(resolve(process.cwd(), "content/ask/proposal-knowledge.md"), "utf8");
const lines = text.split("\n");

describe("ask knowledge bans", () => {
  it("does not mention ACOA or any ACOA application", () => {
    expect(text).not.toMatch(/\bACOA\b/i);
    expect(text).not.toMatch(/Atlantic Canada Opportunities Agency/i);
    expect(text).not.toMatch(/withdr[ae]w/i);
  });

  it("does not name Happy Valley-Goose Bay", () => {
    expect(text).not.toMatch(/Happy Valley[\s\u2010-\u2015-]*Goose Bay/i);
  });

  it("does not name Churchill Falls, or anywhere else, as a candidate site", () => {
    const candidateLines = lines.filter((line) => /\bcandidates?\b/i.test(line));
    for (const line of candidateLines) {
      expect(line).not.toMatch(/Churchill Falls|Goose Bay|Labrador West|Muskrat|Gull Island/i);
    }
    expect(text).not.toMatch(/Churchill Falls and Happy Valley/i);
  });

  it("says no site is chosen", () => {
    expect(text).toMatch(/Nothing is chosen/);
  });

  it("still cites the Churchill Falls deal (the ban is narrow)", () => {
    expect(text).toMatch(/Churchill Falls \/ Gull Island framework/);
  });

  it("does not use the feasibility-study framing", () => {
    expect(text).not.toMatch(/feasibility study|in feasibility|feasibility research/i);
  });

  it("does not mention OpenAI", () => {
    expect(text).not.toMatch(/OpenAI/i);
  });

  it("states a Phase 1 budget with no funder or cost-share", () => {
    expect(text).toMatch(/### Phase 1 budget, in general terms/);
    expect(text).toMatch(/Funding for Phase 1 is not secured/);
    expect(text).toMatch(/C\$642,768/);
    expect(text).toMatch(/C\$404,366 \(63%\)/);
    expect(text).not.toMatch(/75%/);
    expect(text).not.toMatch(/Open People's 25%/);
    expect(text).not.toMatch(/share requested/i);
    expect(text).not.toMatch(/The proposal calls it the study/);
  });

  it("uses Phase 1 wording instead of the study, except third-party uses", () => {
    const leftover = lines.filter((line) => {
      if (/Pembina Institute study/.test(line)) return false;
      if (/interconnection studies/.test(line)) return false;
      return /\bstud(?:y|ies)\b/i.test(line);
    });
    expect(leftover).toEqual([]);
  });
});
