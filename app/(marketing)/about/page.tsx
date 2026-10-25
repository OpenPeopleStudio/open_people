import type { Metadata } from "next";
import Link from "next/link";
import { DeskPage, DeskSection } from "@/components/marketing/shell";
import { Dual } from "@/components/marketing/voice/Dual";
import { VISION_CONTACT } from "@/lib/marketing/vision";

export const metadata: Metadata = {
  title: "About",
  description:
    "Open People is a Newfoundland and Labrador company working to keep firm Churchill Falls / Gull Island power in the province. Mining first. We lead a proposed 500 MW Labrador campus, in feasibility.",
};

export default function AboutPage() {
  return (
    <DeskPage
      kicker="Open People · About"
      title={
        <>
          Open People is working <em>on Churchill Falls.</em>
        </>
      }
      lede={
        <Dual
          plain={
            <p>
              Open People is a Newfoundland and Labrador company. We are working to keep firm
              Churchill Falls and Gull Island power in the province, for industry that already lives
              here. Mining comes first. We also lead a proposed 500 MW AI data campus in Labrador,
              and a research campus beside it. Proposed. In feasibility. Not approved, not funded,
              not under construction.
            </p>
          }
          technical={
            <p>
              Open People is the proponent of the campus, not a party to the Churchill Falls / Gull
              Island framework. Proposed partners are NL Hydro, Indigenous nations — consent first —
              and capital. That structure is proposed, not signed. No customers are named. Mines and
              existing industry are real constraints on Labrador firm power. The public case is the{" "}
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
        { id: "stance", label: "What we are doing" },
        { id: "now", label: "Why now" },
        { id: "facts", label: "Public facts only" },
      ]}
    >
      <DeskSection id="stance" title="What we are doing">
        <div className="space-y-5 desk-body">
          <p>
            Two pieces of work, in that order. First, keep firm in-province power written down for
            loads that live here — mines, towns, and other Labrador industry. Second, lead a proposed
            campus on that power: the 500 MW AI data campus and the research campus. Consent with
            Indigenous nations comes first. Capital comes in as a partner, unnamed here. NL Hydro is
            a proposed partner for power and site — not a signed allocation.
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

      <DeskSection id="now" title="Why now, and what you can do">
        <div className="space-y-5 desk-body">
          <p>
            The House has endorsed a framework. The contracts that lock the power are not signed.
            Unused retained power already has a buyer written into the paper if nobody defines what
            “used here” means. That is the window, and it is why the file is public.
          </p>
          <p>
            Read the case. Write your MHA. Or write Tom directly. Compute is a named use on its own
            page. It is not where we start.
          </p>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/engage" className="btn-primary">
            Get involved — keep firm power here
          </Link>
          <Link href="/brief" className="btn-secondary">
            Public brief
          </Link>
        </div>
      </DeskSection>

      <DeskSection id="facts" title="What we will not invent">
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
          <Link href="/compute" className="btn-secondary">
            The proposed campus
          </Link>
        </div>
      </DeskSection>
    </DeskPage>
  );
}
