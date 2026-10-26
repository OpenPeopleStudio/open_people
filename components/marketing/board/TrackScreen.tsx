import Link from "next/link";
import { DeskPage, DeskSection } from "@/components/marketing/shell";
import { Dual } from "@/components/marketing/voice/Dual";
import { entryLabel, statusFor, trackById, type TrackId } from "@/lib/board";
import { VISION_SECTIONS } from "@/lib/marketing/vision";
import { deskMetadata } from "@/lib/og/metadata";
import { BoardLog, WorkTrack } from "./EntryBlock";

const RESEARCH = VISION_SECTIONS.find((section) => section.id === "research");

export function trackMetadata(id: TrackId) {
  const track = trackById(id);
  return deskMetadata({
    title: track.label,
    description: `${track.job} Proposed. In feasibility.`,
    path: `/${id}`,
  });
}

export function TrackScreen({ id }: { id: TrackId }) {
  const track = trackById(id);
  const status = statusFor(id);
  return (
    <DeskPage
      kicker={`Open People · ${track.label}`}
      title={track.job}
      lede={
        status ? (
          <Dual plain={<p>{status.plain}</p>} technical={<p>{status.technical}</p>} />
        ) : (
          <p>Nothing public has been cleared onto this track.</p>
        )
      }
      meta={
        status ? (
          <p className="desk-fact text-[var(--ink-3)]">
            <time dateTime={status.cleared}>{status.cleared}</time>
            <span aria-hidden> · </span>
            {entryLabel(status)}
          </p>
        ) : null
      }
      verified={false}
      sections={[
        { id: "log", label: "Log" },
        ...(id === "build" ? [{ id: "research", label: "Research campus" }] : []),
        { id: "records", label: "Records" },
        { id: "enter", label: "Enter" },
      ]}
    >
      <DeskSection id="log" num="01 — Log" title="Cleared for the public record.">
        <BoardLog track={id} />
      </DeskSection>

      {id === "build" && RESEARCH ? (
        <DeskSection id="research" num="02 — Research campus" title={RESEARCH.title}>
          <Dual plain={<p className="desk-body">{RESEARCH.plain}</p>} technical={<p className="desk-body">{RESEARCH.technical}</p>} />
        </DeskSection>
      ) : null}

      <DeskSection
        id="records"
        num={id === "build" ? "03 — Records" : "02 — Records"}
        title="The record behind this track."
      >
        {track.records.length === 0 ? (
          <p className="desk-body">This track page is the record until a figure or a named party is cleared onto it.</p>
        ) : (
          <ul className="board-records">
            {track.records.map((record) => (
              <li key={record.href}>
                <Link href={record.href} className="board-record">
                  {record.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DeskSection>

      <DeskSection id="enter" num={id === "build" ? "04 — Enter" : "03 — Enter"} title="Work this track.">
        <p className="desk-body">
          Write to Tom Lane. Say who you are, and what you are offering or asking.
        </p>
        <div className="board-enter-block">
          <WorkTrack track={track} className="btn-primary" />
          <a href="mailto:tom@openpeople.ai" className="board-mail">
            tom@openpeople.ai
          </a>
        </div>
      </DeskSection>
    </DeskPage>
  );
}
