/**
 * Canonical public origin. Apex openpeople.ai 307s to www; crawlers that
 * refuse redirects would otherwise fetch OG images from the wrong host.
 */
export const CANONICAL_ORIGIN = "https://www.openpeople.ai";

export function siteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? CANONICAL_ORIGIN;
  try {
    const url = new URL(raw);
    if (url.hostname === "openpeople.ai") {
      url.hostname = "www.openpeople.ai";
    }
    return url.origin;
  } catch {
    return CANONICAL_ORIGIN;
  }
}
