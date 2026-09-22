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
      "Three different price stories get mashed together in this file. One is the old export lore. One is the structure of the new paper — blocks, inflation, leftover-power options — not a locked industrial tariff. One is what NL Hydro actually charges industrial customers today. We keep them apart.",
    technical:
      "Do not present illustrative MOU ¢/kWh schedules, Annex D target payments, or reported HQ export paths as locked PPAs. Heritage 0.2¢/kWh is the 1969-lineage renewal export price. DCIA Material Terms describe availability / take-or-pay architecture, CPI adjustment, and HQ purchase options. LAB-IND-1 and Island Industrial are current published utility rates — not Churchill Falls offtake.",
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
        "The 1969 Churchill Falls contract’s automatic 25-year renewal (2016–2041) prices HQ purchases at two mills per kWh. A mill is one-tenth of a cent, so two mills is 0.2¢/kWh ($2/MWh). Heritage NL and Feehan & Baker. This is an export price under a specific contract. It is not LAB-IND-1, not Island Industrial, and not a 2027 DCIA PPA rate.",
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
        "Public campaign materials and NL Hydro reporting after 17 Aug 2026 have described Hydro-Québec paying 1.8¢/kWh beginning in 2027, escalating about 14% a year to 11.5¢/kWh by 2041. That is a reported export-path description. It is not in the cents columns of Annex D (which is target $B). It is not LAB-IND-1. Binding PPA ¢/kWh: UNKNOWN until Definitive Agreements are public.",
    },
    sources: ["govNlDcia", "dciaHq"],
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
    id: "lab-ind-dev",
    label: "Labrador Industrial — Development Block (2026)",
    value: "2.922",
    unit: "¢/kWh ($29.22/MWh)",
    status: "published-rate",
    lastVerified: DESK_VERIFIED,
    note: {
      plain:
        "This is a published 2026 Labrador industrial energy block — mines on the Labrador grid — not the Churchill Falls export lore, and not a locked DCIA PPA.",
      technical:
        "NL Hydro Schedule of Rates, Jul 2026, LAB-IND-1 Firm Energy: Development Block Energy Rate effective 1 Jan 2026–31 Dec 2026 is $29.22/MWh (2.922¢/kWh), adjusted annually by CPI All-items Canada. Availability: Labrador Interconnected bulk transmission at ≥66 kV under an Industrial Service Agreement. Closed transmission demand $1.08/kW-month (existing customers only) plus generation demand $0.41/kW-month. This is not a Churchill offtake price.",
    },
    sources: ["nlhRates2026"],
  },
  {
    id: "lab-ind-mkt",
    label: "Labrador Industrial — Market Block (2026)",
    value: "7.861",
    unit: "¢/kWh ($78.61/MWh)",
    status: "published-rate",
    lastVerified: DESK_VERIFIED,
    note: {
      plain:
        "When Labrador industrial load sits above the development block, the extra energy is priced off a New York market print — again, a published 2026 rate, not the deal’s locked PPA.",
      technical:
        "LAB-IND-1 Market Block Energy Rate, 1 Jan 2026–31 Dec 2026: $78.61/MWh (7.861¢/kWh), set annually from NYISO Zone A peak/off-peak settlement after 19 November of the prior year, FX-converted, losses and market fees adjusted. Imbalance energy (above customer forecast) is a monthly NYISO blend. Firm Energy Rate RFIRM = ((ED × RD) + (EM × RM)) / ETOTAL.",
    },
    sources: ["nlhRates2026"],
  },
  {
    id: "island-industrial",
    label: "Island Industrial — firm energy base (2026)",
    value: "4.428 + riders",
    unit: "¢/kWh",
    status: "published-rate",
    lastVerified: DESK_VERIFIED,
    note: {
      plain:
        "Island industrial customers are on a different tariff than Labrador mines. Base energy plus Muskrat-related riders. Do not quote this as a Labrador rate.",
      technical:
        "Island Industrial Firm Energy base 4.428¢/kWh plus demand $10.73/kW-month. P.U. 17(2026): Project Cost Recovery Rider 1.987¢/kWh and CDM 0.007¢/kWh effective 1 Jul 2026. Availability: Island interconnected ≥66 kV. Not LAB-IND-1. Not a DCIA export price.",
    },
    sources: ["pubIsland2026", "nlhRates2026"],
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
        "UNKNOWN: a published firm industrial tariff for DCIA retain megawatts; a compute tariff; a locked ¢/kWh HQ PPA. Open People does not invent one. Illustrative 4–6¢ “asks” on older campaign material are Open People asks, not government figures, and are not repeated here as rates.",
    },
    sources: ["dciaHq"],
  },
];
