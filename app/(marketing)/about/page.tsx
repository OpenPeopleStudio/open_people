import type { Metadata } from "next";
import Link from "next/link";
import SiteShell from "@/components/marketing/SiteShell";

export const metadata: Metadata = {
  title: "About",
  description:
    "Open People is a Newfoundland and Labrador constituent voice for keeping Churchill Falls / Gull Island firm power in-province. Path C: catalyst, not hyperscale steel. Not a DCIA party.",
};

export default function AboutPage() {
  return (
    <SiteShell>
      <main className="px-4 pb-20 pt-28 sm:px-6 sm:pb-28 sm:pt-36">
        <article className="mx-auto max-w-[780px]">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--plasma)]">
            About
          </p>
          <h1 className="mt-4 font-display text-[2rem] font-normal leading-[1.1] tracking-[-0.02em] sm:text-5xl">
            A Newfoundland company on the Labrador power story.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-[var(--text-secondary)]">
            Open People is a constituent and catalyst voice for keeping firm Churchill Falls /
            Gull Island power in Newfoundland and Labrador. Mining and Labrador industry first.
            Compute is a named use of that power — not a reserved block, and not a seat at the
            deal table.
          </p>

          <div className="mt-12 space-y-5 text-[var(--text-secondary)] leading-relaxed">
            <p>
              We are not a DCIA party, an offtake seat, or a demand seat. We are not raising to buy
              a hyperscale data centre. The public work is{" "}
              <strong className="text-[var(--text-primary)]">in-province use</strong> and{" "}
              <strong className="text-[var(--text-primary)]">transparency</strong> while the
              framework is still a framework. If partners later build capacity, Open People&apos;s
              Path C role is the{" "}
              <strong className="text-[var(--text-primary)]">software layer</strong> — while
              infrastructure partners carry construction and GPU balance sheets.
            </p>
            <p>
              That stance is deliberate. Capital reality killed the “raise to own the steel” path.
              The durable position is catalyst, not principal ownership of billion-dollar shells.
            </p>
            <p>
              The company is based in{" "}
              <strong className="text-[var(--text-primary)]">St. John&apos;s</strong>. Founder Tom
              Lane also built and operates{" "}
              <strong className="text-[var(--text-primary)]">Snow White Laundry</strong> on Water
              Street — a live operator record and, under strict rules, a hospitality setting for
              coalition partners (not for public officials).
            </p>
          </div>

          <div className="mt-12 rounded border border-[var(--border-subtle)] border-l-2 border-l-[var(--plasma)] bg-[var(--plasma-soft)] p-5 sm:p-6">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--plasma)]">
              Public facts only
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
              Energy figures on this site map to Canada Energy Regulator, NL Hydro, and Independent
              Review Committee materials. We do not invent rates. Claims that are unproven stay
              labeled as work, not settled fact.
            </p>
          </div>

          <div className="mt-12 flex flex-col gap-3 sm:flex-row">
            <Link href="/engage" className="btn-primary justify-center px-5 py-3 text-sm">
              Get involved — keep firm power here
            </Link>
            <Link href="/brief" className="btn-secondary justify-center px-5 py-3 text-sm">
              Read the public case
            </Link>
          </div>
        </article>
      </main>
    </SiteShell>
  );
}
