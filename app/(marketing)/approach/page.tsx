import type { Metadata } from "next";
import Link from "next/link";
import { DeskPage, DeskSection } from "@/components/marketing/shell";

export const metadata: Metadata = {
  title: "Approach",
  description:
    "Capital model, evidence rules, and operating doctrine for Open People’s in-province power campaign. Mining first; compute as a named use.",
};

const SECTIONS = [
  {
    id: "capital",
    num: "01",
    title: "Capital model: partners own the steel",
    body: [
      "Partners own hyperscale construction, interconnect, and GPU fleets.",
      "Open People is a constituent and catalyst voice: narrative, government relations, and, if partners build capacity, a sovereignty and AI software layer plus optional promote or a small financeable micro-node floor. We are not a party to the agreement, an offtake seat, or a demand seat.",
      "We do not lead with balance-sheet steel. We lead with in-province use of firm power, then bankable demand if the architecture allows it.",
    ],
  },
  {
    id: "evidence",
    num: "02",
    title: "Evidence before narrative",
    body: [
      "Every public claim maps to an audited validity pack (CER, NL Hydro, IRC, and related primary sources).",
      "If it is not sourced, we do not say it on the open web.",
      "Inversion and kill-tests run before major resource bets expand.",
    ],
  },
  {
    id: "wont",
    num: "03",
    title: "What we will not do",
    body: [
      "No crypto mining as the product story, permanently. Newfoundland’s last data-centre memory is a cautionary tale; we do not revive it.",
      "Never lead with “cheap power.” We lead with firm in-province power for industry, jobs, and federal co-investment. Arbitrage framing loses this argument.",
      "Mining and resources first. Compute alongside critical minerals, not against them. Shared transmission and shared community benefits.",
      "Indigenous engagement is first-class: an equity conversation from day one, not a consultation footnote at the end.",
    ],
  },
  {
    id: "hospitality",
    num: "04",
    title: "Hospitality and compliance",
    body: [
      "Coalition partners, engineers, capital, and advisors may be hosted at our table.",
      "Ministers and public officials get briefings in their offices, not dinners. That line is deliberate under provincial and federal lobbying and conflict-of-interest rules.",
    ],
  },
  {
    id: "geography",
    num: "05",
    title: "Geography",
    body: [
      "Labrador (or Labrador-powered) is the power story.",
      "St. John’s is the relationship and product-proof base.",
      "We do not confuse island retail rates with Labrador industrial reality, and we verify rates with primary sources before any commercial claim.",
    ],
  },
];

export default function ApproachPage() {
  return (
    <DeskPage
      kicker="Approach"
      title="How we work, and how we ask others to work with us."
      lede={
        <p>
          Open People runs a multi-year campaign, not a one-deck fundraise. The public face of that
          campaign is keeping firm Churchill Falls / Gull Island power in Newfoundland and Labrador
          for industry. Compute is a use of that power, not the opener. These rules are public so
          partners and officials can hold us to them.
        </p>
      }
      verified={false}
      sections={SECTIONS.map((s) => ({ id: s.id, label: s.title }))}
    >
      {SECTIONS.map((s) => (
        <DeskSection key={s.id} id={s.id} num={s.num} title={s.title}>
          <ul className="desk-rule-list">
            {s.body.map((line, i) => (
              <li key={line}>
                <span className="n">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[15px] leading-relaxed text-[var(--ink-2)]">{line}</span>
              </li>
            ))}
          </ul>
        </DeskSection>
      ))}
      <DeskSection id="cta">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/engage" className="btn-primary">
            Get involved — keep firm power here
          </Link>
          <Link href="/brief" className="btn-secondary">
            Public evidence brief
          </Link>
        </div>
      </DeskSection>
    </DeskPage>
  );
}
