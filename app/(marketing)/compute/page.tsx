import Link from "next/link";
import { DeskPage, DeskSection } from "@/components/marketing/shell";
import { Unfold } from "@/components/marketing/depth";
import {
  COMPUTE_HONESTY,
  COMPUTE_LAST_VERIFIED,
  COMPUTE_NEIGHBOURS,
  COMPUTE_PAGE_PLAIN,
  COMPUTE_PAGE_TECHNICAL,
  COMPUTE_RULES,
  DESK_SOURCES,
} from "@/lib/desk";
import { deskMetadata } from "@/lib/og/metadata";
import { VISION_CONTACT } from "@/lib/marketing/vision";

export const metadata = {
  ...deskMetadata({
    title: "Churchill Falls data centre",
    description:
      "Open People leads a proposed 500 MW Labrador data centre, in feasibility, and a research campus. Mining comes first. Not approved, not funded, and not under construction.",
    path: "/compute",
    robots: { index: true, follow: true },
  }),
  keywords: [
    "Churchill Falls",
    "Churchill Falls data centre",
    "Labrador data centre",
    "Newfoundland and Labrador",
    "Gull Island",
    "Open People",
  ],
};

export default function ComputePage() {
  return (
    <DeskPage
      quiet
      verified={COMPUTE_LAST_VERIFIED}
      parent={{ label: "Build", href: "/build" }}
      kicker="Proposed campus · in feasibility"
      title="Open People leads a 500 MW Labrador AI campus."
      lede={
        <Unfold
          id="compute-lede"
          label="500 MW"
          plain={<p>{COMPUTE_PAGE_PLAIN}</p>}
          technical={COMPUTE_PAGE_TECHNICAL}
        />
      }
      meta={
        <p className="text-sm text-[var(--ink-3)]">
          Not approved. Not funded. Not under construction. Mining comes first. The public case is{" "}
          <Link href="/brief" className="desk-link">
            the brief
          </Link>
          . The thesis is{" "}
          <Link href="/about" className="desk-link">
            /about
          </Link>
          . The track is{" "}
          <Link href="/build" className="desk-link">
            /build
          </Link>
          .
        </p>
      }
      sections={[
        { id: "rules", label: "Three facts" },
        { id: "research", label: "Research campus" },
        { id: "neighbours", label: "Neighbouring grids" },
        { id: "honesty", label: "Not proven" },
      ]}
    >
      <DeskSection id="rules" wide>
        <div className="compute-rules">
          {COMPUTE_RULES.map((rule, index) => (
            <section key={rule.title} className="desk-surface p-5 sm:p-6" data-rise>
              <p className="desk-kicker">{String(index + 1).padStart(2, "0")}</p>
              <h2 className="desk-h3 mt-3">{rule.title}</h2>
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

      <DeskSection id="research" title="A research campus beside it">
        <p className="desk-takeaway">
          Open People also leads a proposed research campus: residencies, fellowships, gatherings.
          People from across Canada, on the problems society will face in the age of AI. In the
          spirit of the Perimeter Institute and the Banff Centre — named as spirit, not as partners.
        </p>
        <Link href="/build" className="desk-kicker mt-6 inline-flex no-underline hover:underline">
          Build track →
        </Link>
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
          Open People leads. Proposed. In feasibility. No reserved megawatts. No named customers.
          We intend to seek early, respectful engagement with each nation. No partnership or
          agreement exists. Partnership, if any, is on terms each nation sets. This page does not
          jump the line: mines and existing industry remain the constraint, and the public ask is to
          keep firm power in the province.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/engage" className="btn-primary">
            Keep firm power here
          </Link>
          <a href={`mailto:${VISION_CONTACT}`} className="btn-secondary">
            {VISION_CONTACT}
          </a>
          <Link href="/build" className="btn-secondary">
            Build track
          </Link>
        </div>
      </DeskSection>
    </DeskPage>
  );
}
