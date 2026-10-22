import type { Metadata } from "next";
import Link from "next/link";
import { DeskPage, DeskSection } from "@/components/marketing/shell";
import { Dual } from "@/components/marketing/voice/Dual";
import { VISION_CONTACT } from "@/lib/marketing/vision";

export const metadata: Metadata = {
  title: "About",
  description:
    "Open People leads a proposed 500 MW Labrador AI campus and a research campus, in feasibility. Mines and existing industry are real constraints on the same power.",
};

export default function AboutPage() {
  return (
    <DeskPage
      kicker="About"
      title="Open People leads a proposed Labrador campus."
      lede={
        <Dual
          plain={
            <p>
              Open People is a Newfoundland and Labrador company. We lead a proposed 500 MW AI data
              campus in Labrador, and a research campus beside it. Proposed. In feasibility. Not
              approved, not funded, not under construction.
            </p>
          }
          technical={
            <p>
              Open People is the proponent. Proposed partners are NL Hydro, Indigenous nations —
              consent first — and capital. That structure is proposed, not signed. No customers are
              named. Mines and existing industry are real constraints on Labrador firm power. The
              public evidence on the Churchill Falls / Gull Island framework lives on the{" "}
              <Link href="/brief" className="desk-link">
                brief
              </Link>
              .
            </p>
          }
        />
      }
      verified={false}
      sections={[
        { id: "stance", label: "The stance" },
        { id: "facts", label: "Public facts only" },
      ]}
    >
      <DeskSection id="stance">
        <div className="space-y-5 desk-body">
          <p>
            We are not a party to the Churchill Falls / Gull Island framework. We are the
            organisation proposing to <strong className="text-[var(--ink)]">lead the campus</strong>
            : the 500 MW AI data campus and the research campus. Consent with Indigenous nations
            comes first. Capital comes in as a partner, unnamed here. NL Hydro is a proposed
            partner for power and site — not a signed allocation.
          </p>
          <p>
            Tom Lane is the founder. Write to{" "}
            <a href={`mailto:${VISION_CONTACT}`} className="desk-link">
              {VISION_CONTACT}
            </a>
            .
          </p>
        </div>
      </DeskSection>

      <DeskSection id="facts">
        <div className="border-l-2 border-[var(--plasma)] bg-[var(--plasma-soft)] p-5 sm:p-6">
          <p className="desk-kicker">Proposed. In feasibility.</p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--ink-2)]">
            Energy figures on this site map to Canada Energy Regulator, NL Hydro, and Independent
            Review Committee materials. We do not invent rates. The 500 MW figure is an Open People
            proposal, not a reserved block. Claims that are unproven stay labelled as work, not
            settled fact.
          </p>
        </div>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <a href={`mailto:${VISION_CONTACT}`} className="btn-primary">
            {VISION_CONTACT}
          </a>
          <Link href="/vision" className="btn-secondary">
            Vision
          </Link>
        </div>
      </DeskSection>
    </DeskPage>
  );
}
