import { DESK_VERIFIED } from "./sources";
import type { DeskSourceId } from "./sources";
import type { DeskVoice } from "./types";

export type CostMarker = {
  id: string;
  label: string;
  value: string;
  unit: string;
  status: "heritage" | "structure" | "published-rate" | "reported" | "unknown";
  lastVerified: string;
  note: DeskVoice;
  sources: DeskSourceId[];
};

export const COST_INTRO = {
  lastVerified: DESK_VERIFIED,
  body: {
    plain:
      "Four different price stories get mashed together in this file. One is the old export lore. One is the structure of the new paper — blocks, inflation, leftover-power options — not a locked industrial tariff. One is what NL Hydro posts for Labrador households today. One is the Labrador industrial tariff, which is a formula with demand charges, not a single cent. A fifth fight sits on top: two public cent stories about Hydro-Québec’s export price that are not the same thing. We keep them apart.",
    technical:
      "Do not present illustrative MOU ¢/kWh schedules, Annex D target payments, or reported HQ export paths as locked PPAs. Heritage 0.2¢/kWh is the 1969-lineage renewal export price. DCIA Material Terms describe availability / take-or-pay architecture, CPI adjustment, and HQ purchase options. Labrador Interconnected domestic energy is Rate No. 1.1L at 3.154¢/kWh (Jul 2026 schedule; Hydro current-rates page). LAB-IND-1 is demand plus a monthly RFIRM blend of Development and Market energy blocks — not one ¢/kWh. Island Industrial Firm is a different class on the Island grid. None of these is Churchill Falls offtake. Reported 1.8 ¢/kWh (2027 start) and 7.4 ¢/kWh (~50-year average) are labeled separately below — different measurements, not one industrial ¢. Methodology turning Annex D $B into a locked ¢ tariff: UNKNOWN.",
  } satisfies DeskVoice,
};

/**
 * Two public ¢ stories about HQ’s Churchill Falls offtake. Labeled, not merged.
 * Plain pair: 1.8¢ start (2027) vs 7.4¢ average (~50 years). Different measurements.
 * Do not invent a formula that turns 7.4 into Annex D $B.
 */
