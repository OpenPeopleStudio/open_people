import type { Metadata } from "next";
import SiteShell from "@/components/marketing/SiteShell";

export const metadata: Metadata = {
  title: "Contact — Open People",
  description:
    "Contact Tom Lane at Open People — tom@openpeople.ai — St. John’s, Newfoundland and Labrador.",
};

export default function ContactPage() {
  return (
    <SiteShell>
      <main className="px-4 pb-20 pt-28 sm:px-6 sm:pb-28 sm:pt-36">
        <div className="mx-auto max-w-[780px]">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--plasma)]">
            Contact
          </p>
          <h1 className="mt-4 font-display text-[2rem] font-normal leading-[1.1] tracking-[-0.02em] sm:text-5xl">
            Start with a conversation, not a funnel.
          </h1>
          <p className="mt-6 max-w-[55ch] text-lg leading-relaxed text-[var(--text-secondary)]">
            Government relations, offtake interest, infrastructure partnership, or a careful
            introduction — write directly.
          </p>

          <div className="mt-12 rounded border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6 sm:p-8">
            <div className="font-display text-xl sm:text-2xl">Tom Lane</div>
            <div className="mt-1 text-sm text-[var(--text-muted)]">Founder, Open People</div>
            <a
              href="mailto:tom@openpeople.ai?subject=Open%20People"
              className="mt-6 inline-block font-mono text-base text-[var(--plasma)] no-underline hover:underline"
            >
              tom@openpeople.ai
            </a>
            <p className="mt-4 font-mono text-[12px] leading-relaxed text-[var(--text-muted)]">
              St. John&apos;s, Newfoundland and Labrador
              <br />
              Canada
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded border border-[var(--border-subtle)] p-5">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--plasma)]">
                Public briefing
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Read the Labrador Compute Case before a first meeting when you can.
              </p>
              <a
                href="/brief"
                className="mt-4 inline-block font-mono text-[12px] text-[var(--plasma)] no-underline hover:underline"
              >
                openpeople.ai/brief →
              </a>
            </div>
            <div className="rounded border border-[var(--border-subtle)] p-5">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--plasma)]">
                Sequencing
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Information before advocacy. Partners before politicians. Never an ask before the
                brief has been read.
              </p>
            </div>
          </div>
        </div>
      </main>
    </SiteShell>
  );
}
