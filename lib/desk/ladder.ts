import { DESK_VERIFIED, type DeskSourceId } from "./sources";

/**
 * The Price Ladder: one ¢/kWh axis, each price family on its own row.
 * Labelled, not merged. Every rung points at a marker that already exists
 * on /costs or a source in the registry. No derived numbers.
 */
export type LadderFamily = {
  id: string;
  label: string;
  /** one line on what this family measures */
  measures: string;
  tone: "heritage" | "reported" | "structure" | "published" | "island" | "neighbour" | "unknown";
};

export type LadderPoint = {
  id: string;
  family: LadderFamily["id"];
  /** numeric ¢/kWh for axis placement; null renders as NOT PUBLISHED */
  cents: number | null;
  value: string;
  label: string;
  status: "heritage" | "reported" | "structure" | "published-rate" | "unknown";
  /** anchor on /costs, when the rung has a marker card */
  href?: string;
  note: string;
  sources: DeskSourceId[];
  lastVerified: string;
};

export const LADDER_FAMILIES: LadderFamily[] = [
  {
    id: "heritage",
    label: "Heritage export",
    measures: "What Hydro-Québec pays under the 1969-lineage renewal, to 2041.",
    tone: "heritage",
  },
  {
    id: "mou",
    label: "Rejected 2024 MOU",
    measures: "The IRC's decomposition of the expired MOU's average into its two blocks. History.",
    tone: "structure",
  },
  {
    id: "reported",
    label: "Reported new HQ export path",
    measures: "Press and utility descriptions of the DCIA export price. Not a signed PPA cent.",
    tone: "reported",
  },
  {
    id: "labrador",
    label: "Published Labrador tariffs",
    measures: "What Hydro posts today for Labrador households; the mine rate is a formula, not a rung.",
    tone: "published",
  },
  {
    id: "island",
    label: "Island grid (not Labrador)",
    measures: "A different grid and a different tariff. Shown so nobody quotes it as Labrador.",
    tone: "island",
  },
  {
    id: "neighbour",
    label: "Québec data-centre rate (proposed)",
    measures: "What Hydro-Québec wants to charge compute at home. Context, not a Labrador tariff.",
    tone: "neighbour",
  },
  {
    id: "signed",
    label: "Signed industrial ¢ for retained power",
    measures: "The number that would matter for a new Labrador mine or any new load.",
    tone: "unknown",
  },
];

export const LADDER_POINTS: LadderPoint[] = [
  {
    id: "heritage-02",
    family: "heritage",
    cents: 0.2,
    value: "0.2",
    label: "1969 renewal, two mills",
    status: "heritage",
    href: "/costs#heritage-mills",
    note: "Export price under a specific contract (2016–2041). Not a rate anyone here can buy at.",
    sources: ["heritage1969", "feehanBaker"],
    lastVerified: DESK_VERIFIED,
  },
  {
    id: "mou-38",
    family: "mou",
    cents: 3.8,
    value: "3.8",
    label: "MOU front block, 2025–2041",
    status: "structure",
    href: "/costs#mou-irc-path",
    note: "IRC levelized cost, 2024 dollars. The MOU expired 30 April 2026.",
    sources: ["ircReport", "ircBriefing"],
    lastVerified: DESK_VERIFIED,
  },
  {
    id: "mou-167",
    family: "mou",
    cents: 16.7,
    value: "16.7",
    label: "MOU back block, 2042–2075",
    status: "structure",
    href: "/costs#mou-irc-path",
    note: "IRC levelized cost, 2024 dollars. Shows why the MOU 'average' hid a steep back end.",
    sources: ["ircReport", "ircBriefing"],
    lastVerified: DESK_VERIFIED,
  },
  {
    id: "reported-18",
    family: "reported",
    cents: 1.8,
    value: "1.8",
    label: "Starts 2027 (reported)",
    status: "reported",
    href: "/costs#start-18",
    note: "Starting price on the media graph, per NL Hydro. Not the fifty-year average.",
    sources: ["cpChurchillGraph", "rciPricePath"],
    lastVerified: DESK_VERIFIED,
  },
  {
    id: "reported-60",
    family: "reported",
    cents: 6,
    value: "6",
    label: "HQ release framing",
    status: "reported",
    note: "Hydro-Québec's own 17 Aug release: “competitive rate of 6¢/kWh”. Its framing, not a schedule.",
    sources: ["hqDciaSix"],
    lastVerified: DESK_VERIFIED,
  },
  {
    id: "reported-74",
    family: "reported",
    cents: 7.4,
    value: "7.4",
    label: "50-year average (reported)",
    status: "reported",
    href: "/costs#average-74",
    note: "Canadian Press, corrected: averaging 7.4¢ over the next fifty years. Not the 2027 start.",
    sources: ["cpChurchillGraph"],
    lastVerified: DESK_VERIFIED,
  },
  {
    id: "reported-115",
    family: "reported",
    cents: 11.5,
    value: "11.5",
    label: "By 2041 (reported)",
    status: "reported",
    href: "/costs#reported-export-path",
    note: "NL Hydro description via CBC / Radio-Canada: rising about 14% a year to 11.5¢ by 2041.",
    sources: ["rciPricePath", "financialPostPath"],
    lastVerified: DESK_VERIFIED,
  },
  {
    id: "lab-3154",
    family: "labrador",
    cents: 3.154,
    value: "3.154",
    label: "Rate 1.1L domestic",
    status: "published-rate",
    href: "/costs#lab-domestic",
    note: "Labrador Interconnected household energy, July 2026 schedule, plus a monthly customer charge.",
    sources: ["nlhCurrentRates", "nlhRates2026"],
    lastVerified: DESK_VERIFIED,
  },
  {
    id: "island-4428",
    family: "island",
    cents: 4.428,
    value: "4.428",
    label: "Island Industrial base (+ riders)",
    status: "published-rate",
    href: "/costs#island-industrial",
    note: "IND-1 base energy before the 1.987¢ and 0.007¢ riders and demand charges. Island grid only.",
    sources: ["nlhRates2026", "pubIsland2026"],
    lastVerified: DESK_VERIFIED,
  },
  {
    id: "island-15587",
    family: "island",
    cents: 15.587,
    value: "15.587",
    label: "Island domestic first block",
    status: "published-rate",
    note: "Hydro's current-rates page for Island Interconnected, L'Anse au Loup and isolated diesel. Not Labrador.",
    sources: ["nlhCurrentRates"],
    lastVerified: DESK_VERIFIED,
  },
  {
    id: "qc-13",
    family: "neighbour",
    cents: 13,
    value: "13",
    label: "HQ proposed data-centre rate",
    status: "reported",
    note: "Filed with the Régie 19 Feb 2026 for data centres of 5 MW and up; decision expected around year-end.",
    sources: ["hqDataCentreTariff"],
    lastVerified: DESK_VERIFIED,
  },
  {
    id: "signed-unknown",
    family: "signed",
    cents: null,
    value: "NOT PUBLISHED",
    label: "New Labrador industrial ¢ under the DCIA",
    status: "unknown",
    href: "/costs#dcia-industrial-alloc",
    note: "No public, locked cent rate for retained Churchill / Gull Island megawatts. This desk does not invent one.",
    sources: ["dciaHq"],
    lastVerified: DESK_VERIFIED,
  },
];
