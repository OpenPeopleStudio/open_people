import type { Metadata } from "next";

type DeskMetaInput = {
  title: string | { absolute: string };
  description: string;
  path?: string;
  type?: "website" | "article";
  locale?: string;
  robots?: Metadata["robots"];
  ogDescription?: string;
};

/**
 * Page metadata that always sets matching og:title / twitter:title.
 * Root openGraph.title otherwise leaks onto every child route.
 * Images come from opengraph-image.tsx (do not set images here).
 */
export function deskMetadata(input: DeskMetaInput): Metadata {
  const ogTitle =
    typeof input.title === "string" ? `${input.title} · Open People` : input.title.absolute;
  const ogDescription = input.ogDescription ?? input.description;
  const type = input.type ?? "website";
  const locale = input.locale ?? "en_CA";

  const metadata: Metadata = {
    title: input.title,
    description: input.description,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type,
      locale,
      siteName: "Open People",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
    },
  };

  if (input.path) {
    metadata.alternates = { canonical: input.path };
    metadata.openGraph = {
      title: ogTitle,
      description: ogDescription,
      type,
      locale,
      siteName: "Open People",
      url: input.path,
    };
  }

  if (input.robots !== undefined) {
    metadata.robots = input.robots;
  }

  return metadata;
}
