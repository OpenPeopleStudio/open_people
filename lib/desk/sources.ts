/**
 * Public sources for the horizon desk. Last-verified dates are when Open People
 * last checked the public document — not a claim that the underlying fact is
 * locked. Do not invent MW, ¢/kWh, $B, or SPE names here.
 */

export const DESK_VERIFIED = "2026-09-22";

export type DeskSourceKind = "primary" | "regulator" | "utility" | "press" | "scholarship";

export type DeskSource = {
  id: string;
  label: string;
  href: string;
  date: string;
  kind: DeskSourceKind;
};

export const DESK_SOURCES = {
  dciaHq: {
    id: "dcia-hq",
    label: "DCIA (Hydro-Québec PDF), 17 Aug 2026",
    href: "https://news.hydroquebec.com/content/dam/salle-des-nouvelles/pdfs/en/DCIA_Hydro-Qu%C3%A9bec%20et%20Newfoundland%20and%20Labrador%20Hydro-%20August%2017%202026.pdf",
    date: "2026-08-17",
    kind: "primary",
  },
  dciaNl: {
    id: "dcia-nl",
    label: "DCIA (abetterdealnl.ca PDF), 17 Aug 2026",
    href: "https://www.abetterdealnl.ca/files/DEFINITIVE-COOPERATION-AND-IMPLEMENTATION-AGREEMENT.pdf",
    date: "2026-08-17",
    kind: "primary",
  },
  govNlDcia: {
    id: "govnl-0817",
    label: "Government of NL news release, 17 Aug 2026",
    href: "https://www.gov.nl.ca/releases/2026/exec/0817n01/",
    date: "2026-08-17",
    kind: "primary",
  },
  ircReport: {
    id: "irc-report",
    label: "Independent Churchill River Review Committee report, 30 Apr 2026 (released 19 May)",
    href: "https://www.churchillriverreview.ca/files/IRC-Report.pdf",
    date: "2026-05-19",
    kind: "primary",
  },
  ircBriefing: {
    id: "irc-briefing",
    label: "IRC technical briefing, 19 May 2026",
    href: "https://www.churchillriverreview.ca/files/ChurchillRiverTechnicalBriefing.pdf",
    date: "2026-05-19",
    kind: "primary",
  },
  vocmVote: {
    id: "vocm-vote",
    label: "VOCM — House vote 21–18, 17 Sep 2026",
    href: "https://vocm.com/2026/09/17/churchill-falls-deal-passes-vote-in-house-of-assembly/",
    date: "2026-09-17",
    kind: "press",
  },
  vocmInnu: {
    id: "vocm-innu",
    label: "VOCM — Innu Nation letter; Premier to meet, 18 Sep 2026",
    href: "https://vocm.com/2026/09/18/310730/",
    date: "2026-09-18",
    kind: "press",
  },
  saltwireInnu: {
    id: "saltwire-innu",
    label: "SaltWire / PNI — Innu Nation asked MHAs to vote no",
    href: "https://www.saltwire.com/newfoundland-labrador/innu-nation-churchill-falls-vote",
    date: "2026-09-17",
    kind: "press",
  },
  nlhRates2026: {
    id: "nlh-rates-2026",
    label: "NL Hydro Schedule of Rates, Rules and Regulations, Jul 2026 (LAB-IND-1 PDF)",
    href: "https://nlhydro.com/wp-content/uploads/2026/07/Schedule-of-Rates-Rules-and-Regulations_Jul_2026.pdf",
    date: "2026-07-01",
    kind: "utility",
  },
  nlhCurrentRates: {
    id: "nlh-current-rates",
    label: "NL Hydro current rates page (URL path spelled “electicity”)",
    href: "https://nlhydro.com/electicity-rates/current-rates/",
    date: "2026-09-22",
    kind: "utility",
  },
  labIndHist: {
    id: "lab-ind-hist",
    label: "Older Labrador Industrial Rate Schedule PDF (schedule-era; 2015 figures)",
    href: "https://nlhydro.com/wp-content/uploads/2014/04/Labrador-Industrial-Rate-Schedule.pdf",
    date: "2015-01-01",
    kind: "utility",
  },
  pubIsland2026: {
    id: "pub-island-2026",
    label: "PUB Order P.U. 17(2026) — Island Industrial riders",
    href: "http://pub.nl.ca/PU/orders/2026/P.U.%2017(2026).PDF",
    date: "2026-06-01",
    kind: "regulator",
  },
  heritage1969: {
    id: "heritage-1969",
    label: "Heritage NL — The 1969 Contract: Churchill Falls",
    href: "https://www.heritage.nf.ca/articles/politics/churchill-falls.php",
    date: "2008-01-01",
    kind: "scholarship",
  },
  feehanBaker: {
    id: "feehan-baker",
    label: "Feehan & Baker, Dalhousie Law Journal — two mills (0.2¢/kWh) renewal",
    href: "https://digitalcommons.schulichlaw.dal.ca/dlj/vol30/iss1/6",
    date: "2007-01-01",
    kind: "scholarship",
  },
  cbcMining: {
    id: "cbc-mining-mw",
    label: "CBC — Labrador West mining load (~312 MW of 525 MW NLH allocation)",
    href: "https://www.cbc.ca/lite/story/1.7430692",
    date: "2025-01-01",
    kind: "press",
  },
  nlhLabWest: {
    id: "nlh-lab-west",
    label: "NL Hydro — Labrador West Transmission Expansion Study",
    href: "https://nlhydro.com/about-us/our-electricity-system/major-projects/labrador-west-transmission-expansion/",
    date: "2024-01-01",
    kind: "utility",
  },
  cerNl: {
    id: "cer-nl",
    label: "Canada Energy Regulator — NL provincial energy profile",
    href: "https://www.cer-rec.gc.ca/en/data-analysis/energy-markets/provincial-territorial-energy-profiles/provincial-territorial-energy-profiles-newfoundland-labrador.html",
    date: "2026-03-25",
    kind: "regulator",
  },
} as const satisfies Record<string, DeskSource>;

export type DeskSourceId = keyof typeof DESK_SOURCES;

export function sourceList(ids: DeskSourceId[]): DeskSource[] {
  return ids.map((id) => DESK_SOURCES[id]);
}
