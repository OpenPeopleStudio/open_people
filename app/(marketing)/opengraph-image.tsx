import { deskCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "Open People — Churchill River desk. Keep the power here. Watch the gates.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return deskCard({
    kicker: "Churchill River desk",
    title: "Keep the power here.",
    em: "Watch the gates.",
    lede: "What is signed, what is open, and what the public text still does not say about Churchill Falls / Gull Island firm power. Mining first.",
    stat: {"value": "43.1", "unit": "TWh renewable a year · most of it leaves", "tone": "ink"},
  });
}
