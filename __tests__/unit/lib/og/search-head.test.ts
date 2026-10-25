import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { BRIEF_DESCRIPTION, BRIEF_TITLE } from "@/lib/og/copy";
import { deskMetadata } from "@/lib/og/metadata";
import {
  SITE_ALTERNATE_NAME,
  SITE_LOGO_PATH,
  SITE_LOGO_SIZE,
  SITE_NAME,
  siteJsonLd,
  siteJsonLdScript,
} from "@/lib/og/jsonld";
import { CANONICAL_ORIGIN } from "@/lib/site";

const ROOT = process.cwd();
const NATION = /Canada|Canadian|United States|America|Améric|Québec|Quebec/i;

describe("/brief search metadata", () => {
  it("uses the locked title and a description that does not name a nation or 5,428 MW", () => {
    expect(BRIEF_TITLE).toBe("Keep the power here: the Labrador case");
    expect(BRIEF_DESCRIPTION).toBe(
      "Labrador runs on clean hydro. Open People's proposed campus starts small, in feasibility, with NL Hydro as a proposed partner, not a reserved block.",
    );
    expect(BRIEF_TITLE).not.toMatch(NATION);
    expect(BRIEF_DESCRIPTION).not.toMatch(NATION);
    expect(`${BRIEF_TITLE} ${BRIEF_DESCRIPTION}`).not.toMatch(/5,?428/);
    expect(BRIEF_DESCRIPTION).not.toMatch(/written request|non-firm pilot/i);
  });

  it("keeps document, og, and twitter title and description in lockstep", () => {
    const meta = deskMetadata({
      title: BRIEF_TITLE,
      description: BRIEF_DESCRIPTION,
      path: "/brief",
      type: "article",
    });
    expect(meta.title).toBe(BRIEF_TITLE);
    expect(meta.description).toBe(BRIEF_DESCRIPTION);
    expect(meta.openGraph?.title).toBe(`${BRIEF_TITLE} · Open People`);
    expect(meta.twitter?.title).toBe(`${BRIEF_TITLE} · Open People`);
    expect(meta.openGraph?.description).toBe(BRIEF_DESCRIPTION);
    expect(
      meta.twitter && "description" in meta.twitter ? meta.twitter.description : undefined,
    ).toBe(BRIEF_DESCRIPTION);
  });

  it("only claims facts that appear on the /brief page body", () => {
    const brief = readFileSync(resolve(ROOT, "app/(marketing)/brief/page.tsx"), "utf8");
    expect(brief).toMatch(/BRIEF_TITLE/);
    expect(brief).toMatch(/BRIEF_DESCRIPTION/);
    expect(brief).not.toMatch(/ogDescription/);
    expect(brief).toMatch(/hydro-dominated/);
    expect(brief).toMatch(/cleanest large power systems/);
    expect(brief).toMatch(/firm green power/);
    expect(brief).toMatch(/in feasibility/);
    expect(brief).toMatch(/deliberately small/);
    expect(brief).toMatch(/NL Hydro, as a proposed partner/);
    expect(brief).toMatch(/not a reserved block/);
  });
});

describe("site-wide JSON-LD", () => {
  it("emits one WebSite + Organization graph on the canonical www origin", () => {
    const data = siteJsonLd();
    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@graph"]).toHaveLength(2);
    const [website, org] = data["@graph"];
    expect(website).toEqual({
      "@type": "WebSite",
      name: SITE_NAME,
      alternateName: SITE_ALTERNATE_NAME,
      url: `${CANONICAL_ORIGIN}/`,
    });
    expect(org).toEqual({
      "@type": "Organization",
      name: "Open People",
      url: `${CANONICAL_ORIGIN}/`,
      logo: {
        "@type": "ImageObject",
        url: `${CANONICAL_ORIGIN}${SITE_LOGO_PATH}`,
        width: SITE_LOGO_SIZE,
        height: SITE_LOGO_SIZE,
      },
    });
    expect(SITE_NAME).toBe("Open People");
    expect(SITE_ALTERNATE_NAME).toBe("openpeople.ai");
    expect(SITE_LOGO_SIZE).toBeGreaterThanOrEqual(112);
    expect(existsSync(resolve(ROOT, `public${SITE_LOGO_PATH}`))).toBe(true);
    expect(siteJsonLdScript()).not.toContain("application/ld+json");
    expect(JSON.parse(siteJsonLdScript())).toEqual(data);
  });

  it("is mounted once in the root layout and not in a nested layout", () => {
    const root = readFileSync(resolve(ROOT, "app/layout.tsx"), "utf8");
    const marketing = readFileSync(resolve(ROOT, "app/(marketing)/layout.tsx"), "utf8");
    expect(root).toMatch(/<SiteJsonLd\s*\/>/);
    expect(root.match(/<SiteJsonLd/g)?.length).toBe(1);
    expect(marketing).not.toMatch(/SiteJsonLd|ld\+json|schema\.org/);
  });
});

describe("favicon set", () => {
  it("does not ship app/favicon.ico, so Next cannot inject a hashed duplicate", () => {
    expect(existsSync(resolve(ROOT, "app/favicon.ico"))).toBe(false);
  });

  it("declares svg, ico, 16/32/48 png, and apple-touch-icon once via metadata", () => {
    const layout = readFileSync(resolve(ROOT, "app/layout.tsx"), "utf8");
    expect(layout).not.toMatch(/<link rel="icon"/);
    expect(layout).not.toMatch(/<link rel="apple-touch-icon"/);
    expect(layout).toMatch(/\/favicon\.svg/);
    expect(layout).toMatch(/\/favicon\.ico/);
    expect(layout).toMatch(/\/favicon-16x16\.png/);
    expect(layout).toMatch(/\/favicon-32x32\.png/);
    expect(layout).toMatch(/\/favicon-48x48\.png/);
    expect(layout).toMatch(/\/apple-touch-icon\.png/);
    for (const file of [
      "public/favicon.svg",
      "public/favicon.ico",
      "public/favicon-16x16.png",
      "public/favicon-32x32.png",
      "public/favicon-48x48.png",
      "public/apple-touch-icon.png",
    ]) {
      expect(existsSync(resolve(ROOT, file)), file).toBe(true);
    }
  });
});
