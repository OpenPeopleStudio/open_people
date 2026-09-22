import type { Metadata } from "next";
import Link from "next/link";
import { DeskPage, DeskSection } from "@/components/marketing/shell";
import { Term } from "@/components/marketing/depth";

export const metadata: Metadata = {
  title: "About",
  description:
    "Open People is a Newfoundland and Labrador constituent voice for keeping Churchill Falls / Gull Island firm power in-province. Catalyst, not hyperscale steel. Not a party to the agreement.",
};

export default function AboutPage() {
  return (
    <DeskPage
      kicker="About"
      title="A Newfoundland company on the Labrador power story."
      lede={
        <p>
          Open People is a constituent and catalyst voice for keeping firm Churchill Falls / Gull
          Island power in Newfoundland and Labrador. Mining and Labrador industry first.{" "}
          <Term k="compute">Compute</Term> is a named use of that power, not a reserved block, and
          not a seat at the deal table.
        </p>
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
            We are not a party to the <Term k="dcia">DCIA</Term>, an offtake seat, or a demand
            seat. We are not raising to buy a hyperscale data centre. The public work is{" "}
            <strong className="text-[var(--ink)]">in-province use</strong> and{" "}
            <strong className="text-[var(--ink)]">transparency</strong> while the framework is still
            a framework. If partners later build capacity, Open People&apos;s role is the{" "}
            <strong className="text-[var(--ink)]">software layer</strong>, while infrastructure
            partners carry construction and GPU balance sheets.
          </p>
          <p>
            That stance is deliberate. Capital reality killed the “raise to own the steel” path. The
            durable position is catalyst, not principal ownership of billion-dollar shells.
          </p>
          <p>
            The company is based in <strong className="text-[var(--ink)]">St. John&apos;s</strong>.
            Founder Tom Lane also built and operates{" "}
            <strong className="text-[var(--ink)]">Snow White Laundry</strong> on Water Street, a live
            operator record and, under strict rules, a hospitality setting for coalition partners
            (not for public officials).
          </p>
        </div>
      </DeskSection>

      <DeskSection id="facts">
        <div className="border-l-2 border-[var(--plasma)] bg-[var(--plasma-soft)] p-5 sm:p-6">
          <p className="desk-kicker">Public facts only</p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--ink-2)]">
            Energy figures on this site map to Canada Energy Regulator, NL Hydro, and Independent
            Review Committee materials. We do not invent rates. Claims that are unproven stay labelled
            as work, not settled fact. Every number carries its source and a last-verified date.
          </p>
        </div>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/engage" className="btn-primary">
            Get involved — keep firm power here
          </Link>
          <Link href="/brief" className="btn-secondary">
            Read the public case
          </Link>
        </div>
      </DeskSection>
    </DeskPage>
  );
}
