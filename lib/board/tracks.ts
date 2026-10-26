import type { Track, TrackId } from "./types";
import { TRACK_ORDER } from "./types";

const MAIL = "tom@openpeople.ai";

function trackMailto(label: string): { subject: string; mailto: string } {
  const subject = `Open People — ${label}`;
  const body = `Who you are:\n\nWhat you are offering or asking:\n\nTrack: ${label}`;
  const mailto = `mailto:${MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return { subject, mailto };
}

function defineTrack(
  id: TrackId,
  label: string,
  job: string,
  records: Track["records"],
): Track {
  return { id, label, job, records, ...trackMailto(label) };
}

export const TRACKS: readonly Track[] = [
  defineTrack("build", "Build", "The campus and the research campus.", [
    { href: "/compute", label: "Compute plan" },
    { href: "/feasibility", label: "Feasibility work" },
  ]),
  defineTrack("capital", "Capital", "The money for the project.", [
    { href: "/funding", label: "Funding stance" },
  ]),
  defineTrack("consent", "Consent", "Indigenous partnership.", [
    { href: "/partnership", label: "Partnership stance" },
  ]),
  defineTrack("power", "Power", "Power for the campus.", [
    { href: "/tracker", label: "Tracker" },
    { href: "/industries", label: "Industries" },
    { href: "/costs", label: "Costs" },
    { href: "/brief", label: "Brief" },
    { href: "/letter", label: "Letter" },
    { href: "/engage", label: "Engage" },
  ]),
];

export function trackById(id: TrackId): Track {
  const track = TRACKS.find((item) => item.id === id);
  if (!track) {
    throw new Error(`Unknown track: ${id}`);
  }
  return track;
}

export function isTrackId(value: string): value is TrackId {
  return (TRACK_ORDER as readonly string[]).includes(value);
}
