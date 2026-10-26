import type { Metadata } from "next";
import Link from "next/link";
import { DeskPage, DeskSection } from "@/components/marketing/shell";
import { ContactMailLink } from "./ContactForm";

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
          Write directly. To come in on the work, start from a track:{" "}
          <Link href="/build" className="board-record">
            Build
          </Link>
          ,{" "}
          <Link href="/capital" className="board-record">
            Capital
          </Link>
          ,{" "}
          <Link href="/consent" className="board-record">
            Consent
          </Link>
          , or{" "}
          <Link href="/power" className="board-record">
            Power
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
          <ContactMailLink
            href="mailto:tom@openpeople.ai?subject=Open%20People"
            className="board-mail mt-6 inline-block"
          >
            tom@openpeople.ai
          </ContactMailLink>
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
            <Link href="/brief" className="board-record desk-fact mt-4 inline-block">
              openpeople.ai/brief →
            </Link>
          </div>
          <div className="p-5">
            <div className="desk-kicker">Sequencing</div>
            <p className="mt-2 text-sm text-[var(--ink-2)]">
              Name the track. Say who you are, and what you are offering or asking.
            </p>
          </div>
        </div>
      </DeskSection>
    </DeskPage>
  );
}
