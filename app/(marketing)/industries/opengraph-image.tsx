import { deskCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "Industries: mining first, then the wire.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return deskCard({
    kicker: "Industries",
    title: "Mining first.",
    em: "Then the wire.",
    lede: "The mines already use about 312 MW of the roughly 525 MW Hydro has for Labrador today. The west lines are at their limit. A bigger line is funded and undated.",
    stat: {"value": "~312", "unit": "MW to IOC and Tacora today · press cite", "tone": "ink"},
  });
}
