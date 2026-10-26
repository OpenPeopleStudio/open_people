import Link from "next/link";
import { DeskPage, DeskSection } from "@/components/marketing/shell";
import { Unfold } from "@/components/marketing/depth";
import { CONSENT_HERO, CONSENT_LAST_VERIFIED, CONSENT_SECTIONS } from "@/lib/desk";
import { deskMetadata } from "@/lib/og/metadata";
import { VISION_CONTACT } from "@/lib/marketing/vision";

export const metadata = deskMetadata({
  title: "Partnership stance",
  description:
    "Indigenous partnership comes first. No agreement is claimed. Partnership, if any, is on terms each nation sets. No nation has been asked about this project.",
  path: "/partnership",
  robots: { index: true, follow: true },
});

export default function PartnershipPage() {
  return (
    <DeskPage
      quiet
      verified={CONSENT_LAST_VERIFIED}
      parent={{ label: "Consent", href: "/consent" }}
      kicker="Partnership stance · consent first"
      title="Indigenous partnership comes first. No agreement is claimed."
      lede={
        <Unfold
          id="partnership-lede"
          label="Consent"
          plain={<p>{CONSENT_HERO.plain}</p>}
          technical={CONSENT_HERO.technical}
        />
      }
      meta={
        <p className="text-sm text-[var(--ink-3)]">
          No nation named as a partner. The track is{" "}
          <Link href="/consent" className="desk-link">
            /consent
          </Link>
          . How we work is on{" "}
          <Link href="/about" className="desk-link">
            /about
          </Link>
          .
        </p>
      }
      sections={CONSENT_SECTIONS.map((section) => ({
        id: section.id,
        label: section.title,
      }))}
    >
      {CONSENT_SECTIONS.map((section) => (
        <DeskSection key={section.id} id={section.id} title={section.title}>
          <Unfold
            id={`partnership-${section.id}`}
            plain={<p className="desk-takeaway">{section.body.plain}</p>}
            technical={section.body.technical}
          />
          {section.id === "enter" ? (
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a
                href="mailto:tom@openpeople.ai?subject=Open%20People%20%E2%80%94%20Consent"
                className="btn-primary"
              >
                Work the Consent track
              </a>
              <a href={`mailto:${VISION_CONTACT}`} className="btn-secondary">
                {VISION_CONTACT}
              </a>
              <Link href="/consent" className="btn-secondary">
                Consent track
              </Link>
            </div>
          ) : null}
        </DeskSection>
      ))}
    </DeskPage>
  );
}