export const CONTESTED_EXPORT = {
  lastVerified: DESK_VERIFIED,
  kicker: "Contested communications — not a locked industrial ¢",
  title: "Starts about 1.8¢ in 2027. Averages about 7.4¢ over ~50 years.",
  intro: {
    plain:
      "Those are two different measurements of Hydro-Québec’s Churchill Falls export price — a starting price and a life average — not a contradiction to mash into one number, and not a posted rate for Labrador mines or compute.",
    technical:
      "Canadian Press (17 Aug 2026, corrected): a graph provided to media showed HQ paying 1.8¢/kWh beginning in 2027, averaging 7.4¢/kWh over the next 50 years (term to 2077). Those are different measurements, not one industrial ¢. Annex D is target $B + CPI, not a voter industrial tariff. Methodology turning Annex D into a locked ¢/kWh: UNKNOWN. Open People is not a DCIA party.",
  } satisfies DeskVoice,
  annexPath: {
    id: "annex-d-18",
    label: "Starting reported price (2027)",
    value: "1.8",
    unit: "¢/kWh in 2027",
    status: "reported" as const,
    lastVerified: DESK_VERIFIED,
    note: {
      plain:
        "The briefing graph starts at about 1.8 cents a kilowatt-hour in 2027. The cooperation paper itself pays a table of target dollars, not that cent. Divide the first-year dollars by terawatt-hours and you land near 1.8 cents. That is still not a locked industrial tariff.",
      technical:
        "Canadian Press (17 Aug 2026, corrected): graph to media — Hydro-Québec pays 1.8¢/kWh beginning in 2027. Financial Post: that path rises to 11.5¢/kWh by 2041 (~14%/year). Do not treat 11.5 as the raw 2041 Annex D division. DCIA Annex D (17 Aug 2026): 2027 “Payments by HQ for existing CF volumes” $0.531B on 29.207 TWh (4,765 MW). Payment÷TWh on those cells is often summarized as ~1.8 ¢/kWh ($0.531B / 29.207 TWh ≈ 1.82 ¢/kWh). Annex D is yearly target $B as of 31 Dec, not a ¢ column; Annex F CPI can later adjust the $ path. Not Rate 1.1L, not LAB-IND-1, not a locked industrial PPA ¢ for Labrador mines or compute. Binding PPA ¢/kWh: UNKNOWN until Definitive Agreements are public.",
    } satisfies DeskVoice,
    sources: ["cpChurchillGraph", "financialPostPath", "dciaHq", "dciaNl"] as DeskSourceId[],
  },
  campaign: {
    id: "campaign-74",
    label: "Average effective price (~50 years)",
    value: "7.4",
    unit: "¢/kWh over ~50 years",
    status: "reported" as const,
    lastVerified: DESK_VERIFIED,
    note: {
      plain:
        "The same public graph averages about 7.4 cents a kilowatt-hour from 2027 through 2077. The campaign site calls 7.4 an estimate in 2027 dollars that assumes premium-rate sales. The official provincial news release does not print 7.4. It is not the starting price, and it is not a mine rate.",
      technical:
        "Canadian Press (17 Aug 2026, corrected): “averaging out to an effective price of 7.4 cents per kilowatt hour over the next 50 years” (price increases until 2077). Prior MOU average cited ~5.9¢. A Better Deal NL FAQ (campaign site; last checked 22 Sep 2026): “Our estimate of 7.4 cents/kwh for Churchill Falls power is accurate. It is based on 2027 dollars and assumes sales at the premium rate.” Government of NL news release (17 Aug 2026) does not quote 7.4¢. Hydro-Québec same-day release quotes a “competitive rate of 6¢/kWh” — a different public figure, labeled, not merged. 7.4 is a 50-year average / campaign estimate of Churchill Falls electricity sold to HQ. It is not the 2027 starting 1.8¢, not Rate 1.1L, not LAB-IND-1, and not a locked industrial PPA ¢ for Labrador mines or compute.",
    } satisfies DeskVoice,
    sources: ["cpChurchillGraph", "abetterDealFaq", "hqDciaSix", "govNlDcia"] as DeskSourceId[],
  },
  bridge: {
    id: "cents-bridge",
    label: "Turning Annex D dollars into a voter industrial ¢",
    value: "UNKNOWN",
    unit: "",
    status: "unknown" as const,
    lastVerified: DESK_VERIFIED,
    note: {
      plain:
        "1.8 cents at the start and 7.4 cents as a fifty-year average are different measurements, not a puzzle we get to force into one rate. Nobody has published how to turn the payment table into a locked industrial cent. We do not invent it.",
      technical:
        "UNKNOWN: a published methodology that turns Annex D target payments into a locked industrial ¢/kWh tariff, or that reconciles the 7.4 ¢/kWh 50-year average with Annex D $B. Open People does not invent a bridge formula. Material Terms describe a Premium PPA Price at 1.5× the New CF PPA price; that clause is not used here to manufacture 7.4 from 1.8. Hydro-Québec’s 6¢/kWh public figure is likewise not a published bridge. None of 7.4, 1.8, 11.5, or 6 is a locked industrial PPA ¢ for Labrador mines or compute. Heritage 0.2¢/kWh remains the 1969-lineage comparator (labeled heritage, not current).",
    } satisfies DeskVoice,
    sources: ["dciaHq", "cpChurchillGraph", "abetterDealFaq", "hqDciaSix"] as DeskSourceId[],
  },
};

/** Older Labrador Industrial PDF — schedule-era figures only, not current. */
export const COST_ERA_NOTE = {
  lastVerified: DESK_VERIFIED,
  sources: ["labIndHist", "nlhRates2026"] as DeskSourceId[],
  body: {
    plain:
      "An older Labrador Industrial schedule is still on Hydro’s site. Its 2015 energy-block numbers are history. Use them only as a then-versus-now of the same formula, not as today’s mine rate.",
    technical:
      "Schedule-era (older PDF hosted at /wp-content/uploads/2014/04/Labrador-Industrial-Rate-Schedule.pdf; figures stated effective 1 Jan 2015–31 Dec 2015): transmission demand $1.25/kW of billing demand; generation demand $0.43/kW-month; Development Block Energy Rate RD $22.43/MWh; Market Block Energy Rate RM $45.52/MWh; RFIRM = {(ED × RD) + (EM × RM)} / ETOTAL. Jul 2026 LAB-IND-1 keeps that formula with different posted components (closed transmission demand $1.08/kW-month existing customers only; generation demand $0.41/kW-month; RD $29.22/MWh and RM $78.61/MWh for calendar 2026). Do not quote 2015 figures as current.",
  } satisfies DeskVoice,
};

