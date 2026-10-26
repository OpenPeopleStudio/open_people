import { describe, expect, it } from "vitest";
import { COMPUTE_HERO } from "@/lib/desk";
import {
  BOARD_ENTRIES,
  TRACKS,
  allEntries,
  entriesFor,
  statusFor,
  type BoardEntry,
} from "@/lib/board";

const BANNED = [
  /ACOA/i,
  /\$/,
  /SpaceX|xAI/i,
  /Brendan/i,
  /sn[oō]w white/i,
  /\bSWL\b/,
  /Water Street/i,
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  /\b281\b/,
];

function entry(partial: Pick<BoardEntry, "id" | "track" | "cleared"> & Partial<BoardEntry>): BoardEntry {
  return {
    plain: partial.id,
    technical: partial.id,
    kind: "company",
    sources: [],
    ...partial,
  };
}

describe("project board", () => {
  it("lists four tracks in order", () => {
    expect(TRACKS.map((track) => track.id)).toEqual(["build", "capital", "consent", "power"]);
    expect(TRACKS.map((track) => track.job)).toEqual([
      "The campus and the research campus.",
      "The money for the project.",
      "Indigenous partnership.",
      "Power for the campus.",
    ]);
  });

  it("uses the newest entry as status and does not borrow across tracks", () => {
    const rows = [
      entry({ id: "old", track: "build", cleared: "2026-01-01" }),
      entry({ id: "new", track: "build", cleared: "2026-02-01" }),
      entry({ id: "other", track: "power", cleared: "2026-03-01" }),
    ];
    expect(statusFor("build", rows)?.id).toBe("new");
    expect(statusFor("capital", rows)).toBeNull();
    expect(entriesFor("power", rows).map((row) => row.id)).toEqual(["other"]);
  });

  it("sorts by cleared date, then later in the file first", () => {
    const rows = [
      entry({ id: "early", track: "build", cleared: "2026-10-14" }),
      entry({ id: "later-same-day", track: "capital", cleared: "2026-10-14" }),
      entry({ id: "next-day", track: "consent", cleared: "2026-10-15" }),
    ];
    expect(allEntries(rows).map((row) => row.id)).toEqual([
      "next-day",
      "later-same-day",
      "early",
    ]);
    expect(statusFor("build", rows)?.id).toBe("early");
  });

  it("requires plain, technical, and sources on external entries", () => {
    for (const row of BOARD_ENTRIES) {
      expect(row.plain.length).toBeGreaterThan(0);
      expect(row.technical.length).toBeGreaterThan(0);
      if (row.kind === "external") {
        expect(row.sources.length).toBeGreaterThan(0);
      }
    }
  });

  it("states consent without naming a nation as a partner", () => {
    const consent = statusFor("consent");
    expect(consent?.plain).toBe(
      "Partnership, if any, will be on terms each nation sets. No nation has been asked about this project. No agreement is claimed.",
    );
    expect(consent?.technical).toBe(
      "Partnership, if any, will be on terms each nation sets. No nation has been asked about this project. ISED lists Indigenous participation as one of its criteria. Any role is for each nation to decide. No impact-benefit agreement is signed. No meeting is claimed on this track.",
    );
    expect(`${consent?.plain}\n${consent?.technical}`).not.toMatch(/Proposed partners/i);
  });

  it("seeds the build track with the public feasibility line", () => {
    const build = statusFor("build");
    expect(build?.kind).toBe("company");
    expect(build?.plain).toBe(COMPUTE_HERO.plain);
    expect(build?.plain).toMatch(/proposed/i);
    expect(build?.plain).toMatch(/feasibility/i);
    expect(build?.plain).toMatch(/not approved/i);
    expect(build?.plain).toMatch(/not funded/i);
    expect(build?.plain).toMatch(/not under construction/i);
    expect(build?.plain).not.toMatch(/This page is the campus/);
  });

  it("keeps seed text inside the vision bans", () => {
    const blob = BOARD_ENTRIES.map((row) => `${row.plain}\n${row.technical}`).join("\n");
    for (const pattern of BANNED) {
      expect(blob).not.toMatch(pattern);
    }
    expect(BOARD_ENTRIES.map((row) => row.cleared)).toEqual([
      "2026-10-14",
      "2026-10-14",
      "2026-10-14",
      "2026-10-14",
    ]);
  });

  it("addresses each track in its own mail subject", () => {
    expect(TRACKS.map((track) => track.subject)).toEqual([
      "Open People — Build",
      "Open People — Capital",
      "Open People — Consent",
      "Open People — Power",
    ]);
    for (const track of TRACKS) {
      expect(track.mailto.startsWith("mailto:tom@openpeople.ai?")).toBe(true);
      expect(decodeURIComponent(track.mailto)).toContain(track.subject);
      expect(decodeURIComponent(track.mailto)).toContain(`Track: ${track.label}`);
    }
  });
});
