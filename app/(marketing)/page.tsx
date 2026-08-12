import type { Metadata } from "next";
import Link from "next/link";
import SiteShell from "@/components/marketing/SiteShell";

export const metadata: Metadata = {
  title: "Open People — Labrador green electrons → sovereign AI compute",
  description:
    "Open People catalyzes Labrador-linked AI compute offtake from Newfoundland and Labrador’s renewable power — demand aggregation and sovereignty software, not hyperscale steel.",
};

const LAYERS = [
  {
    title: "Demand",
    body: "Assemble multi-year, residency-bound offtake — government, institutions, regulated buyers — so a Labrador node is bankable before steel is poured.",
  },
  {
    title: "Narrative & policy",
    body: "Make AI compute a named industrial use of Labrador power alongside critical minerals — during the Churchill Falls renegotiation window.",
  },
  {
    title: "Sovereignty software",
    body: "The recurring layer: guardrails, residency, and AI services that sit on top of partner-built capacity.",
  },
];

const RULES = [
  "Evidence before narrative",
  "No crypto — permanent",
  "Never lead with “cheap power”",
  "Indigenous engagement first-class",
  "Partners own the steel",
];

const STATS = [
  { v: "43.1 TWh", k: "NL renewable generation, 2023" },
  { v: "34.5 TWh", k: "Net outflows — mostly to Québec" },
  { v: "5,428 MW", k: "Churchill Falls installed capacity" },
  { v: "Path C", k: "Demand + software, not principal steel" },
];

export default function HomePage() {
  return (
    <SiteShell>
      <main>
        {/* Hero */}
        <header className="border-b border-[var(--border-subtle)] px-4 pb-14 pt-28 sm:px-6 sm:pb-20 sm:pt-36">
          <div className="mx-auto max-w-[780px]">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--plasma)]">
              Open People · Newfoundland &amp; Labrador
            </p>
            <h1 className="mt-6 font-display text-[2rem] font-normal leading-[1.08] tracking-[-0.022em] sm:text-5xl md:text-[3.4rem]">
              Electrons as industry,{" "}
              <em className="not-italic text-[var(--plasma)]">not raw export</em>.
            </h1>
            <p className="mt-6 max-w-[62ch] text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
              Newfoundland and Labrador generates about 43&nbsp;TWh of renewable electricity a year
              and exports most of it. The Churchill Falls renegotiation is the window to reserve a
              compute-eligible block in Labrador — and keep the value in the province.
            </p>
            <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-[var(--text-secondary)]">
              Open People is the capital-light catalyst: we originate{" "}
              <strong className="font-semibold text-[var(--text-primary)]">demand</strong> and{" "}
              <strong className="font-semibold text-[var(--text-primary)]">sovereignty software</strong>.
              Partners build and own the steel.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/brief" className="btn-primary justify-center px-6 py-3 text-sm">
                Read the Labrador Compute Case
              </Link>
              <a
                href="mailto:tom@openpeople.ai"
                className="btn-secondary justify-center px-6 py-3 text-sm"
              >
                tom@openpeople.ai
              </a>
            </div>
          </div>
        </header>

        {/* Stats */}
        <section className="border-b border-[var(--border-subtle)]">
          <div className="mx-auto grid max-w-[1080px] grid-cols-2 border-x border-[var(--border-subtle)] md:grid-cols-4">
            {STATS.map((s, i) => (
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

        {/* What we do */}
        <section className="border-b border-[var(--border-subtle)] px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-[780px]">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--plasma)]">
              01 — What we hold
            </p>
            <h2 className="mt-3 font-display text-3xl font-normal tracking-[-0.018em] sm:text-4xl">
              Three layers. Deliberately not the expensive one.
            </h2>
            <p className="mt-5 max-w-[60ch] text-[var(--text-secondary)]">
              Path C: hyperscale power, construction, and GPU balance-sheet risk sit with partners.
              Open People owns relationships, offtake, software, and narrative — with optional
              promote on a small financeable floor.
            </p>
            <div className="mt-10 grid gap-4">
              {LAYERS.map((layer, i) => (
                <div
                  key={layer.title}
                  className="rounded border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 sm:p-6"
                >
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--plasma)]">
                    {String(i + 1).padStart(2, "0")} · {layer.title}
                  </div>
                  <p className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]">
                    {layer.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Case teaser */}
        <section className="border-b border-[var(--border-subtle)] px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-[780px]">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--plasma)]">
              02 — The public case
            </p>
            <h2 className="mt-3 font-display text-3xl font-normal tracking-[-0.018em] sm:text-4xl">
              The province that exports 34&nbsp;TWh should own the machines that value it.
            </h2>
            <p className="mt-5 max-w-[60ch] text-[var(--text-secondary)]">
              Our public briefing maps the asset, the renegotiation window, the AI demand shock,
              and the provincial asks — bound to audited sources, not vibes.
            </p>
            <Link
              href="/brief"
              className="mt-8 inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--plasma)] no-underline hover:underline"
            >
              openpeople.ai/brief →
            </Link>
          </div>
        </section>

        {/* Rules */}
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

        {/* Contact */}
        <section className="px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-[780px]">
            <p className="font-display text-2xl leading-snug sm:text-3xl">
              If Labrador&apos;s electrons will be priced for the next generation in the next
              eighteen months, we&apos;d rather be in the room with a coalition than write about it
              afterward.
            </p>
            <div className="mt-8 font-mono text-sm leading-relaxed text-[var(--text-secondary)]">
              <div>Tom Lane · Founder, Open People</div>
              <a
                href="mailto:tom@openpeople.ai"
                className="text-[var(--plasma)] no-underline hover:underline"
              >
                tom@openpeople.ai
              </a>
              <div className="mt-1 text-[var(--text-muted)]">St. John&apos;s, Newfoundland and Labrador</div>
            </div>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
