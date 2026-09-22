import { deskCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const alt = "Tracker: what is signed, what is open, what we still mark unknown.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return deskCard({
    kicker: "Tracker",
    title: "What’s signed. What’s open.",
    em: "What’s still unknown.",
    lede: "A living board for the Churchill Falls / Gull Island framework. Endorsement is not a contract; the Premier has not promised MHAs a vote on the final text.",
    stat: {"value": "3", "unit": "things the public paper still does not say", "tone": "alert"},
  });
}
