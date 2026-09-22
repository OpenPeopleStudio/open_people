import { deskCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "Coalition brief — keep firm power in NL. Partner brief.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return deskCard({
    kicker: "Coalition brief",
    title: "Keep the power here.",
    em: "Partners own the steel.",
    lede: "A coalition to keep firm Churchill Falls / Gull Island power in-province: mines, towns, Indigenous partners, infrastructure. Open People is a catalyst, not a buyer.",
    stat: undefined,
  });
}
