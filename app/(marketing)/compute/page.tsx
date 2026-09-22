import type { Metadata } from "next";
import Link from "next/link";
import SiteShell from "@/components/marketing/SiteShell";
import { Dual, ScaleAnchor } from "@/components/marketing/voice";
import { DeskKicker, DeskVerified } from "@/components/marketing/desk";
import {
  COMPUTE_HERO,
  COMPUTE_HONESTY,
  COMPUTE_LAST_VERIFIED,
  COMPUTE_NEIGHBOURS,
  COMPUTE_RULES,
} from "@/lib/desk";
import { SCALE_ANCHORS } from "@/lib/voice-mode";

export const metadata: Metadata = {
  title: "Compute plan",
  description:
    "Open People’s energy-use plan for compute only: mining first, named optionality, no reserved megawatts. Not a data-centre pitch. Not a DCIA seat.",
  alternates: { canonical: "/compute" },
  robots: { index: true, follow: true },
};

export default function ComputePage() {
  return (
    <SiteShell>
      <main className="px-4 pb-20 pt-28 sm:px-6 sm:pb-28 sm:pt-36">
        <article className="mx-auto max-w-[780px]">
          <DeskKicker>Quarantine · compute as a named use</DeskKicker>
          <h1 className="mt-4 font-display text-[2rem] font-normal leading-[1.1] tracking-[-0.02em] sm:text-5xl">
            A compute plan, not a campus landing.
          </h1>
          <ScaleAnchor
            className="mt-6 text-lg leading-relaxed text-[var(--text-secondary)]"
            technical={COMPUTE_HERO.technical}
            plain={COMPUTE_HERO.plain}
            source={SCALE_ANCHORS.computeOptional.source}
          />
          <DeskVerified date={COMPUTE_LAST_VERIFIED} />
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            The public desk is{" "}
            <Link href="/tracker" className="text-[var(--plasma)] no-underline hover:underline">
              Tracker
            </Link>
            ,{" "}
            <Link href="/industries" className="text-[var(--plasma)] no-underline hover:underline">
              Industries
            </Link>
            , and{" "}
            <Link href="/costs" className="text-[var(--plasma)] no-underline hover:underline">
              Costs
            </Link>
            . This page exists so compute copy does not open the site.
          </p>

          <div className="mt-12 grid gap-4">
            {COMPUTE_RULES.map((rule) => (
              <section
                key={rule.title}
                className="rounded border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 sm:p-6"
              >
                <h2 className="font-display text-2xl font-normal tracking-[-0.018em]">{rule.title}</h2>
                <ScaleAnchor
                  className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]"
                  technical={rule.body.technical}
                  plain={rule.body.plain}
                />
              </section>
            ))}
          </div>

          <section className="mt-10 rounded border border-[var(--border-subtle)] p-5 sm:p-6">
            <h2 className="font-display text-2xl font-normal tracking-[-0.018em]">
              Neighbouring grids (context only)
            </h2>
            <ScaleAnchor
              className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]"
              technical={COMPUTE_NEIGHBOURS.technical}
              plain={COMPUTE_NEIGHBOURS.plain}
              source="Neighbouring-grid facts · not a Labrador reservation"
            />
          </section>

          <section className="mt-10">
            <h2 className="font-display text-2xl font-normal tracking-[-0.018em]">
              What we have not proven
            </h2>
            <ul className="mt-5 space-y-3">
              {COMPUTE_HONESTY.map((line) => (
                <li
                  key={line}
                  className="border-l-2 border-[var(--plasma)] bg-[var(--plasma-soft)] px-4 py-3 text-[15px] text-[var(--text-secondary)]"
                >
                  {line}
                </li>
              ))}
            </ul>
          </section>

          <Dual
            plain={
              <p className="mt-10 text-sm leading-relaxed text-[var(--text-muted)]">
                Hogan test: calm public precision. No reserved megawatts. No invented SPE. Partners
                would own any steel. Open People stays outside the DCIA — constituent and catalyst
                only.
              </p>
            }
            technical={
              <p className="mt-10 text-sm leading-relaxed text-[var(--text-muted)]">
                Hogan test: calm public precision. No reserved MW, ¢/kWh industrial compute tariff,
                or demand seat. Wind SPE unnamed (DCIA §13). Open People is not a DCIA party.
              </p>
            }
          />

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/engage" className="btn-primary justify-center px-6 py-3 text-sm">
              Get involved — keep firm power here
            </Link>
            <Link href="/industries" className="btn-secondary justify-center px-6 py-3 text-sm">
              Back to industries
            </Link>
          </div>
        </article>
      </main>
    </SiteShell>
  );
}
