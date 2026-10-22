import type { Metadata } from "next";
import Link from "next/link";
import { DeskPage, DeskSection } from "@/components/marketing/shell";
import { Dual } from "@/components/marketing/voice/Dual";
import {
  VISION_CANONICAL,
  VISION_CONTACT,
  VISION_DESCRIPTION,
  VISION_HEADLINE_EMPHASIS,
  VISION_HEADLINE_LEAD,
  VISION_LEDE,
  VISION_SECTIONS,
  VISION_SENTENCES,
  VISION_TITLE,
} from "@/lib/marketing/vision";

export const metadata: Metadata = {
  title: { absolute: VISION_TITLE },
  description: VISION_DESCRIPTION,
  alternates: { canonical: VISION_CANONICAL },
  openGraph: {
    title: VISION_TITLE,
    description: VISION_DESCRIPTION,
    type: "article",
    url: VISION_CANONICAL,
    locale: "en_CA",
    authors: ["Tom Lane"],
  },
  twitter: {
    card: "summary_large_image",
    title: VISION_TITLE,
    description: VISION_DESCRIPTION,
  },
};

function Body({ children }: { children: React.ReactNode }) {
  return <p className="desk-takeaway">{children}</p>;
}

export default function VisionPage() {
  return (
    <DeskPage
      kicker="Vision · Open People"
      title={
        <>
          {VISION_HEADLINE_LEAD} <em>{VISION_HEADLINE_EMPHASIS}</em>.
        </>
      }
      lede={
        <Dual
          plain={<p>{VISION_LEDE.plain}</p>}
          technical={<p>{VISION_LEDE.technical}</p>}
        />
      }
      verified={false}
      actions={
        <>
          <a href={`mailto:${VISION_CONTACT}`} className="btn-primary">
            {VISION_CONTACT}
          </a>
          <Link href="/brief" className="btn-secondary">
            Churchill River desk
          </Link>
        </>
      }
      sections={VISION_SECTIONS.map((s) => ({ id: s.id, label: s.title }))}
    >
      {VISION_SECTIONS.map((section) => (
        <DeskSection key={section.id} id={section.id} num={section.num} title={section.title}>
          <Dual
            plain={<Body>{section.plain}</Body>}
            technical={<Body>{section.technical}</Body>}
          />
        </DeskSection>
      ))}

      <DeskSection id="close">
        <aside className="border-l-2 border-[var(--plasma)] bg-[var(--plasma-soft)] p-5 sm:p-6">
          <p className="desk-kicker">Status on this page</p>
          <p className="desk-h3 mt-3">
            Proposed. In feasibility. Not approved, not funded, not under construction.
          </p>
        </aside>
        <div className="desk-prose mt-12 space-y-5">
          {VISION_SENTENCES.map((sentence) => (
            <Body key={sentence}>{sentence}</Body>
          ))}
        </div>
        <p className="mt-12 font-mono text-[12px] leading-relaxed text-[var(--text-muted)]">
          Tom Lane
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <a href={`mailto:${VISION_CONTACT}`} className="btn-primary">
            {VISION_CONTACT}
          </a>
        </div>
      </DeskSection>
    </DeskPage>
  );
}
