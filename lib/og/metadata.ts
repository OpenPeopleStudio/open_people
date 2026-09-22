import type { Metadata } from "next";
import { DESK_OG_IMAGE, DESK_OG_IMAGE_PATH } from "./copy";

type DeskMetaInput = {
  title: string | { absolute: string };
  description: string;
  path?: string;
  type?: "website" | "article";
  locale?: string;
  robots?: Metadata["robots"];
  ogDescription?: string;
};

const SHARE_IMAGES = [
  {
    url: DESK_OG_IMAGE.url,
    width: DESK_OG_IMAGE.width,
    height: DESK_OG_IMAGE.height,
    alt: DESK_OG_IMAGE.alt,
  },
];

/**
 * Page metadata that always sets matching og:title / twitter:title / images.
 * Root or child openGraph objects that omit `images` wipe file-based
 * opengraph-image.tsx injection, so the PNG is set explicitly.
 */
export function deskMetadata(input: DeskMetaInput): Metadata {
  const ogTitle =
    typeof input.title === "string" ? `${input.title} · Open People` : input.title.absolute;
  const ogDescription = input.ogDescription ?? input.description;
  const type = input.type ?? "website";
  const locale = input.locale ?? "en_CA";

  const openGraph: NonNullable<Metadata["openGraph"]> = {
    title: ogTitle,
    description: ogDescription,
    type,
    locale,
    siteName: "Open People",
    images: SHARE_IMAGES,
  };

  if (input.path) {
    openGraph.url = input.path;
  }

  const metadata: Metadata = {
    title: input.title,
    description: input.description,
    openGraph,
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [DESK_OG_IMAGE_PATH],
    },
  };

  if (input.path) {
    metadata.alternates = { canonical: input.path };
  }

  if (input.robots !== undefined) {
    metadata.robots = input.robots;
  }

  return metadata;
}
