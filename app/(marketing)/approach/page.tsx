import type { Metadata } from "next";
import Link from "next/link";
import SiteShell from "@/components/marketing/SiteShell";

export const metadata: Metadata = {
  title: "Approach",
  description:
    "Path C capital model, evidence rules, and operating doctrine for Open People’s Labrador compute campaign.",
};

const SECTIONS = [
  {
    num: "01",
    title: "Path C capital model",
    body: [
      "Partners own hyperscale construction, interconnect, and GPU fleets.",
      "Open People owns offtake origination, government relations, narrative, and the sovereignty/AI software layer — plus optional promote or a small financeable micro-node floor.",
      "We do not lead with balance-sheet steel. We lead with bankable demand and a credible provincial path.",
    ],
  },
  {
    num: "02",
    title: "Evidence before narrative",
    body: [
      "Every public claim maps to an audited validity pack (CER, NL Hydro, IRC, and related primary sources).",
      "If it is not sourced, we do not say it on the open web.",
      "Inversion and kill-tests run before major resource bets expand.",
    ],
  },
  {
    num: "03",
    title: "What we will not do",
    body: [
      "No crypto mining as the product story — permanent. Newfoundland’s last data-centre memory is a cautionary tale; we do not revive it.",
      "Never lead with “cheap power.” We lead with jobs, offtake, sovereignty, and federal co-investment. Arbitrage framing loses this argument.",
      "Compute alongside critical minerals, not against them. Shared transmission and shared community benefits.",
      "Indigenous engagement is first-class — equity conversation from day one, not a consultation footnote at the end.",
    ],
  },
  {
    num: "04",
    title: "Hospitality and compliance",
    body: [
      "Coalition partners, engineers, capital, and advisors may be hosted at our table.",
      "Ministers and public officials get briefings in their offices — not dinners. That line is deliberate under provincial and federal lobbying and conflict-of-interest rules.",
    ],
  },
  {
    num: "05",
    title: "Geography",
    body: [
      "Labrador (or Labrador-powered) is the power story.",
      "St. John’s is the relationship and product-proof base.",
      "We do not confuse island retail rates with Labrador industrial reality — and we verify rates with primary sources before any commercial claim.",
    ],
  },
];

export default function ApproachPage() {
  return (
    <SiteShell>
      <main className="px-4 pb-20 pt-28 sm:px-6 sm:pb-28 sm:pt-36">
        <article className="mx-auto max-w-[780px]">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--plasma)]">
            Approach
          </p>
          <h1 className="mt-4 font-display text-[2rem] font-normal leading-[1.1] tracking-[-0.02em] sm:text-5xl">
            How we work — and how we ask others to work with us.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-[var(--text-secondary)]">
            Open People runs a multi-year campaign, not a one-deck fundraise. These rules are
            public so partners and officials can hold us to them.
          </p>

          <div className="mt-14 space-y-14">
            {SECTIONS.map((s) => (
              <section key={s.num}>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--plasma)]">
                  {s.num}
                </p>
                <h2 className="mt-2 font-display text-2xl font-normal tracking-[-0.015em] sm:text-3xl">
                  {s.title}
                </h2>
                <ul className="mt-5 space-y-3">
                  {s.body.map((line) => (
                    <li
                      key={line}
                      className="border-l border-[var(--border-medium)] pl-4 text-[15px] leading-relaxed text-[var(--text-secondary)]"
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="mt-14 flex flex-col gap-3 sm:flex-row">
            <Link href="/brief" className="btn-primary justify-center px-5 py-3 text-sm">
              Public case
            </Link>
            <Link href="/contact" className="btn-secondary justify-center px-5 py-3 text-sm">
              Contact
            </Link>
          </div>
        </article>
      </main>
    </SiteShell>
  );
}
