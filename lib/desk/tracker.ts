import { DESK_VERIFIED } from "./sources";
import type { DeskItem } from "./types";

export const TRACKER_ITEMS: DeskItem[] = [
  {
    id: "dcia",
    title: "Cooperation paper signed",
    when: "17 Aug 2026",
    status: "framework",
    lastVerified: DESK_VERIFIED,
    href: "https://news.hydroquebec.com/content/dam/salle-des-nouvelles/pdfs/en/DCIA_Hydro-Qu%C3%A9bec%20et%20Newfoundland%20and%20Labrador%20Hydro-%20August%2017%202026.pdf",
    hrefLabel: "Primary PDF (Hydro-Québec)",
    body: {
      plain:
        "NL Hydro, Hydro-Québec, and CF(L)Co signed a cooperation paper in August. It is a framework for writing later contracts — not the contracts that lock the power.",
      technical:
        "Newfoundland and Labrador Hydro, Hydro-Québec, and Churchill Falls (Labrador) Corporation Limited signed the Definitive Cooperation and Implementation Agreement on 17 August 2026. Material Terms (Schedule B) are the drafting basis for Definitive Agreements. Those PPAs are not signed. Open People is not a party.",
    },
    sources: ["dciaHq", "dciaNl", "govNlDcia"],
  },
  {
    id: "house",
    title: "House said yes 21–18",
    when: "17 Sep 2026",
    status: "endorsed",
    lastVerified: DESK_VERIFIED,
    href: "https://vocm.com/2026/09/17/churchill-falls-deal-passes-vote-in-house-of-assembly/",
    hrefLabel: "VOCM vote report",
    body: {
      plain:
        "The House said yes 21–18 after a special sitting. That is a political yes. It does not write power-purchase contracts.",
      technical:
        "The House of Assembly endorsed the DCIA framework 21–18 on 17 September 2026 (PC caucus plus Independent Eddie Joyce; Liberals, NDP, and Independent Keith Russell opposed). Reporting describes this as continuing toward a final agreement — not as execution of PPAs.",
    },
    sources: ["vocmVote", "saltwireInnu"],
  },
  {
    id: "binding-window",
    title: "Binding contracts still unsigned",
    when: "~31 Dec 2026 / term to ~31 Mar 2027",
    status: "open",
    lastVerified: DESK_VERIFIED,
    href: "https://www.abetterdealnl.ca/files/DEFINITIVE-COOPERATION-AND-IMPLEMENTATION-AGREEMENT.pdf",
    hrefLabel: "DCIA PDF — term + Material Terms",
    body: {
      plain:
        "The parties say they want the real contracts around year-end. The framework clock can run into March 2027 unless they replace or extend it.",
      technical:
        "DCIA Article 2.1 targets Definitive Agreements by 31 December 2026, and in any event by the end of the Term. The Term includes 31 March 2027 unless mutually extended in writing. Until those PPAs exist, public retain megawatts are not a signed industrial queue.",
    },
    sources: ["dciaHq", "dciaNl"],
  },
  {
    id: "qc-gate",
    title: "Québec votes 5 October",
    when: "5 Oct 2026",
    status: "open",
    lastVerified: DESK_VERIFIED,
    body: {
      plain:
        "The next public political gate is the Québec election. It is not an NL door you can walk through. It still matters for the other government on the paper.",
      technical:
        "Québec’s 5 October 2026 provincial election is the next public political gate for the Hydro-Québec / Government of Québec counterparty. It is not an NL legislative door. Outcome is UNKNOWN until the vote.",
    },
    sources: ["govNlDcia"],
  },
  {
    id: "gull-island",
    title: "Gull Island size is still a range",
    when: "Material Terms as of 17 Aug 2026",
    status: "framework",
    lastVerified: DESK_VERIFIED,
    href: "https://www.abetterdealnl.ca/files/DEFINITIVE-COOPERATION-AND-IMPLEMENTATION-AGREEMENT.pdf",
    hrefLabel: "DCIA Schedule B / Annex B",
    body: {
      plain:
        "Public paper describes a new Churchill River plant in a range — not one locked size — and says studies still have to finish. Do not treat a press headline as a commissioned megawatt.",
      technical:
        "Material Terms describe Gull Island as expected installed capacity of approximately 2,250 MW or 2,700 MW depending on final configuration, subject to technical and environmental studies. If installed capacity falls between those bounds, NLH’s GI volume interpolates (example: 2,475 MW → 349 MW to NLH, midpoint of 266–432 MW). Annex B shows preliminary energy on-line in the mid-2030s. That is a sourced schedule, not a locked COD. The 2012 Lower Churchill federal review was on the order of 2,000 MW; IAAC confirmation that 2026 equals 2012 is not in the DCIA PDF.",
    },
    sources: ["dciaHq", "dciaNl"],
  },
  {
    id: "cf-upgrades",
    title: "Upgrades to the existing plant",
    when: "Annex B as of 17 Aug 2026",
    status: "framework",
    lastVerified: DESK_VERIFIED,
    href: "https://www.abetterdealnl.ca/files/DEFINITIVE-COOPERATION-AND-IMPLEMENTATION-AGREEMENT.pdf",
    hrefLabel: "DCIA Annex B (preliminary)",
    body: {
      plain:
        "The paper also talks about upgrading the existing Churchill Falls plant over time. The year-by-year megawatts in the annex are a joint preliminary picture — they move if the projects move.",
      technical:
        "CF Upgrades are a Development Project in the DCIA. Annex B (17 Aug 2026) shows a preliminary ramp beginning in the early 2030s and reaching about 1,275 MW of upgrade capacity by the early 2040s in the tabulated cases. Approximate capacity figures and expected completion timelines are subject to detailed studies. CF Upgrades PPAs are described as availability / cost-plus, with NLH recapture on three-year notice. Not commissioned. Not a signed offtake for new Labrador industrial load.",
    },
    sources: ["dciaHq", "dciaNl"],
  },
  {
    id: "labrador-west",
    title: "New line to the mining corridor",
    when: "Aug 2026 announcement + Hydro study",
    status: "framework",
    lastVerified: DESK_VERIFIED,
    href: "https://nlhydro.com/about-us/our-electricity-system/major-projects/labrador-west-transmission-expansion/",
    hrefLabel: "NL Hydro Labrador West study",
    body: {
      plain:
        "The mining corridor from Churchill Falls to Labrador West is already tight. The August announcement funds a new line. That is money attached to a corridor — not a signed list of who gets the power.",
      technical:
        "NL Hydro’s Labrador West study: existing 230 kV lines from Churchill Falls to Labrador West are at operational limits; a preferred 735 kV solution would allow a maximum transfer on the order of 1,500 MW. Government of NL (17 Aug 2026) describes the Labrador West line as funded, including federal support as publicly framed. Existing lines serving IOC / Tacora are the mining-first constraint. In-service date for the new line: UNKNOWN in the DCIA PDF we checked.",
    },
    sources: ["nlhLabWest", "govNlDcia", "cbcMining"],
  },
  {
    id: "wind-spe",
    title: "Wind company not named",
    when: "DCIA §13 / Material Terms §13",
    status: "unknown",
    lastVerified: DESK_VERIFIED,
    href: "https://www.abetterdealnl.ca/files/DEFINITIVE-COOPERATION-AND-IMPLEMENTATION-AGREEMENT.pdf",
    hrefLabel: "DCIA Material Terms §13",
    body: {
      plain:
        "A large Labrador wind study sits in the paper. The company that would own it is not named. Do not invent a name, a dollar figure, or a federal share.",
      technical:
        "Material Terms §13: after Definitive Agreements, NLH leads a feasibility study for a new 2,000 MW wind farm in NL. If undertaken and completed, the Wind Project would be owned and operated by a new special-purpose entity held as NLH may determine in its sole discretion. HQ would be a majority off-taker with the balance to NLH, following studies. Public retain framing of +400 MW to NL if built is announcement language (Gov NL 17 Aug). SPE legal name: UNKNOWN. A ~$8B / 100% CPP-held “A” company: UNKNOWN — do not invent it. Federal equity percentage is not in the Material Terms we read.",
    },
    sources: ["dciaHq", "dciaNl", "govNlDcia"],
  },
  {
    id: "innu",
    title: "Innu Nation issues still open",
    when: "17–18 Sep 2026",
    status: "open",
    lastVerified: DESK_VERIFIED,
    href: "https://vocm.com/2026/09/18/310730/",
    hrefLabel: "VOCM — Innu letter",
    body: {
      plain:
        "Innu Nation asked MHAs not to vote. The Premier said he will sit down. Partnership, royalty, and Gull Island tariff path are not settled. Nothing large on that land proceeds without that work.",
      technical:
        "On 17 September 2026 Innu Nation wrote MHAs urging a no vote. Reporting cited concerns on Gull Island payments and unresolved history. Premier Wakeham said outstanding issues need to be resolved and that he looks forward to sitting down. DCIA fundamental principles commit the parties to consulting Indigenous communities; that is not a ratified Innu Nation partnership, royalty, or GI tariff path. Status: unresolved.",
    },
    sources: ["vocmInnu", "saltwireInnu", "dciaHq"],
  },
  {
    id: "metering",
    title: "No public year-by-year meter",
    when: "Still open in public text",
    status: "unknown",
    lastVerified: DESK_VERIFIED,
    body: {
      plain:
        "The public still does not have a year-by-year meter of who gets retained power. A headline retain number is not a schedule.",
      technical:
        "Material Terms allocate capacity in Annex B and say NLH volumes are “first out of plant,” but a voter-checkable year-by-year metering and scheduling protocol for in-province industrial use is not published as a signed exhibit. UNKNOWN: public meter, queue, and industrial nomination rules.",
    },
    sources: ["dciaHq"],
  },
  {
    id: "domestic-load",
    title: "What “used here” means is still thin",
    when: "Still open in public text",
    status: "unknown",
    lastVerified: DESK_VERIFIED,
    body: {
      plain:
        "The paper says retained power is for “domestic load” — and then lists ways leftover power can be sold west. What “used here” means in words a voter can check is still thin.",
      technical:
        "Schedule B §4: NLH’s CF, CF Upgrades, and GI capacity and energy entitlements “will only be used to serve its domestic load or as otherwise provided in this Section 4.” Section 4 then lists HQ purchase options. A contract definition of domestic / in-province load (mines, towns, other industry, compute) that a voter can check is not in the public Material Terms we read. UNKNOWN.",
    },
    sources: ["dciaHq"],
  },
  {
    id: "cpi-vs-market",
    title: "Inflation path is not a market path",
    when: "Material Terms Annex F · LAB-IND-1",
    status: "open",
    lastVerified: DESK_VERIFIED,
    href: "https://nlhydro.com/wp-content/uploads/2026/07/Schedule-of-Rates-Rules-and-Regulations_Jul_2026.pdf",
    hrefLabel: "NL Hydro rates (Jul 2026)",
    body: {
      plain:
        "Export payments on the new paper move with a Canadian inflation band. Labrador industrial energy already splits a development block from a market block. Those are different machines. Do not mash them into one “cheap power” number.",
      technical:
        "DCIA Annex F: HQ target payments for existing CF adjust from a 2027 CPI base (Statistics Canada All-items, Canada) with a deadband centred on 2.06% ± 0.40%. LAB-IND-1 (Jul 2026): firm energy is RFIRM = {(ED × RD) + (EM × RM)} / ETOTAL — Development and Market block rates are 2026 formula inputs, not a single industrial ¢/kWh. See /costs. Binding PPA ¢/kWh path for HQ: not a locked industrial tariff."
    },
    sources: ["dciaHq", "nlhRates2026"],
  },
  {
    id: "unused-retain",
    title: "Unused retain already has a buyer",
    when: "Material Terms §4",
    status: "open",
    lastVerified: DESK_VERIFIED,
    href: "https://www.abetterdealnl.ca/files/DEFINITIVE-COOPERATION-AND-IMPLEMENTATION-AGREEMENT.pdf",
    hrefLabel: "DCIA Material Terms §4",
    body: {
      plain:
        "If NL does not use retained power at home, the paper already names ways Hydro-Québec can buy it — including a discounted default if there is no three-year notice. Leftover megawatts do not sit still by magic.",
      technical:
        "Schedule B §4(b)(iv): unplanned unused energy to serve domestic load may be sold to HQ at 95% of the applicable PPA price (Discounted PPA Price). HQ is obligated to purchase. Other HQ sale options (synthetic export up to 280 MW; CHPE-equivalent up to 240 MW; NECEC-equivalent up to 200 MW; 1.5× premium on CF entitlements) require at least three years’ prior notice. Recapture of volumes previously sold to HQ, for domestic load, is also on three-year notice. These are Material Terms for later PPAs — not executed offtake.",
    },
    sources: ["dciaHq", "dciaNl"],
  },
];
