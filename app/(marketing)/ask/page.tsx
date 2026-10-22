import { DeskPage, DeskSection } from "@/components/marketing/shell";
import { AskDesk } from "@/components/marketing/ask/AskDesk";
import { deskMetadata } from "@/lib/og/metadata";

export const metadata = deskMetadata({
  title: "Ask the preliminary proposal",
  description:
    "Ask anything about Open People's preliminary proposal. Answers are honest and labelled. If we don't know yet, we'll find out and email you.",
  path: "/ask",
  ogDescription:
    "Ask Open People's preliminary proposal. Answers labelled. UNKNOWN if we don't know.",
});

export default function AskPage() {
  return (
    <DeskPage
      kicker="Ask · Open People"
      title={
        <>
          Ask the preliminary proposal.
        </>
      }
      lede={
        <p>
          Ask anything about Open People&apos;s preliminary proposal. Answers are honest and
          labelled. If we don&apos;t know yet, we&apos;ll find out and email you.
        </p>
      }
      verified={false}
      singleVoice
      sections={[{ id: "ask", label: "Ask" }]}
    >
      <DeskSection id="ask" num="01 — Ask" title="Questions, labelled.">
        <AskDesk />
      </DeskSection>
    </DeskPage>
  );
}
