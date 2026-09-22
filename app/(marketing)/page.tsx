import type { Metadata } from "next";
import Link from "next/link";
import SiteShell from "@/components/marketing/SiteShell";
import { Dual, ScaleAnchor } from "@/components/marketing/voice";
import { HOME_GATES, SCALE_ANCHORS } from "@/lib/voice-mode";

export const metadata: Metadata = {
  title: {
    absolute: "Open People — Churchill River / Labrador power desk",
  },
  description:
    "Information desk for the Churchill Falls / Gull Island DCIA: what’s signed, what’s open, mining-first industry, cost structure. Compute is a separate page. Constituent voice only.",
};

const OPEN = [
  {
    title: "In-province use",
    body: SCALE_ANCHORS.retainedMw,
  },
  {
    title: "Recall",
    body: {
      technical:
        "Material Terms describe three-year notice for several HQ sale and recapture paths. House testimony is not a substitute for signed PPAs. Still a framework.",
    },
  },
  {
    title: "Innu Nation",
    body: {
      technical:
        "Partnership, royalty, and Gull Island tariff path unresolved. Innu Nation urged MHAs not to vote. The Premier said he will meet.",
    },
  },
  {
    title: "Federal assessment",
    body: SCALE_ANCHORS.federalAssessment,
  },
] as const;

const DESK = [
  { href: "/tracker", label: "Tracker", k: "What’s signed and still open" },
  { href: "/industries", label: "Industries", k: "Mining and Labrador industry first" },
  { href: "/costs", label: "Costs", k: "Heritage lore vs deal structure" },
  { href: "/brief", label: "Brief", k: "Public evidence case" },
] as const;

const RULES = [
  "Evidence before narrative",
  "No crypto — permanent",
  "Never lead with “cheap power”",
  "Indigenous engagement first-class",
  "Partners own the steel",
];

