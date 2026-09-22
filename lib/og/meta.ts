import type { Metadata } from "next";

export const SITE_NAME = "Open People";
export const HOME_OG_TITLE = "Open People — Churchill River desk · Keep the power here";

/**
 * Consistent page metadata: the <title> uses the layout template, while
 * og:title / twitter:title carry the full "… · Open People" form so share
 * cards read the same everywhere. og:image comes from each route's
 * opengraph-image.tsx (file convention), never from here.
 */
export function deskMeta({
  title,
  description,
  path,
  type = "website",
  absoluteTitle,
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  /** for the home page: the exact og:title and <title> */
  absoluteTitle?: string;
  noindex?: boolean;
}): Metadata {
  const ogTitle = absoluteTitle ?? `${title} · ${SITE_NAME}`;
  return {
    title: absoluteTitle ? { absolute: absoluteTitle } : title,
    description,
    alternates: { canonical: path },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title: ogTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      type,
      locale: "en_CA",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
    },
  };
}
