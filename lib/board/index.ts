import { DESK_SOURCES } from "@/lib/desk";
import { BOARD_ENTRIES } from "./entries";
import type { BoardEntry, TrackId } from "./types";

export const EMPTY_TRACK_LINE = "Nothing public has been cleared onto this track.";

export { BOARD_ENTRIES } from "./entries";
export { TRACKS, isTrackId, trackById } from "./tracks";
export { TRACK_ORDER, type BoardEntry, type EntryKind, type Track, type TrackId } from "./types";

/** Later file index is newer when the cleared date matches. */
export function allEntries(entries: readonly BoardEntry[] = BOARD_ENTRIES): BoardEntry[] {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => {
      if (a.entry.cleared !== b.entry.cleared) {
        return a.entry.cleared < b.entry.cleared ? 1 : -1;
      }
      return b.index - a.index;
    })
    .map(({ entry }) => entry);
}

export function entriesFor(
  track: TrackId,
  entries: readonly BoardEntry[] = BOARD_ENTRIES,
): BoardEntry[] {
  return allEntries(entries).filter((entry) => entry.track === track);
}

export function statusFor(
  track: TrackId,
  entries: readonly BoardEntry[] = BOARD_ENTRIES,
): BoardEntry | null {
  return entriesFor(track, entries)[0] ?? null;
}

export function entryLabel(entry: BoardEntry): string {
  if (entry.kind === "company") return "Open People";
  return entry.sources.map((id) => DESK_SOURCES[id].label).join(" · ");
}
