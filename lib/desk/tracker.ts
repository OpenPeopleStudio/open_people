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
    when: "6 Oct · 17 Nov 2026",
    status: "open",
    lastVerified: DESK_VERIFIED,
    href: "https://www.cbc.ca/news/canada/newfoundland-labrador/nl-quebec-churchill-falls-9.7371016",
    hrefLabel: "CBC — Williams and Wakeham, 6 Oct",
    body: {
      plain:
        "NL Hydro’s CEO says the two utilities already agreed the material terms and will not reopen them. About 17 or 18 definitive agreements are still being finished. On 17 November the energy minister said those agreements are coming based on the DCIA, with small language still to be worked out. That is a utility and ministerial posture, not signed contracts.",
      technical:
        "CBC, 6 Oct 2026: Newfoundland and Labrador Hydro president Jennifer Williams said the 2026 agreement “dealt with all the material issues between the two utilities” and that both utilities have agreed they will not renegotiate the material terms already agreed. Premier Wakeham said there are around 17 to 18 definitive agreements still being worked. Liberal leader Hogan called Williams’s no-renegotiation line “troubling”. These are reported positions. Hansard, 17 Nov 2026 (CONFIRMED): Energy Minister Parrott said “The definitive agreements are coming and they are coming based on the DCIA. The DCIA lays out the material terms for the contract.” He also said small language is still to be worked out. The Definitive Agreements are not signed.",
    },
    sources: ["cbcWilliamsTerms", "hansard17Nov", "vocmComing18Nov"],
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
    title: "No promised vote on the final contracts",
    when: "18 Sep · 28 Oct · 17 Nov 2026",
    status: "open",
    lastVerified: DESK_VERIFIED,
    href: "https://www.gov.nl.ca/releases/2026/exec/1028n03/",
    hrefLabel: "Government of NL, 28 Oct",
    body: {
      plain:
        "On 28 October the government said the finished contracts will be tabled, with briefings and a proposed special debate. It has not promised MHAs a vote before those contracts are completed. Gary Smith is lead negotiator. Barry Perry stays on as special advisor. On 28 October an Opposition motion asked for a debate and vote on the final agreements before they are signed. It was defeated 16–21. On 17 November the energy minister said the definitive agreements are coming based on the DCIA, with small language still to be worked out.",
      technical:
        "On 18 September 2026 Premier Wakeham would not commit to a vote on the definitive agreements (NTV; VOCM). The Oversight Committee (Dan Levert, Julia Mullaley, Mike Jardine) stays on. Liberal leader Hogan called the absence of a further approval mechanism “discouraging”; NDP leader Dinn noted movement on PUB involvement. The NDP’s three unmet conditions (17 Sep): PUB-appointed oversight experts, a debate and vote on the final agreements, Innu approval. On 28 October the Government of NL said that, once completed, the definitive agreements will be tabled, Members will get technical briefings, and government will propose a special debate. The three Oversight Committee members continue. The province is reviewing recommendations from the Chair of the PUB on adding members to that committee. Barry Perry moves from lead negotiator to Special Advisor. Gary Smith, former executive vice-president of operations and technology at Fortis Inc. and former president and CEO of Newfoundland Power, is lead negotiator. Hansard, 28 Oct 2026, p. 2886: Official Opposition private Member’s resolution (J. Hogan) asking that final DCIA / Churchill River agreements come to the House for debate and a vote before they are signed or binding; defeated on Division, ayes 16, nays 21. Saltwire/Telegram, 28 Oct 2026 (REPORTED): debate after the agreements are finalized; no vote to pass them. Hansard, 17 Nov 2026 (CONFIRMED): Parrott said the definitive agreements are “coming based on the DCIA,” with small language still to be worked out. VOCM, 17 Nov 2026 (REPORTED): Opposition ministers were asked repeatedly whether final agreements would come back to the House before they were signed. Hansard, 18 and 24 Nov 2026 (CONFIRMED, partially edited): referendum questions continued; nothing was voted on Churchill Falls in this window. UNKNOWN: whether the definitive agreements will be voted on.",
    },
    sources: [
      "ntvVote",
      "vocmOpposition",
      "ndpConditions",
      "hansard28Oct",
      "govNlSmith",
      "saltwireHouseOct28",
      "hansard17Nov",
      "vocmQp17Nov",
      "hansard18Nov",
      "hansard24Nov",
    ],
  },
  {
    id: "binding-window",
    title: "Binding contracts still unsigned",
    when: "~31 Dec 2026 / term to ~31 Mar 2027",
    status: "open",
    lastVerified: DESK_VERIFIED,
    href: "https://www.assembly.nl.ca/HouseBusiness/Hansard/ga51session1/26-11-18.htm",
    hrefLabel: "Hansard, 18 Nov — no extension",
    body: {
      plain:
        "The parties still say they want the real contracts around year-end. That date is a goal. On 18 November the energy minister told the House the 31 December goal and the 31 March fallback have not been extended. The mines minister has said slipping past 31 December is not the end of the world: the framework clock can run to 31 March 2027. While it runs, Hydro-Québec holds exclusive rights on Gull Island.",
      technical:
        "DCIA Article 2.1 sets the goal of entering into Definitive Agreements by 31 December 2026 and in any event by the end of the Term. Under §6.3(a) the Term ends on the earliest of execution of the Definitive Agreements, mutual termination, or 31 March 2027 (unless mutually extended in writing). §6.3(b) grants Hydro-Québec exclusivity on Gull Island during the Term. Saltwire/Telegram, 9 Oct 2026, quoting Mines and Energy Minister Lloyd Parrott: if the deal cannot be done by 31 December, “that’s not the end of the world.” No loadable Saltwire URL in this pass — cited by outlet and date. Hansard, 18 Nov 2026 (CONFIRMED, partially edited): Parrott said “there has been no extension” and “We never extended the date.” The goal remains 31 December, with 31 March as the fallback. VOCM, 23 Nov 2026 (REPORTED): the fall fiscal update books no Churchill Falls income. Government of NL, 23 Nov 2026 (CONFIRMED): a projected surplus of $78 million; the ministerial statement names Churchill River developments as a reason for optimism, not booked revenue. Until those PPAs exist, public retain megawatts are not a signed industrial queue.",
    },
    sources: [
      "dciaHq",
      "dciaNl",
      "saltwireParrott",
      "hansard18Nov",
      "vocmFiscalUpdate23Nov",
      "govNlFallUpdate23Nov",
    ],
  },
  {
    id: "qc-gate",
    title: "Québec elected a PQ minority",
    when: "5 Oct 2026 · 15–17 Nov",
    status: "open",
    lastVerified: DESK_VERIFIED,
    href: "https://www.cbc.ca/news/canada/montreal/livestory/quebec-election-2026-results-9.7369473",
    hrefLabel: "CBC election night",
    body: {
      plain:
        "Québec elected a Parti Québécois minority on 5 October. St-Pierre Plamondon met Fréchette on 13 October; Churchill Falls came up; no decision was announced. He was sworn in with a 23-minister cabinet on 21 October. The National Assembly returned on 17 November. On 13 November Québec’s energy minister said the deal is not set in stone. On 16 November Premier Wakeham said it will not be renegotiated, and the negotiating teams are back at work on the final contracts. On 17 November he said he would be patient while Québec reviews the deal. Québec has not named the clauses it disputes. A meeting with Québec’s premier is being arranged; no date is public. Prime Minister Carney and St-Pierre Plamondon discussed Churchill Falls on 15 November in Phnom Penh. A further meeting is planned for December in Québec City.",
      technical:
        "CBC, 5 Oct 2026: Parti Québécois projected 59 of 127 seats, a minority government. Canadian Press via L’actualité, 13 Oct 2026: Paul St-Pierre Plamondon met outgoing premier Christine Fréchette for a transition meeting of under an hour; he listed Churchill Falls among the subjects; they made statements and took no questions; no decision on the deal. CBC, 21 Oct 2026 (REPORTED): he was sworn in as premier with a cabinet of 23 ministers. National Assembly of Québec: summoned to meet Tuesday 17 November 2026 at 2 p.m., first sitting of the 44th Legislature. CBC, 16 Nov 2026 (REPORTED): Energy Minister Stéphane Paquet told Montreal radio 98.5FM on 13 November that the deal is not set in stone; Premier Wakeham told the House on 16 November, “The deal will not be renegotiated.” VOCM, 16 Nov 2026, reports the same exchange. CBC, 17 Nov 2026 (REPORTED): Wakeham said he is prepared to be patient while Québec’s new government scrutinizes the deal they inherited, and that the deal will not be renegotiated. CBC: Québec has not clarified what it would like changed. Saltwire/Telegram and Radio-Canada, 17 Nov 2026 (REPORTED): a Wakeham–St-Pierre Plamondon meeting is being arranged; no date. Radio-Canada: one phone call since 5 Oct. La Presse, 15–16 Nov 2026 (REPORTED): Carney and St-Pierre Plamondon met about 45 minutes in Phnom Penh; Churchill Falls was discussed; a further meeting is set for December in Québec City. Whether Churchill Falls was debated or voted in the National Assembly: UNKNOWN. Whether the PQ’s promised due-diligence review changes the Material Terms: UNKNOWN.",
    },
    sources: [
      "qcElectionResult",
      "lactualiteTransition",
      "assnatReturn",
      "cbcQcCabinet",
      "cbcWilliamsTerms",
      "qcElection",
      "cbcPaquet16Nov",
      "vocmRenegotiate16Nov",
      "cbcPatient17Nov",
      "radioCanadaNoRequest17Nov",
      "saltwireSetInStone17Nov",
      "vocmNoRework17Nov",
      "laPresseCarneyPspp15Nov",
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
        "Schedule A §2 describes Gull Island as approximately 2,250 MW or 2,700 MW depending on final configuration (5 or 6 units), subject to technical and environmental studies. Schedule B §2(e): NLH’s GI volume interpolates on a straight line between 266 MW and 432 MW (example 2,475 MW → 349 MW). Annex B (2,700 MW case) shows first Gull volumes in 2036 (1,350 MW) and the full 2,700 MW from 2037; Canada.ca says “online target of 2036–2037”. That is a preliminary schedule, not a locked COD. Gull Island is still not filed with the Impact Assessment Agency of Canada. The 2012 Lower Churchill federal review was on the order of 2,000 MW; IAAC confirmation that 2026 equals 2012 is not in the DCIA PDF. The Narwhal, 24 Nov 2026 (REPORTED), and Budget 2026 chapter 2 (CONFIRMED): the Labrador Trough corridor was referred to the Major Projects Office in August. That is a federal process, not an IAAC filing. Innu Nation partnership, royalty, and GI tariff path remain unresolved — see the Innu row.",
    },
    sources: ["dciaHq", "dciaNl", "canadaDcia", "cbcIaac", "narwhalMastersNov24", "budget2026Chap2"],
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
    when: "Oct 2026 · 6 Nov cost",
    status: "framework",
    lastVerified: DESK_VERIFIED,
    href: "https://nlhydro.com/wp-content/uploads/2026/10/Notice-to-Contractors-OCT2026_V3.pdf",
    hrefLabel: "NL Hydro Notice to Contractors, Oct 2026",
    body: {
      plain:
        "Hydro’s October contractor notice describes a 735 kV line from Churchill Falls to Labrador West with a 1,500 MW maximum — a ceiling, not a guaranteed block. Design work is aimed at December 2026. Construction contracts are expected early 2028. The finance minister said in November the line now costs about $3 billion, up from $2.6 billion in August (reported). That is not an NL Hydro estimate. Nobody has published when it switches on.",
      technical:
        "NL Hydro Notice to Contractors, October 2026: preferred option is a single 735 kV line from Churchill Falls to Labrador West, maximum transfer approximately 1,500 MW. That 1,500 MW is a ceiling, not a reserved industrial block. Front End Engineering Design (FEED) for the line and stage-one Flora Lake terminal is targeted for December 2026. Construction RFPs for the Churchill Falls terminal, Flora Lake terminal, and the transmission line are listed as project-approval pending, anticipated Q1 2028. Government of NL (17 Aug 2026) lists $1 billion (2026 NPV) in federal support for construction of the line as publicly described. Radio-Canada, 6 Nov 2026 (REPORTED): Finance Minister Pardy said the Churchill Falls–Wabush line now comes to $3 billion, up from $2.6 billion in August, mainly because of inflation. Financing would come from the federal government, NL Hydro and private interests. Pardy: Ottawa has promised $1 billion. That $3 billion is a ministerial figure via press, not an NL Hydro estimate. Existing 230 kV lines serving IOC / Tacora remain at operational limits. In-service date: not published.",
    },
    sources: [
      "nlhContractorOct",
      "nlhLabWest",
      "govNlDcia",
      "canadaDcia",
      "cbcMining",
      "radioCanadaLabWestCost6Nov",
    ],
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
    when: "4 Nov · 19 Nov 2026",
    status: "open",
    lastVerified: DESK_VERIFIED,
    href: "https://vocm.com/2026/11/04/315670/",
    hrefLabel: "VOCM — meeting, 4 Nov",
    body: {
      plain:
        "Innu Nation urged MHAs not to vote and says the paper cuts its benefits by more than half. On 4 November the Grand Chief confronted the Premier at a St. John’s mining conference and they met the same morning. Further talks are to be in Sheshatshiu. On 19 November the Premier told the House that ministers met the Grand Chief that day. Innu Nation has not said publicly what was discussed. The Sheshatshiu visit has no public date. That is contact, not consent. Partnership remains open. Nothing large on that land proceeds without that work.",
      technical:
        "On 15 September 2026 Innu Nation, Sheshatshiu and Natuashish wrote asserting Churchill River waterway rights (VOCM). On 17 September Innu Nation wrote MHAs urging a no vote, delivered minutes before the vote, citing serious concerns over Gull Island payments; Grand Chief Jodie Ashini said benefits were cut “by over half” versus the 2024 MOU (CBC; Radio-Canada 18 Sep; no figures released). Premier Wakeham said outstanding issues need to be resolved and that he looks forward to sitting down. Partnership remains open — not a ratified Innu Nation partnership, royalty, or GI tariff path. VOCM (21 Sep): Ashini said Premier Wakeham has yet to contact the Innu Nation after the House vote — “it’s always us reaching out to him” — that the Innu are “ready and willing to meet”, and that Grand Chief Ashini of Innu Nation has said Innu were “never invited to the table”. Independent MHA Keith Russell (Lake Melville) cited “ultimate disrespect” to the Innu in explaining his no vote. VOCM, 4 Nov 2026: at the Minerals Resource Review, Delta Hotel, St. John’s, Ashini said Churchill Falls will not go ahead unless the Innu get their meeting, and raised the province’s contention that Innu presence in Labrador dates back 300 years. They met for two to three hours (VOCM: nearly two; CBC: nearly three). He said “I have not spoken about 300 years, nor do I intend to,” that the Innu had requested the meeting on the Monday and the government agreed, and that further talks would be in Sheshatshiu. Ashini said the Innu are not against the project, are not an afterthought, and have not been at the table. NTV, 4 Nov: they met; there is still no resolution. Hansard, 19 Nov 2026 (CONFIRMED as the Premier’s statement only, partially edited): Wakeham told the House that “Today, the Innu Nation, a couple of my ministers had meetings with the Grand Chief.” He did not answer whether Innu support will come before signing. No Innu Nation statement of that meeting was found. The Sheshatshiu visit has no public date. Contact, not consent. The Narwhal, 24 Nov 2026 (REPORTED): Innu Nation’s 2020 suit against Hydro-Québec, quoted as “$4 billion”, is still in court; “A settlement failed in 2025 because too few members voted.” Do not treat those quotes as a new position. DCIA fundamental principles commit the parties to consulting Indigenous communities. Partnership path: unresolved; not a ratified partnership.",
    },
    sources: [
      "vocmInnu",
      "vocmInnuContact",
      "vocmInnuReady",
      "saltwireInnu",
      "radioCanadaInnu",
      "vocmInnuWaterway",
      "vocmRussell",
      "vocmInnuNov4",
      "vocmInnuMeet",
      "ntvInnuNov4",
      "hansard19Nov",
      "narwhalMastersNov24",
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
        "Innu communities on the Québec side say their consent is required too, and their older court case over Churchill Falls is still alive. That is a second Indigenous file on the same river. Pessamit is a further Québec Innu voice, quoted, not a position imputed to any nation.",
      technical:
        "Uashat mak Mani-utenam and Matimekush-Lac John have said their consent is mandatory for the Churchill Falls arrangements; their reparations case over the original development remains before the Québec courts (APTN). Distinct from Innu Nation (Labrador). The Narwhal, 24 Nov 2026 (REPORTED): Pessamit vice-chief Audrey-Lise Rock-Hervieux said, “When I hear ‘chez nous,’ I think, ‘Nitassinan.’” The same piece quotes that “the word ‘consent’ appears only once in the budget.” Those are quotes. They do not stand for any nation’s position on the DCIA. No settlement or accommodation step tied to the DCIA has been published. UNKNOWN: how the Definitive Agreements treat this.",
    },
    sources: ["aptnQcInnu", "narwhalMastersNov24", "budget2026Chap2"],
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
    when: "Material Terms Annex F · 23–24 Nov",
    status: "open",
    lastVerified: DESK_VERIFIED,
    href: "https://nlhydro.com/wp-content/uploads/2026/07/Schedule-of-Rates-Rules-and-Regulations_Jul_2026.pdf",
    hrefLabel: "NL Hydro rates (Jul 2026)",
    body: {
      plain:
        "Export payments on the new paper move with a Canadian inflation band. Labrador industrial energy already splits a development block from a market block. Those are different machines. Do not mash them into one “cheap power” number. In November the finance minister told the House that market-based pricing did not fit the deal. The Premier said export payments on the Upper Churchill rise every year.",
      technical:
        "DCIA Annex F: HQ target payments for existing CF adjust from a 2027 CPI base (Statistics Canada All-items, Canada) with a deadband centred on 2.06% ± 0.40% (1.66–2.46%), cumulative and reviewed annually from 2028. LAB-IND-1 (Jul 2026): firm energy is RFIRM = {(ED × RD) + (EM × RM)} / ETOTAL — Development and Market block rates are 2026 formula inputs, not a single industrial ¢/kWh. See /costs#contested: CP24 1.8¢ start (2027) vs 7.4¢ 50-year average — different measurements. Annex D $ → industrial ¢: UNKNOWN. Hansard, 23 Nov 2026 (CONFIRMED, partially edited): Finance Minister Pardy said market-based pricing “didn't fit with the deal.” Hansard, 24 Nov 2026 (CONFIRMED, partially edited): Hogan quoted that line; Wakeham said the deal “has certainty that every single year the power that we sell to Quebec for the Upper Churchill will go up.” That is political confirmation that CF export pricing is an escalator, not market-indexed.",
    },
    sources: ["dciaHq", "nlhRates2026", "hansard23Nov", "hansard24Nov"],
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
