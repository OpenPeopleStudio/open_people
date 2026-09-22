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
    expect(HOME_TITLE).toBe("Open People — Churchill River desk · Keep the power here");
    expect(HOME_DESCRIPTION).toBe(
      "A living desk on the Churchill Falls / Gull Island framework: what is signed, what is still blank, and the industry Labrador can build if firm power stays here. Mining first. Compute is a separate page.",
    );
    expect(HOME_DESCRIPTION).toMatch(/Mining first/);
    expect(HOME_DESCRIPTION).toMatch(/Compute is a separate page/);
    expect(HOME_TITLE.toLowerCase()).not.toMatch(/horizon desk|data.?centre|data.?center/);
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
    for (const card of Object.values(DESK_OG)) {
      const blob = `${card.kicker} ${card.kickerAccent} ${card.headline} ${card.accent} ${card.footer} ${card.alt}`;
      expect(blob).not.toMatch(/¢|\$\/MWh|\bMW\b|\bkWh\b/);
      expect(blob.toLowerCase()).not.toMatch(/horizon desk|hyperscale/);
    }
    expect(DESK_OG.home.headline).toBe("Keep the power here.");
    expect(DESK_OG.home.accent).toBe("Watch the gates.");
    expect(`${DESK_OG.home.kicker} · ${DESK_OG.home.kickerAccent}`.toUpperCase()).toBe(
      "OPEN PEOPLE · CHURCHILL RIVER DESK",
    );
    expect(DESK_OG.home.alt).toBe(
      "Open People — Churchill River desk. Keep the power here. Watch the gates.",
    );
    expect(deskOgKicker(DESK_OG.home)).toBe("OPEN PEOPLE · CHURCHILL RIVER DESK");
    expect(deskOgFooterUrl(DESK_OG.home)).toBe("OPENPEOPLE.AI");
    expect(DESK_OG.compute.headline).toBe("A compute plan,");
    expect(DESK_OG.compute.accent).toBe("not a campus landing.");
    expect(DESK_OG.compute.quiet).toBe(true);
  });

  it("uses an 8px plasma chassis and steel on quiet compute", () => {
    expect(OG_SIZE).toEqual({ width: 1200, height: 630 });
    expect(OG_RAIL).toBe(8);
    expect(OG_COLOR.void).toBe("#040404");
    expect(OG_COLOR.plasma).toBe("#e8893c");
    expect(ogAccent(false)).toBe(OG_COLOR.plasma);
    expect(ogAccent(true)).toBe(OG_COLOR.steel);

    const home = deskOgSvg(DESK_OG.home);
    expect(home).toContain(`width="${OG_RAIL}" height="${OG_SIZE.height}"`);
    expect(home).toContain(`width="${OG_SIZE.width}" height="${OG_RAIL}"`);
    expect(home).toContain("OPEN PEOPLE");
    expect(home).toContain("CHURCHILL RIVER DESK");
    expect(home).toContain("OPENPEOPLE.AI");
    expect(home).toContain(">NL<");

    const compute = deskOgSvg(DESK_OG.compute);
    expect(compute).toContain(OG_COLOR.steel);
    expect(compute).toContain("A compute plan,");
    expect(compute).toContain("not a campus landing.");
    expect(compute).not.toMatch(/¢/);
  });

  it("wraps long headlines on the sentence, not a stray last word", () => {
    expect(
      wrapHeadline(DESK_OG.home.headline, OG_LAYOUT.headlineSize, OG_LAYOUT.columnW),
    ).toEqual(["Keep the power here."]);
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
    expect(svg).toContain("#040404");
    expect(svg).toContain("#e8893c");
    expect(svg).toContain("Keep the power here.");
    expect(svg).toContain("Watch the gates.");
    expect(svg).toContain("OPEN PEOPLE");
    expect(svg).toContain("CHURCHILL RIVER DESK");
    expect(svg).not.toMatch(/¢/);
  });
});
