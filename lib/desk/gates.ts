import { DESK_VERIFIED, type DeskSourceId } from "./sources";
import type { DeskStatus, DeskVoice } from "./types";

/**
 * The Gate Clock. Dates are public. `kind` says how hard the date is:
 *  fixed       — happened, or fixed by statute / writ
 *  target      — a stated goal in the DCIA text
 *  preliminary — an Annex B schedule year, subject to studies
 * Nothing here is a forecast by Open People.
 */
export type GateKind = "fixed" | "target" | "preliminary";

export type Gate = {
  id: string;
  /** ISO date (local, Newfoundland) */
  date: string;
  label: string;
  short: string;
  status: DeskStatus;
  kind: GateKind;
  body: DeskVoice;
  trackerId?: string;
  sources: DeskSourceId[];
  /** Drawn beyond the rail's scale, with a break mark. */
  offscale?: boolean;
};

export const GATES_VERIFIED = DESK_VERIFIED;

export const GATES: Gate[] = [
  {
    id: "dcia",
    date: "2026-08-17",
    label: "Framework signed",
    short: "17 Aug",
    status: "framework",
    kind: "fixed",
    body: {
      plain: "The cooperation paper was signed. It is not the contracts that lock the power.",
      technical:
        "DCIA dated as of 17 August 2026: NLH, HQ, CF(L)Co. Schedule B Material Terms are the drafting basis for Definitive Agreements.",
    },
    trackerId: "dcia",
    sources: ["dciaHq", "govNlDcia"],
  },
  {
    id: "house",
    date: "2026-09-17",
    label: "House endorsed 21–18",
    short: "17 Sep",
    status: "endorsed",
    kind: "fixed",
    body: {
      plain: "A political yes with no referendum. It does not write power-purchase contracts.",
      technical:
        "House of Assembly endorsement of the DCIA framework, 21–18, 17 September 2026. Not execution of PPAs.",
    },
    trackerId: "house",
    sources: ["vocmVote", "ntvVote"],
  },
  {
    id: "qc",
    date: "2026-10-05",
    label: "Québec votes",
    short: "5 Oct",
    status: "open",
    kind: "fixed",
    body: {
      plain: "The other government on the paper faces its voters. The party that signed is running third.",
      technical:
        "Québec general election, 5 October 2026 (writs 27 Aug). CAQ signed the DCIA; Léger 21 Sep has it third. Outcome UNKNOWN.",
    },
    trackerId: "qc-gate",
    sources: ["qcElection"],
  },
  {
    id: "binding",
    date: "2026-12-31",
    label: "Binding target",
    short: "31 Dec",
    status: "open",
    kind: "target",
    body: {
      plain: "The date the parties say they want the real contracts signed. A goal, not a deadline.",
      technical:
        "DCIA Art. 2.1: goal of entering into Definitive Agreements by 31 December 2026, and in any event by the end of the Term.",
    },
    trackerId: "binding-window",
    sources: ["dciaHq"],
  },
  {
    id: "term",
    date: "2027-03-31",
    label: "Framework term ends",
    short: "31 Mar",
    status: "open",
    kind: "target",
    body: {
      plain: "The framework clock runs out unless the parties extend it in writing. Until then Hydro-Québec holds Gull Island exclusively.",
      technical:
        "DCIA §6.3(a): Term ends on the earliest of execution of Definitive Agreements, mutual termination, or 31 March 2027 unless mutually extended in writing. §6.3(b): HQ Gull Island exclusivity during the Term.",
    },
    trackerId: "binding-window",
    sources: ["dciaHq"],
  },
  {
    id: "gull",
    date: "2036-01-01",
    label: "First Gull Island power (preliminary)",
    short: "2036",
    status: "framework",
    kind: "preliminary",
    body: {
      plain: "New megawatts are a decade out. The contracts that decide who gets them are months out.",
      technical:
        "Annex B (2,700 MW case): first Gull Island volumes 2036 (1,350 MW), full plant from 2037. Preliminary; subject to studies. Not a COD.",
    },
    trackerId: "gull-island",
    sources: ["dciaHq", "canadaDcia"],
    offscale: true,
  },
];

const MS_PER_DAY = 86_400_000;

function parseLocalISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Whole days from `today` to the gate. Negative when the gate has passed. */
export function daysUntil(iso: string, today: Date): number {
  const target = parseLocalISO(iso).getTime();
  const now = startOfDay(today).getTime();
  return Math.round((target - now) / MS_PER_DAY);
}

export type GateState = "past" | "today" | "next" | "future";

/** State of each gate relative to today; the first future gate is `next`. */
export function gateStates(gates: readonly Gate[], today: Date): Record<string, GateState> {
  const out: Record<string, GateState> = {};
  let nextFound = false;
  for (const gate of gates) {
    const d = daysUntil(gate.date, today);
    if (d < 0) out[gate.id] = "past";
    else if (d === 0) {
      out[gate.id] = "today";
      nextFound = true;
    } else if (!nextFound) {
      out[gate.id] = "next";
      nextFound = true;
    } else out[gate.id] = "future";
  }
  return out;
}

/** Position of a date on the on-scale rail, 0..1. Off-scale gates return 1. */
export function railPosition(iso: string, gates: readonly Gate[]): number {
  const onScale = gates.filter((g) => !g.offscale);
  const first = parseLocalISO(onScale[0]!.date).getTime();
  const last = parseLocalISO(onScale[onScale.length - 1]!.date).getTime();
  const t = parseLocalISO(iso).getTime();
  if (t <= first) return 0;
  if (t >= last) return 1;
  return (t - first) / (last - first);
}

export function formatDays(days: number): string {
  if (days === 0) return "today";
  const abs = Math.abs(days);
  return days > 0 ? `${abs}` : `${abs}`;
}
