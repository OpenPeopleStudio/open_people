import Link from "next/link";
import { DeskPage, DeskSection } from "@/components/marketing/shell";
import { Unfold } from "@/components/marketing/depth";
import {
  FEASIBILITY_HERO,
  FEASIBILITY_LAST_VERIFIED,
  FEASIBILITY_SECTIONS,
} from "@/lib/desk";
import { deskMetadata } from "@/lib/og/metadata";
import { VISION_CONTACT } from "@/lib/marketing/vision";

export const metadata = deskMetadata({
  title: "Feasibility work",
  description:
    "Near-term work is feasibility on costs and impact. Phase 1 is a written request to NL Hydro and a non-firm, interruptible pilot. No megawatts are reserved.",
  path: "/feasibility",
  robots: { index: true, follow: true },
});

export default function FeasibilityPage() {
  return (
    <DeskPage
      quiet
      verified={FEASIBILITY_LAST_VERIFIED}
      parent={{ label: "Build", href: "/build" }}
      kicker="Feasibility work · proposed"
      title="Feasibility on costs and impact. No megawatts reserved."
      lede={
        <Unfold
          id="feasibility-lede"
          label="Phase 1"
          plain={<p>{FEASIBILITY_HERO.plain}</p>}
          technical={FEASIBILITY_HERO.technical}
        />
      }
      meta={
        <p className="text-sm text-[var(--ink-3)]">
          Not approved. Not funded. Not under construction. The campus plan is{" "}
          <Link href="/compute" className="desk-link">
            /compute
          </Link>
          . The track is{" "}
          <Link href="/build" className="desk-link">
            /build
          </Link>
          .
        </p>
      }
      sections={FEASIBILITY_SECTIONS.map((section) => ({
        id: section.id,
        label: section.title,
      }))}
    >
      {FEASIBILITY_SECTIONS.map((section) => (
        <DeskSection key={section.id} id={section.id} title={section.title}>
          <Unfold
            id={`feasibility-${section.id}`}
            plain={<p className="desk-takeaway">{section.body.plain}</p>}
            technical={section.body.technical}
          />
          {section.id === "records" ? (
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/compute" className="btn-primary">
                Compute plan
              </Link>
              <Link href="/build" className="btn-secondary">
                Build track
              </Link>
              <a href={`mailto:${VISION_CONTACT}`} className="btn-secondary">
                {VISION_CONTACT}
              </a>
            </div>
          ) : null}
        </DeskSection>
      ))}
    </DeskPage>
  );
}
