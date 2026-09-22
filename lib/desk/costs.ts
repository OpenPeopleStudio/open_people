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
      "This page keeps five price stories apart so they do not mash. The old export lore. The new paper’s dollar-and-inflation structure — not a locked industrial tariff. What Hydro posts for Labrador households. The mine tariff, which is a formula, not one cent. And two public Hydro-Québec export stories — a start and a life average — that are different measurements.",
    technical:
      "Do not present illustrative MOU ¢/kWh schedules, Annex D target payments, or reported HQ export paths as locked PPAs. Heritage 0.2¢/kWh is the 1969-lineage renewal export price (labeled heritage). DCIA Material Terms (17 Aug 2026): availability / take-or-pay, Annex D target $ + Annex F CPI, HQ purchase options. Rate No. 1.1L is Labrador Interconnected domestic, 3.154¢/kWh (Jul 2026 schedule; Hydro current-rates page). LAB-IND-1 is demand plus a monthly RFIRM formula — not one ¢/kWh. Island Industrial Firm is a different class on the Island grid. None of these is Churchill Falls offtake. Reported 1.8¢/kWh (2027 start) and 7.4¢/kWh (~50-year average) are labeled separately below. Annex D $ → locked ¢ tariff: UNKNOWN.",
  } satisfies DeskVoice,
};

/**
 * Two public ¢ stories about HQ’s Churchill Falls offtake. Labeled, not merged.
 * Source lock: CP24 17 Aug 2026 (corrected) — 1.8¢ start in 2027 vs 7.4¢ average
 * over ~50 years (2027–2077). Annex D is target $ + CPI, not a voter industrial ¢.
 */
export const CONTESTED_EXPORT = {
  lastVerified: DESK_VERIFIED,
  kicker: "Contested communications — not a locked industrial ¢",
  title: "Starts about 1.8¢/kWh in 2027. Averages about 7.4¢/kWh over ~50 years.",
  intro: {
    plain:
      "Those are two different measurements, not a contradiction to mash into one number.",
    technical:
      "Canadian Press via CP24, 17 Aug 2026 (corrected): a graph provided to media showed Hydro-Québec paying 1.8¢/kWh beginning in 2027, rising through 2077, averaging 7.4¢/kWh over the next 50 years. Prior MOU average cited ~5.9¢. 1.8 is the starting reported path; 7.4 is the life average. Do not reconcile them into one number. DCIA Annex D (17 Aug 2026) is target $ payments; Annex F is CPI. Converting Annex D into a voter ¢/kWh industrial tariff without a published method: UNKNOWN. Heritage 0.2¢/kWh is the 1969-lineage comparator (labeled heritage). LAB-IND-1 stays a formula, not one ¢. Open People is not a DCIA party.",
  } satisfies DeskVoice,
  start: {
    id: "start-18",
    label: "Starts about 1.8¢/kWh in 2027",
    value: "1.8",
    unit: "¢/kWh in 2027",
    status: "reported" as const,
    lastVerified: DESK_VERIFIED,
    note: {
      plain: "The starting price on the press graph — not the fifty-year average.",
      technical:
        "Canadian Press via CP24, 17 Aug 2026 (corrected): graph provided to media — Hydro-Québec pays 1.8¢/kWh beginning in 2027. That 1.8¢ is the starting reported path, not the 7.4¢ life average. Financial Post (18 Aug 2026) separately described a rise to 11.5¢/kWh by 2041; that is a reported path, not the 50-year average. Annex D is not this ¢: it posts target $ payments. Not a locked industrial PPA ¢ for Labrador mines or compute.",
    } satisfies DeskVoice,
    sources: ["cpChurchillGraph", "financialPostPath"] as DeskSourceId[],
  },
  average: {
    id: "average-74",
    label: "Averages about 7.4¢/kWh over ~50 years",
    value: "7.4",
    unit: "¢/kWh over ~50 years",
    status: "reported" as const,
    lastVerified: DESK_VERIFIED,
    note: {
      plain: "The life average on the same graph — not the 2027 starting price.",
      technical:
        "Canadian Press via CP24, 17 Aug 2026 (corrected): “averaging out to an effective price of 7.4 cents per kilowatt hour over the next 50 years.” Prior 2024 MOU average cited ~5.9¢/kWh. 7.4 is that 50-year average — not the 1.8¢ 2027 start. This desk prefers CP24’s start-plus-average framing over other 7.4 wording. Not a locked industrial PPA ¢ for Labrador mines or compute.",
    } satisfies DeskVoice,
    sources: ["cpChurchillGraph"] as DeskSourceId[],
  },
  bridge: {
    id: "cents-bridge",
    label: "Annex D $ → voter industrial ¢",
    value: "UNKNOWN",
    unit: "",
    status: "unknown" as const,
    lastVerified: DESK_VERIFIED,
    note: {
      plain:
        "The paper pays target dollars, then inflation. Nobody has published how to turn that table into a locked industrial cent. We do not invent it.",
      technical:
        "UNKNOWN: a published method that converts DCIA Annex D (17 Aug 2026) target $ payments into a locked ¢/kWh industrial tariff. Annex D posts yearly “Payments by HQ for existing CF volumes” in $B (2027: $0.531B beside 29.207 TWh). Annex F CPI-adjusts those payments (Statistics Canada All-items, Canada; 2027 base). Annex D is not a ¢ column. Open People does not invent a payment÷TWh industrial ¢, and does not reconcile 7.4 with Annex D. Heritage 0.2¢/kWh remains the 1969-lineage comparator (labeled heritage). LAB-IND-1 stays a formula. None of 7.4, 1.8, or 11.5 is a locked industrial PPA ¢ for Labrador mines or compute.",
    } satisfies DeskVoice,
    sources: ["dciaHq", "dciaNl", "cpChurchillGraph"] as DeskSourceId[],
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
        "Material Terms: HQ’s New CF PPA is an availability contract with fixed target payments (Annex D), monthly invoicing, term 1 Jan 2027–31 Dec 2077, CPI adjustment (Annex F) from a 2027 base with a deadband centred on 2.06% ± 0.40% (Statistics Canada All-items, Canada). NLH’s New CF PPA is take-or-pay, same blended price and CPI mechanism, first-out-of-plant. Annex D’s 2027 cell is $0.531B on 29.207 TWh — a $ table, not a ¢ column. Converting Annex D alone into a voter ¢/kWh industrial tariff: UNKNOWN (see contested communications). These Definitive Agreements are not signed.",
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
        "Public reporting after 17 Aug 2026 has described Hydro-Québec paying 1.8¢/kWh beginning in 2027, escalating about 14% a year to 11.5¢/kWh by 2041. That is a reported export-path description. It is not the CP24 7.4¢ 50-year average. It is not in the cents columns of Annex D (which is target $B + CPI). It is not LAB-IND-1. Binding PPA ¢/kWh: UNKNOWN until Definitive Agreements are public. See contested communications on this page.",
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
