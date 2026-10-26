import type { Metadata } from "next";
import Link from "next/link";
import { DeskPage, DeskSection } from "@/components/marketing/shell";

export const metadata: Metadata = {
  title: "Contact Open People on Churchill Falls",
  description:
    "Write Tom Lane at Open People — tom@openpeople.ai — about keeping firm power in Newfoundland and Labrador, or about the proposed Labrador campus.",
};

export default function ContactPage() {
  return (
    <DeskPage
      kicker="Open People · Contact"
      title="Start with a conversation, not a funnel."
      lede={
        <p>
          Open People is working to keep firm power in Newfoundland and Labrador, mining first, and
          we lead a proposed Labrador campus in feasibility. Government relations, infrastructure
          partnership, or a careful introduction: write Tom directly. If you want in-province use
          kept in the paper, start at{" "}
          <Link href="/engage" className="desk-link">
            Engage
          </Link>
          .
        </p>
      }
      verified={false}
    >
      <DeskSection id="contact">
        <div className="desk-surface p-6 sm:p-8">
          <div className="desk-h3">Tom Lane</div>
          <div className="mt-1 text-sm text-[var(--ink-3)]">Founder, Open People</div>
          <a
            href="mailto:tom@openpeople.ai?subject=Open%20People"
            className="desk-link mt-6 inline-block font-mono text-base"
          >
            tom@openpeople.ai
          </a>
          <p className="desk-fact mt-4 leading-relaxed text-[var(--ink-3)]">
            St. John&apos;s, Newfoundland and Labrador
            <br />
            Canada
          </p>
        </div>

        <div className="desk-grid-hair mt-6 sm:grid-cols-2">
          <div className="p-5">
            <div className="desk-kicker">Public briefing</div>
            <p className="mt-2 text-sm text-[var(--ink-2)]">
              Read the Labrador power &amp; industry case before a first meeting when you can.
            </p>
            <Link href="/brief" className="desk-link desk-fact mt-4 inline-block">
              openpeople.ai/brief →
            </Link>
          </div>
          <div className="p-5">
            <div className="desk-kicker">Sequencing</div>
            <p className="mt-2 text-sm text-[var(--ink-2)]">
              Read the brief before you ask us for anything. Partners before politicians. We will not
              put an ask in front of the evidence.
            </p>
          </div>
        </div>
      </DeskSection>
    </DeskPage>
  );
}
