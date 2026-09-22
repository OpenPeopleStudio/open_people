import Link from "next/link";
import { DeskPage, DeskSection } from "@/components/marketing/shell";
import { Term, Unfold } from "@/components/marketing/depth";
import {
  COMPUTE_HERO,
  COMPUTE_HONESTY,
  COMPUTE_LAST_VERIFIED,
  COMPUTE_NEIGHBOURS,
  COMPUTE_RULES,
  DESK_SOURCES,
} from "@/lib/desk";
import { deskMetadata } from "@/lib/og/metadata";

export const metadata = deskMetadata({
  title: "Compute plan",
  description:
    "Open People’s energy-use plan for compute only: mining first, named optionality, no reserved megawatts. Not a data-centre pitch. Not a seat at the deal table.",
  path: "/compute",
  robots: { index: true, follow: true },
});

export default function ComputePage() {
  return (
    <DeskPage
      quiet
      verified={COMPUTE_LAST_VERIFIED}
      kicker="Separate page · compute as a named use"
      title="A compute plan, not a campus landing."
      lede={
        <Unfold
          id="compute-lede"
          label="the plan"
          plain={<p>{COMPUTE_HERO.plain}</p>}
          technical={COMPUTE_HERO.technical}
          sources={[DESK_SOURCES.dciaHq]}
        />
      }
      meta={
        <p className="text-sm text-[var(--ink-3)]">
          The public desk is{" "}
          <Link href="/tracker" className="desk-link">
            Tracker
          </Link>
          ,{" "}
          <Link href="/industries" className="desk-link">
            Industries
          </Link>
          , and{" "}
          <Link href="/costs" className="desk-link">
            Costs
          </Link>
          . This page exists so <Term k="compute">compute</Term> copy does not open the site. There
          is no gate clock here on purpose: this is not a project timeline.
        </p>
      }
      sections={[
        { id: "rules", label: "Three rules" },
        { id: "neighbours", label: "Neighbouring grids" },
        { id: "honesty", label: "Not proven" },
      ]}
    >
      <DeskSection id="rules" wide>
        <div className="grid gap-4">
          {COMPUTE_RULES.map((rule) => (
            <section key={rule.title} className="desk-surface p-5 sm:p-6" data-rise>
              <h2 className="desk-h3">{rule.title}</h2>
              <Unfold
                id={`rule-${rule.title.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                className="mt-3"
                plain={<p className="desk-takeaway">{rule.body.plain}</p>}
                technical={rule.body.technical}
              />
            </section>
          ))}
        </div>
      </DeskSection>

      <DeskSection id="neighbours" title="Neighbouring grids (context only)">
        <Unfold
          id="neighbours-unfold"
          label="13¢"
          plain={<p className="desk-takeaway">{COMPUTE_NEIGHBOURS.plain}</p>}
          technical={COMPUTE_NEIGHBOURS.technical}
          sources={[DESK_SOURCES.hqDataCentreTariff, DESK_SOURCES.aesoCap]}
        />
      </DeskSection>

      <DeskSection id="honesty" title="What we have not proven">
        <ul className="desk-rule-list">
          {COMPUTE_HONESTY.map((line, i) => (
            <li key={line}>
              <span className="n">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-[15px] text-[var(--ink-2)]">{line}</span>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-sm leading-relaxed text-[var(--ink-3)]">
          Calm public precision. No reserved megawatts. No invented wind company. Partners would own
          any steel. Open People stays outside the agreement, constituent and catalyst only.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/engage" className="btn-primary">
            Get involved — keep firm power here
          </Link>
          <Link href="/industries" className="btn-secondary">
            Back to industries
          </Link>
        </div>
      </DeskSection>
    </DeskPage>
  );
}
