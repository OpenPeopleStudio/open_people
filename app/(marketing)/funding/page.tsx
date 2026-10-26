import Link from "next/link";
import { DeskPage, DeskSection } from "@/components/marketing/shell";
import { Unfold } from "@/components/marketing/depth";
import { CAPITAL_HERO, CAPITAL_LAST_VERIFIED, CAPITAL_SECTIONS } from "@/lib/desk";
import { deskMetadata } from "@/lib/og/metadata";
import { VISION_CONTACT } from "@/lib/marketing/vision";

export const metadata = deskMetadata({
  title: "Funding stance",
  description:
    "Capital is a proposed partner. No funder is named. Nothing is signed. Open People leads a proposed Labrador campus, in feasibility.",
  path: "/funding",
  robots: { index: true, follow: true },
});

export default function FundingPage() {
  return (
    <DeskPage
      quiet
      verified={CAPITAL_LAST_VERIFIED}
      parent={{ label: "Capital", href: "/capital" }}
      kicker="Funding stance · capital unnamed"
      title="Capital is a proposed partner. Nothing is signed."
      lede={
        <Unfold
          id="funding-lede"
          label="Capital"
          plain={<p>{CAPITAL_HERO.plain}</p>}
          technical={CAPITAL_HERO.technical}
        />
      }
      meta={
        <p className="text-sm text-[var(--ink-3)]">
          No named funder. No funding ask. The track is{" "}
          <Link href="/capital" className="desk-link">
            /capital
          </Link>
          . How we work is on{" "}
          <Link href="/about" className="desk-link">
            /about
          </Link>
          .
        </p>
      }
      sections={CAPITAL_SECTIONS.map((section) => ({
        id: section.id,
        label: section.title,
      }))}
    >
      {CAPITAL_SECTIONS.map((section) => (
        <DeskSection key={section.id} id={section.id} title={section.title}>
          <Unfold
            id={`funding-${section.id}`}
            plain={<p className="desk-takeaway">{section.body.plain}</p>}
            technical={section.body.technical}
          />
          {section.id === "enter" ? (
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a
                href="mailto:tom@openpeople.ai?subject=Open%20People%20%E2%80%94%20Capital"
                className="btn-primary"
              >
                Work the Capital track
              </a>
              <a href={`mailto:${VISION_CONTACT}`} className="btn-secondary">
                {VISION_CONTACT}
              </a>
              <Link href="/capital" className="btn-secondary">
                Capital track
              </Link>
            </div>
          ) : null}
        </DeskSection>
      ))}
    </DeskPage>
  );
}
