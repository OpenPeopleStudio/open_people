import { DESK_VERIFIED } from "./sources";

/**
 * DCIA Annex B, preliminary ramp (17 Aug 2026). Approximate capacity figures
 * and completion timelines are subject to detailed studies. Not a COD.
 */
export const CF_UPGRADES_RAMP: { year: number; mw: number }[] = [
  { year: 2035, mw: 464 },
  { year: 2036, mw: 580 },
  { year: 2037, mw: 695 },
  { year: 2038, mw: 811 },
  { year: 2039, mw: 927 },
  { year: 2040, mw: 1043 },
  { year: 2041, mw: 1159 },
  { year: 2042, mw: 1275 },
];

/** Gull Island in the 2,700 MW configuration case. */
export const GULL_RAMP: { year: number; mw: number }[] = [
  { year: 2036, mw: 1350 },
  { year: 2037, mw: 2700 },
];

export const ANNEX_B_NOTE = {
  lastVerified: DESK_VERIFIED,
  plain:
    "New megawatts are a decade out. The contracts that decide who gets them are months out.",
  technical:
    "Annex B (17 Aug 2026): CF Upgrades ramp 464 MW (2035) to 1,275 MW (2042); Gull Island first volumes 2036 (1,350 MW), full 2,700 MW from 2037 in the 2,700 MW case. Preliminary and subject to studies. Canada.ca: online target 2036–2037.",
  sources: ["dciaHq", "canadaDcia"] as const,
};
