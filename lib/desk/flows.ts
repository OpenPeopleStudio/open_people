import { DESK_VERIFIED, type DeskSourceId } from "./sources";

/**
 * Flow Bars: proportional megawatt bars. Fill encodes how hard the number is.
 *  solid   — published or in a signed / regulatory document
 *  outline — announcement language (Gov NL release)
 *  hatch   — preliminary range or study, subject to studies
 *  dashed  — not published
 */
export type FlowFill = "solid" | "outline" | "hatch" | "dashed";

export type FlowBar = {
  id: string;
  label: string;
  /** MW used for bar length; for ranges use the upper bound */
  mw: number | null;
  /** lower bound when this is a range */
  mwLow?: number;
  value: string;
  fill: FlowFill;
  status: "signed" | "framework" | "endorsed" | "open" | "unknown" | "published-rate" | "reported";
  note: string;
  sources: DeskSourceId[];
  lastVerified: string;
  href?: string;
};

export const FLOW_BARS: FlowBar[] = [
  {
    id: "cf-total",
    label: "Churchill Falls, existing plant",
    mw: 5428,
    value: "5,428 MW",
    fill: "solid",
    status: "published-rate",
    note: "Rated capacity of the existing plant (CER provincial profile). CF(L)Co: NL Hydro 65.8%, Hydro-Québec 34.2%.",
    sources: ["cerNl"],
    lastVerified: DESK_VERIFIED,
  },
  {
    id: "nlh-today",
    label: "NL Hydro's Labrador allocation today",
    mw: 525,
    value: "~525 MW",
    fill: "solid",
    status: "reported",
    note: "About 525 MW allocated to NL Hydro from Churchill Falls to energize Labrador (CBC, Jan 2025); Annex B shows 525 MW existing-CF for NLH in 2027.",
    sources: ["cbcMining", "dciaHq"],
    lastVerified: DESK_VERIFIED,
    href: "/industries",
  },
  {
    id: "mining-now",
    label: "of which sold to IOC and Tacora",
    mw: 312,
    value: "~312 MW",
    fill: "solid",
    status: "reported",
    note: "Mining load on the two Labrador West lines (CBC report of NL Hydro officials). Press cite, not a PUB order.",
    sources: ["cbcMining"],
    lastVerified: DESK_VERIFIED,
    href: "/industries",
  },
  {
    id: "retain",
    label: "Public retain framing, CF + Gull Island",
    mw: 2350,
    value: "up to 2,350 MW",
    fill: "outline",
    status: "framework",
    note: "Gov NL 17 Aug 2026 announcement language. Not a signed industrial allocation, not a queue.",
    sources: ["govNlDcia", "dciaHq"],
    lastVerified: DESK_VERIFIED,
    href: "/tracker#metering",
  },
  {
    id: "gull",
    label: "Gull Island, new plant",
    mw: 2700,
    mwLow: 2250,
    value: "2,250–2,700 MW",
    fill: "hatch",
    status: "framework",
    note: "Schedule A: approximately 2,250 or 2,700 MW depending on final configuration, subject to studies. First power pencilled 2036.",
    sources: ["dciaHq"],
    lastVerified: DESK_VERIFIED,
    href: "/tracker#gull-island",
  },
  {
    id: "cf-upgrades",
    label: "Churchill Falls upgrades",
    mw: 1275,
    value: "~1,275 MW by 2042",
    fill: "hatch",
    status: "framework",
    note: "Schedule A §1: about +23.5% across 11 units. Annex B ramp is preliminary.",
    sources: ["dciaHq"],
    lastVerified: DESK_VERIFIED,
    href: "/tracker#cf-upgrades",
  },
  {
    id: "wind",
    label: "Labrador wind, feasibility study",
    mw: 2000,
    value: "2,000 MW study · 400 MW to NL if built",
    fill: "hatch",
    status: "unknown",
    note: "Schedule B §7: NLH-led study after Definitive Agreements; owner SPE unnamed; NLH 400 MW from 2039 in Annex B if built.",
    sources: ["dciaHq"],
    lastVerified: DESK_VERIFIED,
    href: "/tracker#wind-spe",
  },
  {
    id: "queue",
    label: "Signed industrial queue for retained power",
    mw: null,
    value: "NOT PUBLISHED",
    fill: "dashed",
    status: "unknown",
    note: "No year-by-year meter of who gets retained megawatts is public. A headline number is not a schedule.",
    sources: ["dciaHq"],
    lastVerified: DESK_VERIFIED,
    href: "/tracker#metering",
  },
];
