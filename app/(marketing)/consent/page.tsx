import { TrackScreen, trackMetadata } from "@/components/marketing/board/TrackScreen";

export const metadata = trackMetadata("consent");

export default function ConsentPage() {
  return <TrackScreen id="consent" />;
}
