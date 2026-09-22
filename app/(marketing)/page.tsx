import type { Metadata } from "next";
import Link from "next/link";
import SiteShell from "@/components/marketing/SiteShell";

export const metadata: Metadata = {
  title: {
    absolute: "Open People — Keep firm power in Newfoundland and Labrador",
  },
  description:
    "Constituent voice for keeping Churchill Falls / Gull Island firm power in Newfoundland and Labrador for industry. Mining first. Compute is a named use of that power, not a reserved block.",
};

const GATES = [
  { v: "21–18", k: "House endorsed the DCIA framework, 17 Sep 2026 — not binding PPAs" },
  { v: "5 Oct", k: "Québec election — next public political gate" },
  { v: "YE 2026", k: "Binding definitive agreements targeted ~31 Dec" },
  { v: "31 Mar", k: "DCIA instrument can run to 31 Mar 2027 unless replaced" },
];

const OPEN = [
  {
    title: "In-province use",
    body: "Public framing is about 2,350 MW retained from Churchill Falls and Gull Island, plus wind if built. That is announcement language — not a signed industrial allocation, not a compute tranche, and not a published queue.",
  },
  {
    title: "Recall",
    body: "A Power Advisory consultant told the House of a three-year notice recall so NL can keep more power at home. Still open in contract text. Do not treat testimony as a signed clause.",
  },
  {
    title: "Innu Nation",
    body: "Partnership, royalty, and Gull Island tariff path unresolved. Innu Nation urged MHAs not to vote. The Premier said he will meet.",
  },
  {
    title: "Federal assessment",
    body: "IAAC has not received proponent confirmation that 2026 Gull Island matches the 2012 Lower Churchill scope. The 2026 plant as described is larger than the roughly 2,000 MW reviewed then.",
  },
];

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
      <main>
        <header className="border-b border-[var(--border-subtle)] px-4 pb-14 pt-28 sm:px-6 sm:pb-20 sm:pt-36">
          <div className="mx-auto max-w-[780px]">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--plasma)]">
              Open People · Newfoundland &amp; Labrador
            </p>
            <h1 className="mt-6 font-display text-[2rem] font-normal leading-[1.08] tracking-[-0.022em] sm:text-5xl md:text-[3.4rem]">
              Keep the power here.{" "}
              <em className="not-italic text-[var(--plasma)]">Use it here.</em>
            </h1>
            <p className="mt-6 max-w-[62ch] text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
              Newfoundland and Labrador generates about 43&nbsp;TWh of renewable electricity a year
              and exports most of it. The Churchill Falls / Gull Island DCIA, signed 17 August 2026,
              is a framework — not binding power-purchase agreements. The House endorsed that
              framework 21–18 on 17 September. The contracts that actually bind the power are still
              ahead.
            </p>
            <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-[var(--text-secondary)]">
              Firm in-province power should serve Labrador and island industry — mining and
              resources first. Compute and AI are a{" "}
              <strong className="font-semibold text-[var(--text-primary)]">use of that power</strong>
              , if the province writes them as eligible. They are not a reserved block, and they are
              not the opener.
            </p>
            <p className="mt-4 max-w-[62ch] text-[15px] leading-relaxed text-[var(--text-muted)]">
              Open People is a constituent and catalyst voice from St. John&apos;s. We are not a
              DCIA party, an offtake seat, or a demand seat. Partners would own any steel.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/engage" className="btn-primary justify-center px-6 py-3 text-sm">
                Get involved — keep firm power here
              </Link>
              <Link href="/brief" className="btn-secondary justify-center px-6 py-3 text-sm">
                Public evidence brief
              </Link>
            </div>
            <p className="mt-5">
              <Link
                href="/letter"
                className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)] no-underline hover:text-[var(--plasma)]"
              >
                Letter to the Premier · 15 Sep 2026 →
              </Link>
            </p>
          </div>
        </header>

        <section className="border-b border-[var(--border-subtle)]">
          <div className="mx-auto grid max-w-[1080px] grid-cols-2 border-x border-[var(--border-subtle)] md:grid-cols-4">
            {GATES.map((s, i) => (
              <div
                key={s.v}
                className={`bg-[var(--surface-1)] p-5 sm:p-6 ${
                  i % 2 === 1 ? "border-l border-[var(--border-subtle)]" : ""
                } ${i >= 2 ? "border-t border-[var(--border-subtle)] md:border-t-0" : ""} ${
                  i > 0 ? "md:border-l md:border-[var(--border-subtle)]" : ""
                }`}
              >
                <div className="font-display text-2xl text-[var(--plasma)] sm:text-3xl">{s.v}</div>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.11em] text-[var(--text-muted)]">
                  {s.k}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b border-[var(--border-subtle)] px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-[780px]">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--plasma)]">
              01 — Still open
            </p>
            <h2 className="mt-3 font-display text-3xl font-normal tracking-[-0.018em] sm:text-4xl">
              Endorsement is not a contract.
            </h2>
            <p className="mt-5 max-w-[60ch] text-[var(--text-secondary)]">
              Next public political gate: Québec, 5 October 2026. Binding targets around year-end.
              This is the stretch where public voice can still insist on transparency and
              in-province use — without pretending the deal is finished, and without a sermon
              against it.
            </p>
            <div className="mt-10 grid gap-4">
              {OPEN.map((item, i) => (
                <div
                  key={item.title}
                  className="rounded border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 sm:p-6"
                >
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--plasma)]">
                    {String(i + 1).padStart(2, "0")} · {item.title}
                  </div>
                  <p className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
            <Link
              href="/engage"
              className="mt-8 inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--plasma)] no-underline hover:underline"
            >
              Get involved — keep firm power here →
            </Link>
          </div>
        </section>

        <section className="border-b border-[var(--border-subtle)] px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-[780px]">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--plasma)]">
              02 — The public case
            </p>
            <h2 className="mt-3 font-display text-3xl font-normal tracking-[-0.018em] sm:text-4xl">
              The province that exports 34&nbsp;TWh should decide what it keeps.
            </h2>
            <p className="mt-5 max-w-[60ch] text-[var(--text-secondary)]">
              The public evidence brief maps the asset, the August 17 DCIA framework, what the House
              did in September, and what is still unsigned — bound to public sources, not vibes.
              Mining is first. Compute is optionality.
            </p>
            <Link
              href="/brief"
              className="mt-8 inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--plasma)] no-underline hover:underline"
            >
              Labrador power &amp; industry case →
            </Link>
          </div>
        </section>

        <section className="border-b border-[var(--border-subtle)] px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-[780px]">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--plasma)]">
              03 — How we work
            </p>
            <h2 className="mt-3 font-display text-3xl font-normal tracking-[-0.018em] sm:text-4xl">
              Rules we publish so you can hold us to them.
            </h2>
            <ul className="mt-8 space-y-3">
              {RULES.map((r) => (
                <li
                  key={r}
                  className="flex gap-3 border-l-2 border-[var(--plasma)] bg-[var(--plasma-soft)] px-4 py-3 text-[15px] text-[var(--text-secondary)]"
                >
                  {r}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-[var(--text-muted)]">
              Full operating doctrine:{" "}
              <Link href="/approach" className="text-[var(--plasma)] no-underline hover:underline">
                Approach
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-[780px]">
            <p className="font-display text-2xl leading-snug sm:text-3xl">
              If the next generation&apos;s firm power is going to be priced while this paper is
              still paper, we&apos;d rather people were in it — not writing about it afterward.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
            <div className="mt-8 font-mono text-sm leading-relaxed text-[var(--text-secondary)]">
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
