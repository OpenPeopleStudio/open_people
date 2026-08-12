import type { Metadata } from "next";
import Link from "next/link";
import SiteShell from "@/components/marketing/SiteShell";

export const metadata: Metadata = {
  title: "About — Open People",
  description:
    "Open People is a Newfoundland and Labrador company working the Labrador green-electron → sovereign AI compute campaign. Path C: demand and software, not hyperscale steel.",
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
            Open People works at the intersection of Newfoundland and Labrador&apos;s renewable
            hydro surplus and global AI demand for firm, clean, sovereignty-aware compute.
          </p>

          <div className="mt-12 space-y-5 text-[var(--text-secondary)] leading-relaxed">
            <p>
              We are not raising to buy a hyperscale data centre. We assemble{" "}
              <strong className="text-[var(--text-primary)]">bankable demand</strong>, the{" "}
              <strong className="text-[var(--text-primary)]">policy narrative</strong> that puts
              compute on the Labrador industrial list, and the{" "}
              <strong className="text-[var(--text-primary)]">software layer</strong> that makes
              residency and operations real — while infrastructure partners carry construction and
              GPU balance sheets.
            </p>
            <p>
              That stance is deliberate. Capital reality and first-principles analysis killed the
              “raise to own the steel” path. The durable position is originator and operator of
              demand and sovereignty services — with an optional small financeable floor — not
              principal ownership of billion-dollar shells.
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
            <Link href="/brief" className="btn-primary justify-center px-5 py-3 text-sm">
              Read the public case
            </Link>
            <Link href="/approach" className="btn-secondary justify-center px-5 py-3 text-sm">
              How we work
            </Link>
          </div>
        </article>
      </main>
    </SiteShell>
  );
}
