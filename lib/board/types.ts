import type { DeskSourceId } from "@/lib/desk";

export const TRACK_ORDER = ["build", "capital", "consent", "power"] as const;

export type TrackId = (typeof TRACK_ORDER)[number];

export type EntryKind = "company" | "external";

export type BoardEntry = {
  id: string;
  track: TrackId;
  /** Date Tom cleared this sentence for the public record. YYYY-MM-DD. */
  cleared: string;
  plain: string;
  technical: string;
  kind: EntryKind;
  sources: DeskSourceId[];
};

export type TrackRecord = {
  href: string;
  label: string;
};

export type Track = {
  id: TrackId;
  label: string;
  job: string;
  records: TrackRecord[];
  subject: string;
  mailto: string;
};
