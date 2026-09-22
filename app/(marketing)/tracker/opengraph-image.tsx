import { DESK_OG } from "@/lib/og/copy";
import { OG_CONTENT_TYPE, OG_SIZE, deskOgImage } from "@/lib/og/image";

export const alt = DESK_OG.tracker.alt;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return deskOgImage(DESK_OG.tracker);
}