export const COST_MARKERS: CostMarker[] = [
  {
    id: "heritage-mills",
    label: "Heritage export (1969 renewal)",
    value: "0.2",
    unit: "¢/kWh",
    status: "heritage",
    lastVerified: DESK_VERIFIED,
    note: {
      plain:
        "Two mills — two tenths of a cent — is the old Hydro-Québec renewal price, not a rate anyone in this province can buy power at today.",
      technical:
        "The 1969 Churchill Falls contract’s automatic 25-year renewal (2016–2041) prices HQ purchases at two mills per kWh. A mill is one-tenth of a cent, so two mills is 0.2¢/kWh ($2/MWh). Heritage NL and Feehan & Baker. This is an export price under a specific contract. It is not Rate 1.1L, not LAB-IND-1, not Island Industrial, and not a 2027 DCIA PPA rate.",
    },
    sources: ["heritage1969", "feehanBaker"],
  },
  {
    id: "mou-irc-path",
    label: "Rejected 2024 MOU path (IRC)",
    value: "3.8 → 16.7",
    unit: "¢/kWh avg blocks",
    status: "structure",
    lastVerified: DESK_VERIFIED,
    note: {
      plain:
        "The old memorandum’s “average” hid a cheap front and a steep back. The independent review took that paper apart. That path is history — not the August framework.",
      technical:
        "IRC technical briefing (19 May 2026): MOU CF PPA decomposed to an average of 3.8¢/kWh (2024–2041) then 16.7¢/kWh (2042–2075) in 2024 dollars, targeting $33.8B PV via a block-pricing formula (Schedules F/G of the MOU). The IRC found the MOU not in the overall best long-term interest as written. The 2024 MOU expired 30 Apr 2026. Do not model the DCIA as this ¢ path.",
    },
    sources: ["ircBriefing", "ircReport"],
  },
  {
    id: "dcia-hq-payments",
    label: "DCIA HQ payments (structure)",
    value: "Annex D + CPI",
    unit: "target $B, not ¢/kWh",
    status: "structure",
    lastVerified: DESK_VERIFIED,
    note: {
      plain:
        "The new paper pays Hydro-Québec’s Churchill Falls offtake as a schedule of target dollars, then nudges it with a Canadian inflation band. That is not a posted industrial cent rate.",
      technical:
        "Material Terms: HQ’s New CF PPA is an availability contract with fixed target payments (Annex D), monthly invoicing, term 1 Jan 2027–31 Dec 2077, CPI adjustment (Annex F) from a 2027 base with a deadband centred on 2.06% ± 0.40% (Statistics Canada All-items, Canada). NLH’s New CF PPA is take-or-pay, same blended price and CPI mechanism, first-out-of-plant. These Definitive Agreements are not signed. Do not convert Annex D into a locked ¢/kWh industrial tariff.",
    },
    sources: ["dciaHq", "dciaNl"],
  },
  {
    id: "reported-export-path",
    label: "Reported HQ ¢ path (not a locked PPA)",
    value: "1.8 → 11.5",
    unit: "¢/kWh (reported)",
    status: "reported",
    lastVerified: DESK_VERIFIED,
    note: {
      plain:
        "NL Hydro has described a rising export price toward 2041. Treat that as a public description of direction — not a signed industrial rate, and not a data-centre tariff.",
      technical:
        "Public campaign materials and NL Hydro reporting after 17 Aug 2026 have described Hydro-Québec paying 1.8¢/kWh beginning in 2027, escalating about 14% a year to 11.5¢/kWh by 2041. That is a reported export-path description. It is not in the cents columns of Annex D (which is target $B). It is not the campaign’s 7.4 ¢/kWh estimate. It is not LAB-IND-1. Binding PPA ¢/kWh: UNKNOWN until Definitive Agreements are public. See contested communications on this page.",
    },
    sources: ["govNlDcia", "dciaHq", "cpChurchillGraph", "financialPostPath"],
  },
  {
    id: "synthetic-export",
    label: "Unused-retain / synthetic export options",
    value: "§4 options",
    unit: "MW caps + notice",
    status: "structure",
    lastVerified: DESK_VERIFIED,
    note: {
      plain:
        "If NL does not use power at home, the paper already lists ways to sell it west — some at a discount if nobody gave three years’ notice.",
      technical:
        "Schedule B §4 HQ purchase options on NLH entitlements: (i) up to 280 MW at a Synthetic Export Price (1/3 New England, 1/3 New York Astoria, 1/3 Ontario PQAT, net of transmission); (ii) up to 240 MW CHPE-equivalent pricing; (iii) up to 200 MW NECEC-equivalent pricing; (iv) Discounted PPA Price at 95% for unplanned unused energy; (v) 1.5× Premium PPA Price on CF entitlements. Three-year notice except (iv) and an initial election at Definitive Agreements. Recapture for domestic load: three-year notice. Framework, not executed.",
    },
    sources: ["dciaHq", "dciaNl"],
  },
  {
    id: "lab-domestic",
    label: "Labrador Interconnected domestic (Rate 1.1L)",
    value: "3.154",
    unit: "¢/kWh",
    status: "published-rate",
    lastVerified: DESK_VERIFIED,
    note: {
      plain:
        "Household power on the Labrador interconnected grid is posted at a bit over three cents a kilowatt-hour, plus a small monthly customer charge. That is a domestic tariff — not a mine rate, and not the Churchill Falls export lore.",
      technical:
        "NL Hydro current-rates page (path spelled “electicity-rates/current-rates”): “For customers on the Labrador Interconnected System, the current rate is 3.154 cents per kWh.” Jul 2026 Schedule, Rate No. 1.1L Domestic (LAB-1), effective 1 Jul 2026: energy 3.154¢/kWh plus basic customer charge $6.87/month (1.5% prompt-pay discount). Availability: Labrador Interconnected service area, Domestic Unit / household premises. Same Hydro page quotes 15.587¢/kWh as the current first-block rate for Island Interconnected, L’Anse au Loup, and Isolated Diesel — that is not Labrador and not industrial. This 3.154¢ figure is not LAB-IND-1.",
    },
    sources: ["nlhCurrentRates", "nlhRates2026"],
  },
  {
    id: "lab-ind-1",
    label: "Labrador Industrial (LAB-IND-1)",
    value: "demand + RFIRM",
    unit: "formula, not one ¢",
    status: "structure",
    lastVerified: DESK_VERIFIED,
    note: {
      plain:
        "Mines on the Labrador bulk grid do not pay one posted household-style cent. They pay demand charges plus a monthly mix of a development energy block and a market energy block. Open the July 2026 PDF. Do not flatten that into a single ¢/kWh on this desk.",
      technical:
        "Jul 2026 Schedule, LAB-IND-1 (pp. LAB-IND-1–4). Availability: Labrador Interconnected bulk transmission ≥66 kV under an Industrial Service Agreement — not Rate 1.1L. Structure: (1) Transmission Demand Charge, closed — $1.08/kW-month of billing demand, existing customers only; specifically assigned transmission charges may apply with Board approval. (2) Generation Demand Charge $0.41/kW-month. Billing demand = greater of Power on Order, actual monthly demand, or calendar-year maximum less interruptible. (3) Firm energy is not a single ¢/kWh. RFIRM = {(ED × RD) + (EM × RM)} / ETOTAL, applied to forecast energy (customer forecast by the 19th of the prior month). RD = Development Block Energy Rate, $29.22/MWh for 1 Jan–31 Dec 2026, then CPI All-items Canada annually. RM = Market Block Energy Rate, $78.61/MWh for 1 Jan–31 Dec 2026, set from NYISO Zone A peak/off-peak settlement after 19 November of the prior year, FX-converted, losses and market fees adjusted. Imbalance energy (above forecast) is a monthly NYISO Zone A blend. Schedule A posts monthly Development Energy Block MWh. RD and RM are formula inputs for 2026 — not a collapsed industrial ¢, not a DCIA PPA, not Rate 1.1L. Full schedule: NL Hydro Jul 2026 PDF.",
    },
    sources: ["nlhRates2026"],
  },
  {
    id: "island-industrial",
    label: "Island Industrial Firm (Island grid — not Labrador)",
    value: "demand + 4.428 + riders",
    unit: "¢ energy base",
    status: "published-rate",
    lastVerified: DESK_VERIFIED,
    note: {
      plain:
        "Island mills and mines sit on a different grid and a different tariff than Labrador. Do not quote this as a Labrador rate.",
      technical:
        "Jul 2026 Schedule, Industrial – Firm (IND-1): Availability is the Interconnected Island bulk transmission grid at ≥66 kV — not the Labrador Interconnected grid, not LAB-IND-1, not Rate 1.1L. Demand $10.73/kW-month. Firm energy base 4.428¢/kWh plus Project Cost Recovery Rider 1.987¢/kWh and CDM Cost Recovery Adjustment 0.007¢/kWh (also P.U. 17(2026) effective 1 Jul 2026). Base rate is subject to RSP adjustments. Specifically assigned annual charges are listed by Island customer. Not a Labrador industrial ¢. Not a DCIA export price.",
    },
    sources: ["nlhRates2026", "pubIsland2026"],
  },
  {
    id: "dcia-industrial-alloc",
    label: "Signed industrial ¢ for new retain",
    value: "UNKNOWN",
    unit: "",
    status: "unknown",
    lastVerified: DESK_VERIFIED,
    note: {
      plain:
        "There is no public, locked cent rate that says what a new Labrador mine — or any other new load — pays for retained Churchill / Gull Island megawatts under the still-unsigned PPAs.",
      technical:
        "UNKNOWN: a published firm industrial tariff for DCIA retain megawatts; a compute tariff; a locked ¢/kWh HQ PPA. Open People does not invent one. Rate 1.1L 3.154¢ and LAB-IND-1’s 2026 RD/RM inputs are current Hydro schedules, not DCIA offtake. Illustrative 4–6¢ “asks” on older campaign material are Open People asks, not government figures, and are not repeated here as rates.",
    },
    sources: ["dciaHq"],
  },
];
