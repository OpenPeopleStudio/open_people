import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  HOME_ASK_LABEL,
  HOME_CAMPUS_CANONICAL,
  HOME_CHURCHILL,
  HOME_CONSENT,
  HOME_DESCRIPTION,
  HOME_HEADLINE_CAMPUS,
  HOME_HEADLINE_COMPANY,
  HOME_ISED_CRITERIA,
  HOME_LEDE_CAMPUS,
  HOME_LEDE_COMPANY,
  HOME_OTTAWA_CALL,
  HOME_OTTAWA_HEADING,
  HOME_OTTAWA_STRATEGY,
  HOME_POWER_LINE,
  HOME_SEARCH_TITLE,
  HOME_TITLE,
  homePublicText,
} from "@/lib/marketing/home";
import { DESK_SOURCES } from "@/lib/desk";

const ROOT = process.cwd();
const text = homePublicText();
const page = readFileSync(resolve(ROOT, "app/(marketing)/page.tsx"), "utf8");
const nav = readFileSync(resolve(ROOT, "components/marketing/SiteNav.tsx"), "utf8");

describe("home front door", () => {
  it("leads with the AI company and treats the campus as the proposed project", () => {
    expect(HOME_HEADLINE_COMPANY).toBe("An AI company.");
    expect(HOME_HEADLINE_CAMPUS).toBe("A proposed Labrador AI campus.");
    expect(HOME_LEDE_COMPANY).toMatch(/AI company in Newfoundland and Labrador/);
    expect(HOME_LEDE_CAMPUS).toMatch(/company's project is a proposed 500 MW Labrador AI campus, in feasibility/);
    expect(HOME_TITLE).toBe("Open People — An AI company. A proposed Labrador AI campus.");
    expect(HOME_SEARCH_TITLE).toBe("Open People, an AI company in Newfoundland and Labrador");
    expect(HOME_SEARCH_TITLE).toMatch(/AI/);
    expect(page).toMatch(/HOME_HEADLINE_COMPANY/);
    expect(page).toMatch(/HOME_HEADLINE_CAMPUS/);
    expect(page).toMatch(/HOME_LEDE_COMPANY/);
    expect(page).toMatch(/HOME_LEDE_CAMPUS/);
    expect(page).toMatch(/HOME_SEARCH_TITLE/);
  });

  it("puts Ask the proposal on the first screen", () => {
    expect(HOME_ASK_LABEL).toBe("Ask the proposal");
    expect(page).toMatch(/leadAction/);
    expect(page).toMatch(/href="\/ask"/);
    expect(page).toMatch(/HOME_ASK_LABEL/);
    expect(page.indexOf("leadAction=")).toBeLessThan(page.indexOf("lede="));
  });

  it("keeps Churchill Falls out of the title and lede", () => {
    expect(`${HOME_SEARCH_TITLE} ${HOME_TITLE} ${HOME_DESCRIPTION}`).not.toMatch(/Churchill/i);
    expect(HOME_DESCRIPTION).toMatch(/AI company in Newfoundland and Labrador/);
    expect(HOME_DESCRIPTION).toMatch(/500 MW Labrador AI campus/);
    expect(HOME_DESCRIPTION).toMatch(/written request to NL Hydro/);
  });

  it("uses the canonical campus line, Phase 1 power line, and consent sentence", () => {
    expect(HOME_CAMPUS_CANONICAL).toBe(
      "Open People leads a proposed 500 MW Labrador AI campus on that power, in feasibility.",
    );
    expect(HOME_POWER_LINE).toMatch(/written request to NL Hydro/);
    expect(HOME_POWER_LINE).toMatch(/non-firm, interruptible pilot/);
    expect(HOME_POWER_LINE).toMatch(/No megawatts are reserved/);
    expect(HOME_CONSENT).toBe("Partnership, if any, will be on terms each nation sets.");
    expect(page).toMatch(/HOME_CAMPUS_CANONICAL/);
    expect(page).toMatch(/HOME_POWER_LINE/);
    expect(page).toMatch(/HOME_CONSENT/);
  });

  it("does not name Hydro or a nation as a proposed partner", () => {
    expect(text).not.toMatch(/proposed partner/i);
    expect(page).not.toMatch(/proposed partner/i);
    expect(text).not.toMatch(/stakeholders/i);
    expect(text).not.toMatch(/NunatuKavut/i);
    expect(text).not.toMatch(/No nation has been contacted/i);
    expect(text).not.toMatch(/Water Street/i);
    expect(text).not.toMatch(/\b281\b/);
    expect(text).not.toMatch(/Brendan/i);
    expect(text).not.toMatch(/Verafin/i);
    expect(text).not.toMatch(/sn[oō]w white/i);
  });

  it("keeps the two federal programmes separate and cites official pages", () => {
    expect(HOME_OTTAWA_HEADING).toBe("Ottawa is looking for projects like this");
    expect(text).not.toMatch(/already paying/i);
    expect(text).not.toMatch(/federal programs reward/i);
    expect(HOME_OTTAWA_CALL).toMatch(/greater than 100 MW/);
    expect(HOME_OTTAWA_CALL).toMatch(/15 January to 15 February 2026/);
    expect(HOME_OTTAWA_CALL).toMatch(/now closed/);
    expect(HOME_OTTAWA_CALL).toMatch(/non-binding memorandum of understanding/);
    expect(HOME_OTTAWA_STRATEGY).toMatch(/Canadian Sovereign AI Compute Strategy/);
    expect(HOME_OTTAWA_STRATEGY).toMatch(/\$2 billion/);
    expect(HOME_OTTAWA_STRATEGY).toMatch(/That is not the 100 MW call/);
    expect(HOME_ISED_CRITERIA).toBe(
      "ISED lists Indigenous participation as one of its criteria. Any role is for each nation to decide.",
    );
    expect(HOME_OTTAWA_CALL).not.toMatch(/Sovereign AI Compute Strategy/);
    expect(HOME_OTTAWA_STRATEGY).not.toMatch(/memorandum of understanding/);
    expect(DESK_SOURCES.isedDataCentreCall.href).toMatch(/enabling-large-scale-sovereign-ai-data-centres$/);
    expect(DESK_SOURCES.isedDataCentreIntake.href).toMatch(/intake-form/);
    expect(DESK_SOURCES.isedComputeStrategy.href).toMatch(/canadian-sovereign-ai-compute-strategy/);
    expect(page).toMatch(/HOME_OTTAWA_HEADING/);
    expect(page).toMatch(/isedDataCentreCall/);
    expect(page).toMatch(/isedComputeStrategy/);
  });

  it("puts Churchill Falls in a supporting section, not the opener", () => {
    expect(HOME_CHURCHILL).toMatch(/not a party to the Churchill Falls agreement/);
    expect(page).toMatch(/HOME_CHURCHILL/);
    expect(page).toMatch(/id="power"/);
    expect(page.indexOf("id=\"campus\"")).toBeLessThan(page.indexOf("id=\"power\""));
  });

  it("puts About in the primary nav beside the four tracks", () => {
    expect(nav).toMatch(/href: "\/about"/);
    expect(nav).toMatch(/href: "\/build"/);
    expect(nav).toMatch(/href: "\/capital"/);
    expect(nav).toMatch(/href: "\/consent"/);
    expect(nav).toMatch(/href: "\/power"/);
    expect(nav).not.toMatch(/\/brief/);
  });
});
