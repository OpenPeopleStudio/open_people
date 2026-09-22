import type { Metadata } from "next";
import Link from "next/link";
import { DeskPage, DeskSection } from "@/components/marketing/shell";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Tom Lane at Open People — tom@openpeople.ai — St. John’s, Newfoundland and Labrador.",
};

export default function ContactPage() {
  return (
    <DeskPage
      kicker="Contact"
      title="Start with a conversation, not a funnel."
      lede={
        <p>
          Government relations, in-province power, infrastructure partnership, or a careful
          introduction: write directly. If you want firm power kept in NL, start at{" "}
          <Link href="/engage" className="desk-link">
            /engage
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
              Information before advocacy. Partners before politicians. Never an ask before the brief
              has been read.
            </p>
          </div>
        </div>
      </DeskSection>
    </DeskPage>
  );
}
