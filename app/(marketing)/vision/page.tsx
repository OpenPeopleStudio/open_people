import type { Metadata } from "next";
import { DeskPage } from "@/components/marketing/shell";
import {
  VISION_CANONICAL,
  VISION_DESCRIPTION,
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
  return (
    <p className="text-[16px] leading-[1.62] text-[var(--text-secondary)] sm:text-[17px]">
      {children}
    </p>
  );
}

export default function VisionPage() {
  const rest = VISION_SENTENCES.slice(1).join(" ");

  return (
    <DeskPage
      kicker="Vision"
      title={
        <>
          People who care for this land should <em>prosper from it</em>.
        </>
      }
      verified={false}
      singleVoice
    >
      <article className="desk-prose pb-16 pt-12 sm:pb-24 sm:pt-16">
        <div className="space-y-5">
          <Body>{rest}</Body>
        </div>
        <p className="mt-12 font-mono text-[12px] leading-relaxed text-[var(--text-muted)]">
          Tom Lane
        </p>
      </article>
    </DeskPage>
  );
}
