import Link from "next/link";
import { Dual } from "@/components/marketing/voice/Dual";
import {
  EMPTY_TRACK_LINE,
  TRACKS,
  allEntries,
  entryLabel,
  statusFor,
  type BoardEntry,
  type Track,
  type TrackId,
} from "@/lib/board";

export function WorkTrack({
  track,
  className,
}: {
  track: Track;
  className?: string;
}) {
  return (
    <a className={className} href={track.mailto}>
      Work this track
    </a>
  );
}

function StatusCopy({ entry }: { entry: BoardEntry | null }) {
  if (!entry) {
    return <p>{EMPTY_TRACK_LINE}</p>;
  }
  return (
    <Dual
      plain={<p>{entry.plain}</p>}
      technical={<p>{entry.technical}</p>}
    />
  );
}

export function TrackRows() {
  return (
    <div className="board-list">
      {TRACKS.map((track) => {
        const status = statusFor(track.id);
        return (
          <article key={track.id} className="board-row">
            <div>
              <h2 className="desk-h3">
                <Link href={`/${track.id}`} className="board-name">
                  {track.label}
                </Link>
              </h2>
              <p className="board-job">{track.job}</p>
            </div>
            <div className="board-status">
              <StatusCopy entry={status} />
              {status ? (
                <p className="desk-fact mt-3 text-[var(--ink-3)]">
                  <time dateTime={status.cleared}>{status.cleared}</time>
                  <span aria-hidden> · </span>
                  {entryLabel(status)}
                </p>
              ) : null}
            </div>
            <WorkTrack track={track} className="board-enter" />
          </article>
        );
      })}
    </div>
  );
}

export function BoardLog({ track }: { track?: TrackId }) {
  const entries = track ? allEntries().filter((entry) => entry.track === track) : allEntries();
  if (entries.length === 0) {
    return <p className="desk-body">{EMPTY_TRACK_LINE}</p>;
  }
  return (
    <ol className="board-log">
      {entries.map((entry) => (
        <li key={entry.id}>
          <p className="desk-fact text-[var(--ink-3)]">
            <time dateTime={entry.cleared}>{entry.cleared}</time>
            <span aria-hidden> · </span>
            {entryLabel(entry)}
            {track ? null : (
              <>
                <span aria-hidden> · </span>
                {TRACKS.find((item) => item.id === entry.track)?.label}
              </>
            )}
          </p>
          <div className="mt-2 text-[15px] leading-relaxed text-[var(--ink-2)]">
            <Dual plain={<p>{entry.plain}</p>} technical={<p>{entry.technical}</p>} />
          </div>
        </li>
      ))}
    </ol>
  );
}
