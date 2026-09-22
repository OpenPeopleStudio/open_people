import { deskCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "Labrador power and industry case — the public evidence brief.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return deskCard({
    kicker: "Brief",
    title: "Labrador power &",
    em: "industry case.",
    lede: "One of the cleanest large power systems in North America, sold at a fraction of its modern worth. The framework is not binding. The window is still open.",
    stat: {"value": "up to 2,350", "unit": "MW public retain framing · not a signed queue", "tone": "plasma"},
  });
}
