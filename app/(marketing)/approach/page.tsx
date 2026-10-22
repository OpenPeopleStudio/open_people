import type { Metadata } from "next";
import Link from "next/link";
import { DeskPage, DeskSection } from "@/components/marketing/shell";

export const metadata: Metadata = {
  title: "Approach",
  description:
    "How Open People works: we lead a proposed 500 MW Labrador campus and a research campus, in feasibility. Consent first. Mines are a real constraint.",
};

const SECTIONS = [
  {
    id: "capital",
    num: "01",
    title: "Capital model: Open People leads",
    body: [
      "Open People is the proponent of a proposed 500 MW Labrador AI campus and a research campus.",
      "Proposed partners: NL Hydro, Indigenous nations (consent first), and capital. None of those is a signed allocation, a signed impact-benefit agreement, or a named funder.",
      "We are not a party to the Churchill Falls / Gull Island framework. We lead the campus. Proposed. In feasibility. Not approved, not funded, not under construction.",
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
      "Never lead with “cheap power.” We lead with firm in-province power for industry, jobs, and a campus that has to live with mines as a real constraint. Arbitrage framing loses this argument.",
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
          Open People leads a proposed 500 MW Labrador campus and a research campus. The Churchill
          River desk is the public evidence on the power. These rules are public so Hydro, nations,
          and capital can hold us to them.
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
