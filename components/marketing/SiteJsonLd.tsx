import { siteJsonLdScript } from "@/lib/og/jsonld";

/** Site-wide WebSite + Organization JSON-LD. Render once from the root layout. */
export function SiteJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: siteJsonLdScript() }}
    />
  );
}
