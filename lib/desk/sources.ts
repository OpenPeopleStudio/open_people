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
  abetterDealFaq: {
    id: "abetterdeal-faq-74",
    label: "A Better Deal NL FAQ — 7.4 ¢/kWh estimate (2027 dollars, premium-rate assumption)",
    href: "https://www.abetterdealnl.ca/",
    date: "2026-08-17",
    kind: "primary",
  },
  cpChurchillGraph: {
    id: "cp-churchill-graph",
    label: "Canadian Press — media graph: 1.8¢ in 2027; 7.4¢ 50-year average (corrected 17 Aug 2026)",
    href: "https://www.cp24.com/news/canada/2026/08/17/quebec-and-newfoundland-and-labrador-reach-energy-agreement/",
    date: "2026-08-17",
    kind: "press",
  },
  hqDciaSix: {
    id: "hq-dcia-6c",
    label: "Hydro-Québec DCIA release — “competitive rate of 6¢/kWh,” 17 Aug 2026",
    href: "https://news.hydroquebec.com/news/press-releases/all-quebec/power-generation-labrador-hydro-quebec-secures-quebec-energy-future-competitive-cost.html",
    date: "2026-08-17",
    kind: "primary",
  },
  financialPostPath: {
    id: "fp-18-115",
    label: "Financial Post — 1.8¢ in 2027 rising to 11.5¢ by 2041",
    href: "https://financialpost.com/commodities/energy/money-power-how-good-is-churchill-falls-deal-newfoundland",
    date: "2026-08-18",
    kind: "press",
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
  vocmInnuContact: {
    id: "vocm-innu-contact",
    label: "VOCM — Grand Chief: Premier has yet to contact Innu, 21 Sep 2026",
    href: "https://vocm.com/2026/09/21/premier-has-yet-to-contact-innu-about-hydro-deal-says-grand-chief/",
    date: "2026-09-21",
    kind: "press",
  },
  saltwireInnu: {
    id: "cbc-innu-letter",
    label: "CBC (syndicated) — Innu Nation letter to MHAs urging a no vote, 17 Sep 2026",
    href: "https://ca.news.yahoo.com/innu-nation-stands-against-progression-083000186.html",
    date: "2026-09-17",
    kind: "press",
  },
  vocmInnuWaterway: {
    id: "vocm-innu-waterway",
    label: "VOCM — Innu Nation, Sheshatshiu and Natuashish letter on Churchill River rights, 15 Sep 2026",
    href: "https://vocm.com/2026/09/15/310404/",
    date: "2026-09-15",
    kind: "press",
  },
  vocmInnuReady: {
    id: "vocm-innu-ready",
    label: "VOCM — Grand Chief: Innu “ready and willing to meet”, never invited to the table, 21 Sep 2026",
    href: "https://vocm.com/2026/09/21/311110/",
    date: "2026-09-21",
    kind: "press",
  },
  radioCanadaInnu: {
    id: "rc-innu-royalties",
    label: "Radio-Canada — Innu Nation says DCIA cuts benefits by more than half vs the 2024 MOU, 18 Sep 2026",
    href: "https://ici.radio-canada.ca/nouvelle/2285036/churchill-falls-gull-island-innus-redevances",
    date: "2026-09-18",
    kind: "press",
  },
  vocmRussell: {
    id: "vocm-russell",
    label: "VOCM — Keith Russell (Ind., Lake Melville) on his no vote, 18 Sep 2026",
    href: "https://vocm.com/2026/09/18/were-in-crisis-says-independent-labrador-mha-who-voted-against-churchill-falls-agreement/",
    date: "2026-09-18",
    kind: "press",
  },
  ntvVote: {
    id: "ntv-vote",
    label: "NTV — House votes 21–18; Premier on return to the House before definitive agreements, 17–18 Sep 2026",
    href: "https://ntv.ca/politics/breaking-house-of-assembly-votes-in-favour-of-churchill-falls-deal-21-18/",
    date: "2026-09-18",
    kind: "press",
  },
  vocmOpposition: {
    id: "vocm-opposition",
    label: "VOCM — Opposition reacts: no further approval mechanism; PUB involvement, 18 Sep 2026",
    href: "https://vocm.com/2026/09/18/opposition-reacts-to/",
    date: "2026-09-18",
    kind: "press",
  },
  ndpConditions: {
    id: "ndp-conditions",
    label: "NL NDP — three conditions not yet met (PUB experts, vote on finals, Innu approval), 17 Sep 2026",
    href: "https://nl.ndp.ca/ndp-votes-no-to-churchill-falls-dcia-three-conditions-not-yet-met/",
    date: "2026-09-17",
    kind: "primary",
  },
  vocmPerry: {
    id: "vocm-perry",
    label: "VOCM — Lead negotiator Barry Perry on the cancelled referendum, 20 Sep 2026",
    href: "https://vocm.com/2026/09/20/310980/",
    date: "2026-09-20",
    kind: "press",
  },
  qcElection: {
    id: "qc-election",
    label: "2026 Québec general election — campaign and published polls (reference page)",
    href: "https://en.wikipedia.org/wiki/2026_Quebec_general_election",
    date: "2026-09-21",
    kind: "press",
  },
  radioCanadaQcOpposition: {
    id: "rc-qc-opposition",
    label: "Radio-Canada — Québec opposition parties on the Churchill Falls signing, Aug 2026",
    href: "https://ici.radio-canada.ca/nouvelle/2275867/churchill-falls-entente-signature-opposition",
    date: "2026-08-17",
    kind: "press",
  },
  globeQc: {
    id: "globe-qc",
    label: "Globe and Mail — Québec election leaves the new hydro deal’s path unclear",
    href: "https://www.theglobeandmail.com/canada/article-quebec-election-new-hydroelectricity-deal-newfoundland-unclear/",
    date: "2026-09-01",
    kind: "press",
  },
  aptnQcInnu: {
    id: "aptn-qc-innu",
    label: "APTN — Innu in Québec (Uashat mak Mani-utenam, Matimekush-Lac John) say consent is mandatory",
    href: "https://www.aptnnews.ca/national-news/innu-in-quebec-reject-churchill-falls-deal-between-quebec-newfoundland-and-labrador/",
    date: "2026-08-20",
    kind: "press",
  },
  canadaDcia: {
    id: "canada-dcia",
    label: "Canada.ca — federal release on the Churchill River partnership, 17 Aug 2026",
    href: "https://www.canada.ca/en/natural-resources-canada/news/2026/08/prime-minister-carney-announces-the-largest-clean-energy-investment-in-north-american-history.html",
    date: "2026-08-17",
    kind: "primary",
  },
  cbcIaac: {
    id: "cbc-iaac",
    label: "CBC (syndicated) — IAAC: no new assessment if Gull Island scope matches; no proponent confirmation, 10 Sep 2026",
    href: "https://ca.news.yahoo.com/gull-island-project-clear-impact-134114528.html",
    date: "2026-09-10",
    kind: "press",
  },
  rciPricePath: {
    id: "rci-price-path",
    label: "CBC / Radio-Canada International — NL Hydro: 1.8¢ in 2027 rising ~14%/yr to 11.5¢ by 2041, 17 Aug 2026",
    href: "https://ici.radio-canada.ca/rci/en/news/2275804/n-l-quebec-to-sign-new-churchill-falls-agreement-worth-billions-with-help-from-ottawa",
    date: "2026-08-17",
    kind: "press",
  },
  powerAdvisory: {
    id: "power-advisory",
    label: "Power Advisory — New and improved Churchill Falls PPA (price path note)",
    href: "https://www.poweradvisoryllc.com/reports/new-and-improved-churchill-falls-ppa-and-other-developments-in-newfoundland-and-labrador",
    date: "2026-08-20",
    kind: "scholarship",
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
    label: "PUB Order P.U. 17(2026), 11 Jun 2026 — Island Industrial riders effective 1 Jul 2026",
    href: "http://pub.nl.ca/PU/orders/2026/P.U.%2017(2026).PDF",
    date: "2026-06-11",
    kind: "regulator",
  },
  pubUtility2026: {
    id: "pub-utility-2026",
    label: "PUB Order P.U. 15(2026) — July 2026 wholesale (Utility) rate",
    href: "http://pub.nl.ca/PU/orders/2026/P.U.%2015(2026).PDF",
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
    label: "Feehan & Baker, Dalhousie Law Journal 30(1), 2007 — two mills (0.2¢/kWh) renewal",
    href: "https://digitalcommons.schulichlaw.dal.ca/dlj/vol30/iss1/6",
    date: "2007-01-01",
    kind: "scholarship",
  },
  policyOptions2010: {
    id: "policy-options-2010",
    label: "Feehan & Baker, Policy Options, Sep 2010 — $2/MWh renewal price for 25 years",
    href: "https://policyoptions.irpp.org/magazines/the-new-normal-majority-government/the-churchill-falls-contract-and-why-newfoundlanders-cant-get-over-it/",
    date: "2010-09-01",
    kind: "scholarship",
  },
  cbcMining: {
    id: "cbc-mining-mw",
    label: "CBC, 15 Jan 2025 (2024 MOU era) — Labrador West mining load (~312 MW of 525 MW NLH allocation)",
    href: "https://www.cbc.ca/lite/story/1.7430692",
    date: "2025-01-15",
    kind: "press",
  },
  nlhLabWest: {
    id: "nlh-lab-west",
    label: "NL Hydro — Labrador West Transmission Expansion Study (FEED and permits under way; page as of Sep 2026)",
    href: "https://nlhydro.com/about-us/our-electricity-system/major-projects/labrador-west-transmission-expansion/",
    date: "2026-09-22",
    kind: "utility",
  },
  cerNl: {
    id: "cer-nl",
    label: "Canada Energy Regulator — NL provincial energy profile (modified 26 Mar 2026)",
    href: "https://www.cer-rec.gc.ca/en/data-analysis/energy-markets/province-territory-energy-profiles/newfoundland-labrador.html",
    date: "2026-03-26",
    kind: "regulator",
  },
  cerRenewables: {
    id: "cer-renewables",
    label: "Canada Energy Regulator — Canada’s Renewable Power: NL (43.1 TWh renewable, 97.4%, 2023)",
    href: "https://www.cer-rec.gc.ca/en/data-analysis/energy-commodities/electricity/report/canadas-renewable-power/provinces/renewable-power-canada-newfoundland-labrador.html",
    date: "2026-03-26",
    kind: "regulator",
  },
  hqDataCentreTariff: {
    id: "hq-dc-tariff",
    label: "Hydro-Québec — proposed 13¢/kWh data-centre rate (≥5 MW) filed with the Régie, 19 Feb 2026",
    href: "https://news.hydroquebec.com/news/press-releases/all-quebec/hydro-quebec-proposing-regie-energie-new-rate-large-data-centres-adjustment-rate-cryptographic-use-applied-blockchains.html",
    date: "2026-02-19",
    kind: "primary",
  },
  aesoCap: {
    id: "aeso-cap",
    label: "Alberta — data centre grid page: AESO 1,200 MW interim limit “now fully taken”",
    href: "https://www.alberta.ca/datacentres/grid.html",
    date: "2026-06-01",
    kind: "regulator",
  },
} as const satisfies Record<string, DeskSource>;

export type DeskSourceId = keyof typeof DESK_SOURCES;

export function sourceList(ids: DeskSourceId[]): DeskSource[] {
  return ids.map((id) => DESK_SOURCES[id]);
}
