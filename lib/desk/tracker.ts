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
        "Newfoundland and Labrador Hydro, Hydro-Québec, and Churchill Falls (Labrador) Corporation Limited signed the Definitive Cooperation and Implementation Agreement dated as of 17 August 2026. Material Terms (Schedule B) are the drafting basis for Definitive Agreements. Those PPAs are not signed. Open People is not a party.",
    },
    sources: ["dciaHq", "dciaNl", "govNlDcia", "canadaDcia", "pmCarneyAug17"],
  },
  {
    id: "material-terms-lock",
    title: "Material terms will not be reopened",
    when: "6 Oct 2026",
    status: "open",
    lastVerified: DESK_VERIFIED,
    href: "https://www.cbc.ca/news/canada/newfoundland-labrador/nl-quebec-churchill-falls-9.7371016",
    hrefLabel: "CBC — Williams and Wakeham, 6 Oct",
    body: {
      plain:
        "NL Hydro’s CEO says the two utilities already agreed the material terms and will not reopen them. About 17 or 18 definitive agreements are still being finished. That is a utility posture, not signed contracts.",
      technical:
        "CBC, 6 Oct 2026: Newfoundland and Labrador Hydro president Jennifer Williams said the 2026 agreement “dealt with all the material issues between the two utilities” and that both utilities have agreed they will not renegotiate the material terms already agreed. Premier Wakeham said there are around 17 to 18 definitive agreements still being worked. Liberal leader Hogan called Williams’s no-renegotiation line “troubling”. These are reported positions. The Definitive Agreements are not signed.",
    },
    sources: ["cbcWilliamsTerms"],
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
        "The House said yes 21–18 after a special sitting, with no referendum. That is a political yes. It does not write power-purchase contracts.",
      technical:
        "The House of Assembly endorsed the DCIA framework 21–18 just after 7 p.m. on 17 September 2026 (PC caucus of 20 plus Independent Eddie Joyce; 15 Liberals, 2 NDP, and Independent Keith Russell opposed; Russell left the PC caucus on 14 September). A referendum was cancelled beforehand — lead negotiator Barry Perry later described the caucus meeting where it was dropped (VOCM, 20 Sep). Reporting describes the vote as continuing toward a final agreement — not as execution of PPAs.",
    },
    sources: ["vocmVote", "ntvVote", "vocmPerry", "saltwireInnu"],
  },
  {
    id: "house-return",
    title: "Back to the House — but no promised vote",
    when: "18 Sep 2026",
    status: "open",
    lastVerified: DESK_VERIFIED,
    href: "https://ntv.ca/politics/breaking-house-of-assembly-votes-in-favour-of-churchill-falls-deal-21-18/",
    hrefLabel: "NTV — Premier on next steps",
    body: {
      plain:
        "The Premier says the deal comes back to the House before the binding contracts are signed. He has not said MHAs will get a vote. The next decision point may have no vote attached.",
      technical:
        "On 18 September 2026 Premier Wakeham said the deal “will return to the House of Assembly prior to definitive agreements” but would not commit to a vote on them (NTV; VOCM). The Oversight Committee (Dan Levert, Julia Mullaley, Mike Jardine) stays on. Liberal leader Hogan called the absence of a further approval mechanism “discouraging”; NDP leader Dinn noted movement on PUB involvement. The NDP’s three unmet conditions (17 Sep): PUB-appointed oversight experts, a debate and vote on the final agreements, Innu approval. UNKNOWN: whether the definitive agreements will be voted on, or only tabled.",
    },
    sources: ["ntvVote", "vocmOpposition", "ndpConditions"],
  },
  {
    id: "binding-window",
    title: "Binding contracts still unsigned",
    when: "~31 Dec 2026 / term to ~31 Mar 2027",
    status: "open",
    lastVerified: DESK_VERIFIED,
    href: "https://www.abetterdealnl.ca/files/DEFINITIVE-COOPERATION-AND-IMPLEMENTATION-AGREEMENT.pdf",
    hrefLabel: "DCIA PDF — Art. 2.1, §6.3, Material Terms",
    body: {
      plain:
        "The parties still say they want the real contracts around year-end. That date is a goal. The mines minister has said slipping past 31 December is not the end of the world: the framework clock can run to 31 March 2027. While it runs, Hydro-Québec holds exclusive rights on Gull Island.",
      technical:
        "DCIA Article 2.1 sets the goal of entering into Definitive Agreements by 31 December 2026 and in any event by the end of the Term. Under §6.3(a) the Term ends on the earliest of execution of the Definitive Agreements, mutual termination, or 31 March 2027 (unless mutually extended in writing). §6.3(b) grants Hydro-Québec exclusivity on Gull Island during the Term. Saltwire/Telegram, 9 Oct 2026, quoting Mines and Energy Minister Lloyd Parrott: if the deal cannot be done by 31 December, “that’s not the end of the world.” No loadable Saltwire URL in this pass — cited by outlet and date. Until those PPAs exist, public retain megawatts are not a signed industrial queue.",
    },
    sources: ["dciaHq", "dciaNl", "saltwireParrott"],
  },
  {
    id: "qc-gate",
    title: "Québec elected a PQ minority",
    when: "5 Oct 2026 · transition 13 Oct",
    status: "open",
    lastVerified: DESK_VERIFIED,
    href: "https://www.cbc.ca/news/canada/montreal/livestory/quebec-election-2026-results-9.7369473",
    hrefLabel: "CBC election night",
    body: {
      plain:
        "Québec elected a Parti Québécois minority on 5 October. St-Pierre Plamondon met Fréchette on 13 October; Churchill Falls came up; no decision was announced. Cabinet is to be sworn in 21 October. The National Assembly returns 17 November.",
      technical:
        "CBC, 5 Oct 2026: Parti Québécois projected 59 of 127 seats, a minority government. Canadian Press via L’actualité, 13 Oct 2026: Paul St-Pierre Plamondon met outgoing premier Christine Fréchette for a transition meeting of under an hour; he listed Churchill Falls among the subjects; they made statements and took no questions; no decision on the deal. Same CP report: cabinet to be sworn in 21 October. National Assembly of Québec: summoned to meet Tuesday 17 November 2026 at 2 p.m., first sitting of the 44th Legislature. Whether the PQ’s promised due-diligence review, or any Assembly vote, changes the Material Terms: UNKNOWN.",
    },
    sources: [
      "qcElectionResult",
      "lactualiteTransition",
      "assnatReturn",
      "cbcWilliamsTerms",
      "qcElection",
    ],
  },
  {
    id: "pub-tech-conf",
    title: "PUB technical conference cancelled",
    when: "8 Oct 2026",
    status: "open",
    lastVerified: DESK_VERIFIED,
    body: {
      plain:
        "The PUB’s 8 October technical conference was cancelled. Whether a later Board process attaches to the definitive agreements is still not written.",
      technical:
        "The Board of Commissioners of Public Utilities’ 8 October 2026 technical conference was cancelled. No loadable URL was located in this pass — cited as PUB, 8 Oct 2026. The NDP’s unmet conditions still include PUB-appointed oversight experts. Whether a later PUB process attaches to the Definitive Agreements: UNKNOWN.",
    },
    sources: ["pubTechConf", "ndpConditions"],
  },
  {
    id: "gull-island",
    title: "Gull Island size is still a range",
    when: "Material Terms as of 17 Aug 2026",
    status: "framework",
    lastVerified: DESK_VERIFIED,
    href: "https://www.abetterdealnl.ca/files/DEFINITIVE-COOPERATION-AND-IMPLEMENTATION-AGREEMENT.pdf",
    hrefLabel: "DCIA Schedule A / B / Annex B",
    body: {
      plain:
        "Public paper describes a new Churchill River plant in a range — not one locked size — and says studies still have to finish. First power is pencilled for the mid-2030s. The project is still not filed with the federal impact assessment agency. The Innu dispute is unresolved. Do not treat a press headline as a commissioned megawatt.",
      technical:
        "Schedule A §2 describes Gull Island as approximately 2,250 MW or 2,700 MW depending on final configuration (5 or 6 units), subject to technical and environmental studies. Schedule B §2(e): NLH’s GI volume interpolates on a straight line between 266 MW and 432 MW (example 2,475 MW → 349 MW). Annex B (2,700 MW case) shows first Gull volumes in 2036 (1,350 MW) and the full 2,700 MW from 2037; Canada.ca says “online target of 2036–2037”. That is a preliminary schedule, not a locked COD. Gull Island is still not filed with the Impact Assessment Agency of Canada. The 2012 Lower Churchill federal review was on the order of 2,000 MW; IAAC confirmation that 2026 equals 2012 is not in the DCIA PDF. Innu Nation partnership, royalty, and GI tariff path remain unresolved — see the Innu row.",
    },
    sources: ["dciaHq", "dciaNl", "canadaDcia", "cbcIaac"],
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
        "CF Upgrades are a Development Project in the DCIA. Schedule A §1: 11 units, about +23.5% (approximately 1,275 MW), for a total rated capacity of approximately 6,703 MW. Annex B (17 Aug 2026) shows a preliminary ramp: 464 MW (2035), 580, 695, 811, 927, 1,043, 1,159 (2041), 1,275 MW from 2042. Approximate capacity figures and expected completion timelines are subject to detailed studies. CF Upgrades PPAs are described as availability / cost-plus, with NLH recapture on three-year notice. Not commissioned. Not a signed offtake for new Labrador industrial load.",
    },
    sources: ["dciaHq", "dciaNl"],
  },
  {
    id: "labrador-west",
    title: "New line to the mining corridor",
    when: "October 2026 contractor notice",
    status: "framework",
    lastVerified: DESK_VERIFIED,
    href: "https://nlhydro.com/wp-content/uploads/2026/10/Notice-to-Contractors-OCT2026_V3.pdf",
    hrefLabel: "NL Hydro Notice to Contractors, Oct 2026",
    body: {
      plain:
        "Hydro’s October contractor notice describes a 735 kV line from Churchill Falls to Labrador West with a 1,500 MW maximum — a ceiling, not a guaranteed block. Design work is aimed at December 2026. Construction contracts are expected early 2028. Nobody has published when it switches on.",
      technical:
        "NL Hydro Notice to Contractors, October 2026: preferred option is a single 735 kV line from Churchill Falls to Labrador West, maximum transfer approximately 1,500 MW. That 1,500 MW is a ceiling, not a reserved industrial block. Front End Engineering Design (FEED) for the line and stage-one Flora Lake terminal is targeted for December 2026. Construction RFPs for the Churchill Falls terminal, Flora Lake terminal, and the transmission line are listed as project-approval pending, anticipated Q1 2028. Government of NL (17 Aug 2026) lists $1 billion (2026 NPV) in federal support for construction of the line as publicly described. Existing 230 kV lines serving IOC / Tacora remain at operational limits. In-service date: not published.",
    },
    sources: ["nlhContractorOct", "nlhLabWest", "govNlDcia", "canadaDcia", "cbcMining"],
  },
  {
    id: "mine-queue",
    title: "Mines are already competing for the same megawatts",
    when: "Jun 2026 · Kami Sep 2025",
    status: "open",
    lastVerified: DESK_VERIFIED,
    href: "https://www.cbc.ca/news/canada/newfoundland-labrador/iron-bear-mining-9.7249642",
    hrefLabel: "CBC — Iron Bear",
    body: {
      plain:
        "Iron Bear wants nearly a third of the Churchill Falls expansions. Kami has Nippon Steel and Sojitz as partners. Those claims sit on the same unmetered retain. There is still no published queue.",
      technical:
        "CBC, 28 Jun 2026: Iron Bear managing director Paul Berend said the project is looking for “nearly a third of all the expansions of Churchill Falls.” Power access remains unscheduled. Champion Iron, 29 Sep 2025: the Kami project formed a partnership with Nippon Steel and Sojitz. No public year-by-year meter or industrial queue allocates retained Churchill / Gull Island megawatts among these mines, or anyone else. UNKNOWN: a published queue.",
    },
    sources: ["cbcIronBear", "championKami", "dciaHq"],
  },
  {
    id: "wind-spe",
    title: "Wind company not named",
    when: "DCIA Schedule B §7",
    status: "unknown",
    lastVerified: DESK_VERIFIED,
    href: "https://www.abetterdealnl.ca/files/DEFINITIVE-COOPERATION-AND-IMPLEMENTATION-AGREEMENT.pdf",
    hrefLabel: "DCIA Material Terms §7 (Wind)",
    body: {
      plain:
        "A large Labrador wind study sits in the paper. The public summary puts the estimated capital cost at $8 billion. The company that would own it is not named. Do not invent a developer.",
      technical:
        "Schedule B §7: upon execution of the Definitive Agreements, NLH leads a feasibility study for a new 2,000 MW wind farm in NL (cost-plus 30-year PPA assumed; about eight years study-to-COD). If undertaken and completed, the Wind Project would be owned and operated by a new special-purpose entity held as NLH may determine in its sole discretion; HQ would be the majority off-taker with the balance to NLH. Annex B shows NLH wind at 400 MW from 2039. HQ pays GNL $400,000 per MW (about $640M on 1,600 MW) on completion of FEL 1–3, permits and PPA. Agreement Summary p.13: estimated capital cost $8B. SPE legal name / developer: UNKNOWN. A 100% CPP-held “A” company: UNKNOWN — do not invent it. Federal equity percentage is not in the Material Terms we read.",
    },
    sources: ["dciaHq", "dciaNl", "govNlDcia", "agreementSummary"],
  },
  {
    id: "innu",
    title: "Innu Nation issues still open",
    when: "15–21 Sep 2026",
    status: "open",
    lastVerified: DESK_VERIFIED,
    href: "https://vocm.com/2026/09/21/premier-has-yet-to-contact-innu-about-hydro-deal-says-grand-chief/",
    hrefLabel: "VOCM — Grand Chief, 21 Sep",
    body: {
      plain:
        "Innu Nation urged MHAs not to vote and says the paper cuts its benefits by more than half. The Premier said outstanding issues need to be resolved and that he looks forward to sitting down. Partnership remains open. As of 21 September the Grand Chief said the Innu are ready to meet, no meeting is scheduled, and it is always the Innu reaching out. Nothing large on that land proceeds without that work.",
      technical:
        "On 15 September 2026 Innu Nation, Sheshatshiu and Natuashish wrote asserting Churchill River waterway rights (VOCM). On 17 September Innu Nation wrote MHAs urging a no vote, delivered minutes before the vote, citing serious concerns over Gull Island payments; Grand Chief Jodie Ashini said benefits were cut “by over half” versus the 2024 MOU (CBC; Radio-Canada 18 Sep; no figures released). Premier Wakeham said outstanding issues need to be resolved and that he looks forward to sitting down. Partnership remains open — not a ratified Innu Nation partnership, royalty, or GI tariff path. VOCM (21 Sep): Ashini said Premier Wakeham has yet to contact the Innu Nation after the House vote — “it’s always us reaching out to him” — that the Innu are “ready and willing to meet”, and that they were never invited to the DCIA table. Independent MHA Keith Russell (Lake Melville) cited “ultimate disrespect” to the Innu in explaining his no vote. DCIA fundamental principles commit the parties to consulting Indigenous communities. Contact gap and partnership path: unresolved.",
    },
    sources: [
      "vocmInnu",
      "vocmInnuContact",
      "vocmInnuReady",
      "saltwireInnu",
      "radioCanadaInnu",
      "vocmInnuWaterway",
      "vocmRussell",
      "dciaHq",
    ],
  },
  {
    id: "qc-innu",
    title: "Innu in Québec say consent is mandatory",
    when: "Aug 2026 — ongoing",
    status: "open",
    lastVerified: DESK_VERIFIED,
    href: "https://www.aptnnews.ca/national-news/innu-in-quebec-reject-churchill-falls-deal-between-quebec-newfoundland-and-labrador/",
    hrefLabel: "APTN",
    body: {
      plain:
        "Innu communities on the Québec side say their consent is required too, and their older court case over Churchill Falls is still alive. That is a second Indigenous file on the same river.",
      technical:
        "Uashat mak Mani-utenam and Matimekush-Lac John have said their consent is mandatory for the Churchill Falls arrangements; their reparations case over the original development remains before the Québec courts (APTN). Distinct from Innu Nation (Labrador). No settlement or accommodation step tied to the DCIA has been published. UNKNOWN: how the Definitive Agreements treat this.",
    },
    sources: ["aptnQcInnu"],
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
        "DCIA Annex F: HQ target payments for existing CF adjust from a 2027 CPI base (Statistics Canada All-items, Canada) with a deadband centred on 2.06% ± 0.40% (1.66–2.46%), cumulative and reviewed annually from 2028. LAB-IND-1 (Jul 2026): firm energy is RFIRM = {(ED × RD) + (EM × RM)} / ETOTAL — Development and Market block rates are 2026 formula inputs, not a single industrial ¢/kWh. See /costs#contested: CP24 1.8¢ start (2027) vs 7.4¢ 50-year average — different measurements. Annex D $ → industrial ¢: UNKNOWN.",
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
  {
    id: "necec-chpe",
    title: "US export lines are live — and interruptible",
    when: "Jan–Jul 2026",
    status: "open",
    lastVerified: DESK_VERIFIED,
    href: "https://www.eia.gov/todayinenergy/detail.php?id=67105",
    hrefLabel: "EIA — NECEC in-service and held back",
    body: {
      plain:
        "The New England line came online 16 January 2026 and stopped 24–26 January when Québec held power back for its own demand. The New York line went commercial in May 2026, then had an outage for repairs. Those are Hydro-Québec’s routes. NL’s paper names equivalent access. It is not a wire NL owns.",
      technical:
        "EIA, 30 Jan 2026: the New England Clean Energy Connect (NECEC, 1,200 MW) began commercial operation on 16 January 2026. On 24–26 January, during Winter Storm Fern, power flows on NECEC stopped as Québec limited electricity exports to meet domestic demand. EIA, 20 Jul 2026: the Champlain Hudson Power Express (CHPE, 1,250 MW) reached commercial operations in May 2026, ran at full capacity on 3 July, had an outage in June, and was taken offline again on 4 July for further repairs. DCIA Material Terms name CHPE-equivalent access up to 240 MW and NECEC-equivalent access up to 200 MW, on three-year notice — paper rights on HQ’s lines, not NL-owned wires.",
    },
    sources: ["eiaNecec", "eiaChpe", "dciaHq", "govNlDcia"],
  },
];
