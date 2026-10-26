import { TrackScreen, trackMetadata } from "@/components/marketing/board/TrackScreen";

export const metadata = trackMetadata("build");

export default function BuildPage() {
  return <TrackScreen id="build" />;
}
