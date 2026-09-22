import { deskCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt =
  "Churchill Falls — put the next generations first. A 15 September 2026 constituent letter from Tom Lane to Premier Tony Wakeham.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return deskCard({
    kicker: "Letter · 15 September 2026",
    title: "Churchill Falls —",
    em: "put the next generations first.",
    lede: "A constituent letter from Tom Lane to Premier Tony Wakeham. Take the better price. Keep a door open. Keep enough power in Labrador to build on.",
    stat: undefined,
  });
}