export default function HomePage() {
  return (
    <SiteShell>
      <main className="desk-page">
        <header className="desk-hero-fade border-b border-[var(--border-subtle)] px-4 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-16">
          <div className="mx-auto max-w-[780px]">
            <p className="desk-kicker">Horizon desk · Churchill River / Labrador power</p>
            <h1 className="desk-h1 mt-7">
              Keep the power here.{" "}
              <em className="not-italic text-[var(--plasma)]">Watch the gates.</em>
            </h1>
            <Dual
              plain={
                <p className="mt-8 max-w-[62ch] text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
                  {SCALE_ANCHORS.exportScale.plain} This site is an information desk: what is signed,
                  what is still open, which industries are already on the grid, and how cost stories
                  get mixed up.
                </p>
              }
              technical={
                <p className="mt-8 max-w-[62ch] text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
                  {SCALE_ANCHORS.exportScale.technical} Horizon desk: DCIA framework (17 Aug 2026),
                  House 21–18 (17 Sep), binding window ~31 Dec 2026 / term to ~31 Mar 2027.
                </p>
              }
            />
            <p className="mt-6 max-w-[62ch] text-base leading-relaxed text-[var(--text-secondary)]">
              Firm in-province power should serve Labrador and island industry —{" "}
              <strong className="font-semibold text-[var(--text-primary)]">mining and resources first</strong>
              . Open People is a constituent and catalyst voice from St. John&apos;s. We are not a
              DCIA party, an offtake seat, or a demand seat.
            </p>
            <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/engage" className="btn-primary justify-center px-6 py-3 text-sm">
                Get involved — keep firm power here
              </Link>
              <Link href="/tracker" className="btn-secondary justify-center px-6 py-3 text-sm">
                Living tracker
              </Link>
            </div>
            <p className="desk-fact mt-6 text-[var(--text-muted)]">
              <Link href="/letter" className="no-underline hover:text-[var(--plasma)]">
                Letter to the Premier · 15 Sep 2026
              </Link>
              <span aria-hidden> · </span>
              <Link href="/compute" className="no-underline hover:text-[var(--plasma)]">
                Compute plan
              </Link>
            </p>
          </div>
        </header>

        <section className="border-b border-[var(--border-subtle)]">
          <div className="mx-auto grid max-w-[1080px] grid-cols-2 border-x border-[var(--border-subtle)] md:grid-cols-4">
            {HOME_GATES.map((s, i) => (
              <div
                key={s.v}
                className={`bg-[var(--surface-1)] p-6 sm:p-8 ${
                  i % 2 === 1 ? "border-l border-[var(--border-subtle)]" : ""
                } ${i >= 2 ? "border-t border-[var(--border-subtle)] md:border-t-0" : ""} ${
                  i > 0 ? "md:border-l md:border-[var(--border-subtle)]" : ""
                }`}
              >
                <div className="desk-rate text-[var(--plasma)]">{s.v}</div>
                <div className="desk-fact mt-3 uppercase tracking-[0.11em] text-[var(--text-muted)]">
                  <Dual plain={s.plain} technical={s.technical} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b border-[var(--border-subtle)] px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-[780px]">
            <p className="desk-kicker">01 — The desk</p>
            <h2 className="desk-h2 mt-4">Four doors. None of them is a campus.</h2>
            <div className="mt-12 grid gap-px bg-[var(--border-subtle)] sm:grid-cols-2">
              {DESK.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="desk-surface bg-[var(--surface-1)] p-6 no-underline hover:bg-[var(--surface-2)]"
                >
                  <div className="desk-fact uppercase tracking-[0.12em] text-[var(--plasma)]">
                    {item.label}
                  </div>
                  <p className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]">
                    {item.k}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[var(--border-subtle)] px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-[780px]">
            <p className="desk-kicker">02 — Still open</p>
            <h2 className="desk-h2 mt-4">Endorsement is not a contract.</h2>
            <p className="mt-6 max-w-[60ch] leading-relaxed text-[var(--text-secondary)]">
              Next public political gate: Québec, 5 October 2026. Binding targets around year-end.
              This is the stretch where public voice can still insist on transparency and
              in-province use — without pretending the deal is finished, and without a sermon
              against it.
            </p>
            <div className="mt-12 grid gap-3">
              {OPEN.map((item, i) => (
                <div key={item.title} className="desk-surface p-6 sm:p-7">
                  <div className="desk-fact uppercase tracking-[0.12em] text-[var(--plasma)]">
                    {String(i + 1).padStart(2, "0")} · {item.title}
                  </div>
                  {"plain" in item.body ? (
                    <ScaleAnchor
                      className="mt-4 text-[15px] leading-relaxed text-[var(--text-secondary)]"
                      technical={item.body.technical}
                      plain={item.body.plain}
                      source={item.body.source}
                    />
                  ) : (
                    <p className="mt-4 text-[15px] leading-relaxed text-[var(--text-secondary)]">
                      {item.body.technical}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <Link
              href="/tracker"
              className="mt-10 inline-flex items-center gap-2 desk-fact uppercase tracking-[0.12em] text-[var(--plasma)] no-underline hover:underline"
            >
              Full living board →
            </Link>
          </div>
        </section>

        <section className="border-b border-[var(--border-subtle)] px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-[780px]">
            <p className="desk-kicker">03 — How we work</p>
            <h2 className="desk-h2 mt-4">Rules we publish so you can hold us to them.</h2>
            <ul className="mt-10 space-y-2">
              {RULES.map((r) => (
                <li
                  key={r}
                  className="flex gap-3 border-l border-[var(--plasma)] bg-[var(--plasma-soft)] px-5 py-4 text-[15px] text-[var(--text-secondary)]"
                >
                  {r}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-sm text-[var(--text-muted)]">
              Full operating doctrine:{" "}
              <Link href="/approach" className="text-[var(--plasma)] no-underline hover:underline">
                Approach
              </Link>
              . Compute optionality is quarantined:{" "}
              <Link href="/compute" className="text-[var(--plasma)] no-underline hover:underline">
                /compute
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-[780px]">
            <p className="desk-h2">
              If the next generation&apos;s firm power is going to be priced while this paper is
              still paper, we&apos;d rather people were in it — not writing about it afterward.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/engage" className="btn-primary justify-center px-6 py-3 text-sm">
                Get involved — keep firm power here
              </Link>
              <a
                href="mailto:tom@openpeople.ai"
                className="btn-secondary justify-center px-6 py-3 text-sm"
              >
                tom@openpeople.ai
              </a>
            </div>
            <div className="desk-fact mt-10 leading-relaxed text-[var(--text-secondary)]">
              <div>Tom Lane · Founder, Open People</div>
              <div className="mt-1 text-[var(--text-muted)]">
                St. John&apos;s, Newfoundland and Labrador
              </div>
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
