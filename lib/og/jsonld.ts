import { CANONICAL_ORIGIN } from "@/lib/site";

/** Square PWA mark, 192×192 — existing public asset, above Google's 112px floor. */
export const SITE_LOGO_PATH = "/android-chrome-192x192.png";
export const SITE_LOGO_SIZE = 192;
export const SITE_NAME = "Open People";
export const SITE_ALTERNATE_NAME = "openpeople.ai";

export type SiteJsonLd = {
  "@context": "https://schema.org";
  "@graph": [
    {
      "@type": "WebSite";
      name: string;
      alternateName: string;
      url: string;
    },
    {
      "@type": "Organization";
      name: string;
      url: string;
      logo: {
        "@type": "ImageObject";
        url: string;
        width: number;
        height: number;
      };
    },
  ];
};

/** One WebSite + Organization graph. Canonical www origin, never a preview host. */
export function siteJsonLd(): SiteJsonLd {
  const url = `${CANONICAL_ORIGIN}/`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE_NAME,
        alternateName: SITE_ALTERNATE_NAME,
        url,
      },
      {
        "@type": "Organization",
        name: SITE_NAME,
        url,
        logo: {
          "@type": "ImageObject",
          url: `${CANONICAL_ORIGIN}${SITE_LOGO_PATH}`,
          width: SITE_LOGO_SIZE,
          height: SITE_LOGO_SIZE,
        },
      },
    ],
  };
}

export function siteJsonLdScript(): string {
  return JSON.stringify(siteJsonLd()).replace(/</g, "\\u003c");
}
