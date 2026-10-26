import type { Metadata } from "next";
import Link from "next/link";
import { DeskPage, DeskSection } from "@/components/marketing/shell";
import { Dual } from "@/components/marketing/voice/Dual";
import { TRACKS } from "@/lib/board";
import { APPROACH_LEDE, APPROACH_SECTIONS } from "@/lib/marketing/approach";
import { VISION_CONTACT, VISION_SECTIONS, VISION_SENTENCES } from "@/lib/marketing/vision";

export const metadata: Metadata = {
  title: "About our Churchill Falls work",
  description:
    "Open People is building a proposed 500 MW Labrador AI campus and a research campus, in feasibility. Tom Lane, St. John’s.",
};

const COMPANY_SECTIONS = VISION_SECTIONS.filter(
  (section) => section.id === "thesis" || section.id === "near-term",
);

export default function AboutPage() {
  return (
    <DeskPage
      kicker="About · Open People"
      title={
        <>
          People who care for this land should <em>prosper from it</em>.
        </>
      }
      lede={<p>{APPROACH_LEDE}</p>}
      verified={false}
      sections={[
        { id: "who", label: "Who" },
        ...COMPANY_SECTIONS.map((section) => ({ id: section.id, label: section.title })),
        { id: "tracks", label: "Tracks" },
        ...APPROACH_SECTIONS.map((section) => ({ id: section.id, label: section.title })),
        { id: "close", label: "Close" },
      ]}
    >
      <DeskSection id="who" num="01 — Who" title="Open People leads the proposed campus.">
        <div className="space-y-5 desk-body">
          <p>
            Open People is a Newfoundland and Labrador company. Tom Lane is the founder. We lead a
            proposed 500 MW AI data campus in Labrador, and a research campus beside it. Partnership,
            if any, will be on terms each nation sets. No nation has been asked about this project. Capital is
            unnamed here. That structure is proposed, not signed.
          </p>
          <p>
            Write to{" "}
            <a href={`mailto:${VISION_CONTACT}`} className="board-mail">
              {VISION_CONTACT}
            </a>
            .
          </p>
        </div>
      </DeskSection>

      {COMPANY_SECTIONS.map((section) => (
        <DeskSection key={section.id} id={section.id} num={section.num} title={section.title}>
          <Dual
            plain={<p className="desk-body">{section.plain}</p>}
            technical={<p className="desk-body">{section.technical}</p>}
          />
        </DeskSection>
      ))}

      <DeskSection id="tracks" title="Come in on the work.">
        <ul className="board-records">
          {TRACKS.map((track) => (
            <li key={track.id}>
              <Link href={`/${track.id}`} className="board-record">
                {track.label}
              </Link>
              <span className="desk-fact text-[var(--ink-3)]"> — {track.job}</span>
            </li>
          ))}
        </ul>
      </DeskSection>

      {APPROACH_SECTIONS.map((section) => (
        <DeskSection key={section.id} id={section.id} num={section.num} title={section.title}>
          <ul className="desk-rule-list">
            {section.body.map((line) => (
              <li key={line}>
                <span className="text-[15px] leading-relaxed text-[var(--ink-2)]">{line}</span>
              </li>
            ))}
          </ul>
        </DeskSection>
      ))}

      <DeskSection id="close" title="The close.">
        <div className="desk-prose space-y-5">
          {VISION_SENTENCES.map((sentence) => (
            <p key={sentence} className="desk-body">
              {sentence}
            </p>
          ))}
        </div>
        <p className="mt-12 font-mono text-[12px] leading-relaxed text-[var(--ink-3)]">Tom Lane</p>
        <p className="mt-4">
          <a href={`mailto:${VISION_CONTACT}`} className="board-mail">
            {VISION_CONTACT}
          </a>
        </p>
      </DeskSection>
    </DeskPage>
  );
}
