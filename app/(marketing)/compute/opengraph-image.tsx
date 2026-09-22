import { deskCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "A compute plan, not a campus landing.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return deskCard({
    kicker: "Compute plan",
    title: "A compute plan,",
    em: "not a campus landing.",
    lede: "Mining first. Named optionality, not a tranche. No reserved megawatts. Compute is a named use of leftover firm power only if the province writes it eligible.",
    stat: undefined,
    rail: false,
  });
}
