import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  DESK_OG,
  HOME_DESCRIPTION,
  HOME_TITLE,
  deskOgFooterUrl,
  deskOgKicker,
} from "@/lib/og/copy";
import { OG_COLOR, OG_LAYOUT, OG_RAIL, OG_SIZE, ogAccent, wrapHeadline } from "@/lib/og/layout";
import { deskMetadata } from "@/lib/og/metadata";
import { deskOgSvg } from "@/lib/og/svg";
import { CANONICAL_ORIGIN, siteOrigin } from "@/lib/site";

const PUBLIC = resolve(process.cwd(), "public");

describe("desk Open Graph", () => {
  it("uses www as the canonical host so crawlers do not follow the apex 307", () => {
    const previous = process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(siteOrigin()).toBe(CANONICAL_ORIGIN);
    process.env.NEXT_PUBLIC_SITE_URL = "https://openpeople.ai";
    expect(siteOrigin()).toBe("https://www.openpeople.ai");
    process.env.NEXT_PUBLIC_SITE_URL = "https://www.openpeople.ai";
    expect(siteOrigin()).toBe("https://www.openpeople.ai");
    if (previous === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = previous;
    }
  });

  it("keeps the live home title and description", () => {
    expect(HOME_TITLE).toBe("Open People — An AI company. A proposed Labrador AI campus.");
    expect(HOME_DESCRIPTION).toMatch(/Newfoundland and Labrador company/);
    expect(HOME_DESCRIPTION).toMatch(/500 MW Labrador AI campus/);
    expect(HOME_DESCRIPTION).toMatch(/written request to NL Hydro/);
    expect(HOME_DESCRIPTION).toMatch(/No megawatts are reserved/);
    expect(HOME_TITLE.toLowerCase()).not.toMatch(/horizon desk|data.?centre|data.?center|churchill/);
  });

  it("sets matching og and twitter titles so child routes do not inherit root OG copy", () => {
    const tracker = deskMetadata({
      title: "Tracker",
      description: "What’s signed and still open.",
      path: "/tracker",
    });
    expect(tracker.openGraph?.title).toBe("Tracker · Open People");
    expect(tracker.twitter?.title).toBe("Tracker · Open People");
    expect(tracker.openGraph?.url).toBe("/tracker");
    expect(
      tracker.twitter && "card" in tracker.twitter ? tracker.twitter.card : undefined,
    ).toBe("summary_large_image");
    expect(tracker.openGraph?.images).toEqual([
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: DESK_OG.home.alt,
      },
    ]);
    expect(
      tracker.twitter && "images" in tracker.twitter ? tracker.twitter.images : undefined,
    ).toEqual(["/og-image.png"]);

    const home = deskMetadata({
      title: { absolute: HOME_TITLE },
      description: HOME_DESCRIPTION,
      path: "/",
    });
    expect(home.openGraph?.title).toBe(HOME_TITLE);
    expect(home.twitter?.title).toBe(HOME_TITLE);
    expect(home.openGraph?.images).toBeDefined();
  });

  it("does not invent deal numbers on the share card", () => {
    for (const [key, card] of Object.entries(DESK_OG)) {
      const blob = `${card.kicker} ${card.kickerAccent} ${card.headline} ${card.accent} ${card.footer} ${card.alt}`;
      expect(blob).not.toMatch(/¢|\$\/MWh|\bkWh\b/);
      if (key !== "compute") {
        expect(blob).not.toMatch(/\bMW\b/);
      }
      expect(blob.toLowerCase()).not.toMatch(/horizon desk|hyperscale/);
    }
    expect(DESK_OG.home.headline).toBe("An AI company. A proposed Labrador AI campus.");
    expect(DESK_OG.home.accent).toBe("Proposed. In feasibility.");
    expect(`${DESK_OG.home.kicker} · ${DESK_OG.home.kickerAccent}`.toUpperCase()).toBe(
      "OPEN PEOPLE · COMPANY AND CAMPUS",
    );
    expect(DESK_OG.home.alt).toBe(
      "Open People — an AI company, and a proposed Labrador AI campus, in feasibility.",
    );
    expect(deskOgKicker(DESK_OG.home)).toBe("OPEN PEOPLE · COMPANY AND CAMPUS");
    expect(DESK_OG.build.headline).toBe("The campus and the research campus.");
    expect(DESK_OG.capital.headline).toBe("The money for the project.");
    expect(DESK_OG.consent.headline).toBe("Indigenous partnership.");
    expect(DESK_OG.power.headline).toBe("Power for the campus.");
    expect(deskOgFooterUrl(DESK_OG.home)).toBe("OPENPEOPLE.AI");
    expect(DESK_OG.compute.headline).toBe("A 500 MW Labrador campus.");
    expect(DESK_OG.compute.accent).toBe("Open People leads.");
    expect(DESK_OG.compute.quiet).toBe(true);
    expect(DESK_OG.funding.headline).toBe("Capital is a proposed partner.");
    expect(DESK_OG.funding.quiet).toBe(true);
    expect(DESK_OG.partnership.headline).toBe("Indigenous partnership comes first.");
    expect(DESK_OG.partnership.quiet).toBe(true);
    expect(DESK_OG.feasibility.headline).toBe("Feasibility on costs and impact.");
    expect(DESK_OG.feasibility.quiet).toBe(true);
    expect(DESK_OG.coalition.accent).toBe("Open People leads. Mining first.");
    expect(DESK_OG.coalition.alt).not.toMatch(/catalyst/i);
    expect(DESK_OG.ask.headline).toBe("Ask the proposal.");
    expect(DESK_OG.ask.accent).toBe("Honest, labelled answers.");
  });

  it("uses an 8px plasma chassis and steel on quiet compute", () => {
    expect(OG_SIZE).toEqual({ width: 1200, height: 630 });
    expect(OG_RAIL).toBe(8);
    expect(OG_COLOR.void).toBe("#000000");
    expect(OG_COLOR.plasma).toBe("#f2501f");
    expect(ogAccent(false)).toBe(OG_COLOR.plasma);
    expect(ogAccent(true)).toBe(OG_COLOR.steel);

    const home = deskOgSvg(DESK_OG.home);
    expect(home).toContain(`width="${OG_RAIL}" height="${OG_SIZE.height}"`);
    expect(home).toContain(`width="${OG_SIZE.width}" height="${OG_RAIL}"`);
    expect(home).toContain("OPEN PEOPLE");
    expect(home).toContain("COMPANY AND CAMPUS");
    expect(home).toContain("OPENPEOPLE.AI");
    expect(home).toContain(">NL<");

    const compute = deskOgSvg(DESK_OG.compute);
    expect(compute).toContain(OG_COLOR.steel);
    expect(compute).toContain("A 500 MW Labrador");
    expect(compute).toContain("campus.");
    expect(compute).toContain("Open People leads.");
    expect(compute).not.toMatch(/¢/);
  });

  it("wraps long headlines on the sentence, not a stray last word", () => {
    expect(
      wrapHeadline(DESK_OG.home.headline, OG_LAYOUT.headlineSize, OG_LAYOUT.columnW),
    ).toEqual(["An AI company.", "A proposed Labrador AI campus."]);
    expect(
      wrapHeadline(DESK_OG.tracker.headline, OG_LAYOUT.headlineSize, OG_LAYOUT.columnW),
    ).toEqual(["What’s signed.", "What’s open."]);
  });

  it("commits a real 1200×630 PNG (not a 0-byte placeholder)", async () => {
    for (const name of ["og-image.png", "twitter-image.png"] as const) {
      const path = resolve(PUBLIC, name);
      const stat = statSync(path);
      expect(stat.size, `${name} must not be empty`).toBeGreaterThan(8_000);
      const png = readFileSync(path);
      expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
      const meta = await sharp(png).metadata();
      expect(meta.width).toBe(1200);
      expect(meta.height).toBe(630);
      expect(meta.format).toBe("png");
    }
  });

  it("keeps the SVG source in lockstep with home card copy", () => {
    const svg = deskOgSvg(DESK_OG.home);
    expect(svg).toContain('width="1200"');
    expect(svg).toContain('height="630"');
    expect(svg).toContain("#000000");
    expect(svg).toContain("#f2501f");
    expect(svg).toContain("An AI company.");
    expect(svg).toContain("A proposed Labrador AI campus.");
    expect(svg).toContain("Proposed. In feasibility.");
    expect(svg).toContain("OPEN PEOPLE");
    expect(svg).toContain("COMPANY AND CAMPUS");
    expect(svg).not.toMatch(/¢/);
  });
});
