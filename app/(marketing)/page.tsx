import { DeskPage, DeskSection } from "@/components/marketing/shell";
import { BoardLog, TrackRows } from "@/components/marketing/board/EntryBlock";
import { Dual } from "@/components/marketing/voice/Dual";
import { COMPUTE_HERO } from "@/lib/desk";
import { HOME_DESCRIPTION, HOME_TITLE } from "@/lib/og/copy";
import { deskMetadata } from "@/lib/og/metadata";

export const metadata = deskMetadata({
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  path: "/",
});

export default function HomePage() {
  return (
    <DeskPage
      kicker="Open People"
      title={
        <>
          Building a <em>Labrador campus.</em>
        </>
      }
      lede={<Dual plain={<p>{COMPUTE_HERO.plain}</p>} technical={<p>{COMPUTE_HERO.technical}</p>} />}
      verified={false}
      sections={[
        { id: "board", label: "The board" },
        { id: "log", label: "Log" },
      ]}
    >
      <DeskSection id="board" num="01 — The board" title="Four tracks. One project." wide>
        <TrackRows />
      </DeskSection>
      <DeskSection id="log" num="02 — Log" title="What has been cleared." wide>
        <BoardLog />
      </DeskSection>
    </DeskPage>
  );
}
