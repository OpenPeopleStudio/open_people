import { deskCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "Costs: seven price stories on one ladder, labelled, not merged.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return deskCard({
    kicker: "Costs",
    title: "Seven price stories.",
    em: "One ladder. Nothing merged.",
    lede: "Starts about 1.8¢ in 2027. Averages about 7.4¢ over fifty years. Two mills is history. The mine rate is a formula. The signed industrial cent is not published.",
    stat: {"value": "1.8 → 7.4", "unit": "¢/kWh · a start and an average, not one number", "tone": "plasma"},
  });
}
