import { COMPUTE_HERO } from "@/lib/desk";
import type { BoardEntry } from "./types";

/**
 * Public log. File order within one cleared date is chronological:
 * later in this array is the newer clearance.
 * Seeds restate what the site already said on 2026-10-14.
 * A later bump of DESK_VERIFIED does not move these dates.
 */
export const BOARD_ENTRIES: readonly BoardEntry[] = [
  {
    id: "build-campus",
    track: "build",
    cleared: "2026-10-14",
    plain: COMPUTE_HERO.plain,
    technical: COMPUTE_HERO.technical,
    kind: "company",
    sources: [],
  },
  {
    id: "build-feasibility-record",
    track: "build",
    cleared: "2026-10-26",
    plain:
      "The Build track now has a feasibility work record. Near-term work is feasibility on costs and impact. Phase 1 is a written request to NL Hydro and a non-firm, interruptible pilot. No megawatts are reserved.",
    technical:
      "Public Build record: /feasibility. Restates proposed / in feasibility. Phase 1 written request to NL Hydro; non-firm interruptible pilot; no reserved megawatts. Company kind; empty sources until an external fact is cleared.",
    kind: "company",
    sources: [],
  },
  {
    id: "capital-partner",
    track: "capital",
    cleared: "2026-10-14",
    plain: "Capital is a proposed partner. No funder is named. Nothing is signed.",
    technical:
      "Partnership category: capital. That is a proposed structure, not a named funder and not a signed commitment.",
    kind: "company",
    sources: [],
  },
  {
    id: "capital-funding-record",
    track: "capital",
    cleared: "2026-10-26",
    plain:
      "The Capital track now has a funding stance record. Capital stays a proposed partner. No funder is named. Nothing is signed.",
    technical:
      "Public Capital record: /funding. Restates the proposed-partner stance. No named funder, no funding ask, no money figures. Company kind; empty sources until an external fact is cleared.",
    kind: "company",
    sources: [],
  },
  {
    id: "consent-first",
    track: "consent",
    cleared: "2026-10-14",
    plain: "Indigenous partnership comes first. No agreement is claimed.",
    technical:
      "Proposed partners include Indigenous nations, consent first. No impact-benefit agreement is signed. No meeting is claimed on this track.",
    kind: "company",
    sources: [],
  },
  {
    id: "consent-partnership-record",
    track: "consent",
    cleared: "2026-10-26",
    plain:
      "The Consent track now has a partnership stance record. Indigenous partnership comes first. No agreement is claimed.",
    technical:
      "Public Consent record: /partnership. Restates consent first. No impact-benefit agreement, no meeting claimed, no nation asked. Company kind; empty sources until an external fact is cleared.",
    kind: "company",
    sources: [],
  },
  {
    id: "power-proponent",
    track: "power",
    cleared: "2026-10-14",
    plain:
      "Open People is not a party to the Churchill Falls agreement. We lead the proposed campus, in feasibility. Mines and existing industry are real constraints on the same power.",
    technical:
      "Open People is the proponent of the campus and is not a party to the Churchill Falls / Gull Island framework. No allocation is signed. Mines and existing industry remain real constraints on Labrador firm power.",
    kind: "company",
    sources: [],
  },
];
