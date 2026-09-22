import { deskCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "Keep firm power in Newfoundland and Labrador. Seven checks before the paper hardens.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return deskCard({
    kicker: "Engage",
    title: "Keep firm power",
    em: "in Newfoundland and Labrador.",
    lede: "Seven checks an MHA can put to the long-form before it hardens. No invented megawatts or prices. Mining first; compute only if the province writes it.",
    stat: {"value": "7", "unit": "checks · each with its live tracker status", "tone": "plasma"},
  });
}
