import { DeskPage, DeskSection } from "@/components/marketing/shell";
import { AskDesk } from "@/components/marketing/ask/AskDesk";
import {
  ASK_HOW_GROUNDING,
  ASK_HOW_GUARDRAILS,
  ASK_HOW_HEADING,
  ASK_HOW_MODELS,
  ASK_HOW_PRIVACY,
} from "@/lib/ask/how-it-works";
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
        <section className="desk-surface p-5 sm:p-6" aria-labelledby="ask-how">
          <p className="desk-kicker" id="ask-how">
            {ASK_HOW_HEADING}
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-2)]">{ASK_HOW_GROUNDING}</p>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-2)]">{ASK_HOW_MODELS}</p>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-2)]">{ASK_HOW_GUARDRAILS}</p>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-2)]">{ASK_HOW_PRIVACY}</p>
        </section>
        <div className="mt-10">
          <AskDesk />
        </div>
      </DeskSection>
    </DeskPage>
  );
}
