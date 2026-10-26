import { DESK_VERIFIED } from "./sources";
import type { DeskVoice } from "./types";

/** Proposed Labrador campus. Open People leads. Proposed / in feasibility only. */

export const COMPUTE_LAST_VERIFIED = DESK_VERIFIED;

export const COMPUTE_HERO: DeskVoice = {
  plain:
    "Open People leads a proposed 500 MW AI data campus in Labrador, and a research campus beside it. It is proposed, and it is in feasibility. It is not approved, not funded, and not under construction. Mines and existing industry are real constraints on the same power. The public work right now is keeping firm power in the province. This page is the campus, and only that.",
  // Home board still renders this technical string. Do not edit until that rewrite lands.
  technical:
    "Open People is the proponent. Proposed scale: 500 MW of AI data-centre load in Labrador, plus a research campus (residencies, fellowships, gatherings). Status is only proposed / in feasibility — not a reserved block, not a utility queue position, not a construction programme. Proposed partners: NL Hydro, Indigenous nations (consent first), and capital. None of those are named as signed. The DCIA Material Terms still do not name AI as a reserved industrial class.",
};

/** /compute lede only. Not used on home. */
export const COMPUTE_PAGE_TECHNICAL =
  "Open People is the proponent. Proposed scale: 500 MW of AI data-centre load in Labrador, plus a research campus (residencies, fellowships, gatherings). Status is only proposed / in feasibility — not a reserved block, not a utility queue position, not a construction programme. The campus is proposed and in feasibility. Phase 1 is a written request to NL Hydro and a non-firm, interruptible pilot. No megawatts are reserved. Partnership, if any, will be on terms each nation sets. No nation has been asked about this project. Capital is unnamed here. The DCIA Material Terms still do not name AI as a reserved industrial class.";

export const COMPUTE_RULES = [
  {
    title: "Mines and existing industry are real constraints",
    body: {
      plain:
        "Operating mines and the Labrador West corridor are already on this system. A campus does not jump that queue. The power is finite. We say so on this page.",
      technical:
        "Public retain language and the mines-minister framing are industrial / minerals. LAB-IND-1 and the Labrador West transmission constraint are live industrial facts. A 500 MW proposal has to live with those facts. It is not a modelled reservation against them.",
    } satisfies DeskVoice,
  },
  {
    title: "Open People leads",
    body: {
      plain:
        "This is a Labrador campus build plan, and this is the organisation. Open People is the proponent: we lead the proposed 500 MW campus and the research campus. We intend to seek early, respectful engagement with each nation. No partnership or agreement exists. Partnership, if any, is on terms each nation sets.",
      technical:
        "Role: Open People leads. We intend to seek early, respectful engagement with each nation. No partnership or agreement exists. Partnership, if any, is on terms each nation sets. Capital is unnamed here. That is not a signed offtake, not an impact-benefit agreement, and not a named funder. No customers are named on this page.",
    } satisfies DeskVoice,
  },
  {
    title: "Proposed. In feasibility.",
    body: {
      plain:
        "The campus is proposed and in feasibility. Phase 1 is a written request to NL Hydro and a non-firm, interruptible pilot. No megawatts are reserved. Near-term work is feasibility on costs and impact, in general terms.",
      technical:
        "Schedule B §4 still ties NLH entitlements to “domestic load” without defining compute as eligible. House endorsement of the DCIA is not an allocation to this campus. Nothing here is a budget, a dollar figure, or a funding ask.",
    } satisfies DeskVoice,
  },
] as const;

export const COMPUTE_NEIGHBOURS: DeskVoice = {
  plain:
    "Other provinces are rationing large new computing loads. That is neighbouring-grid context. It is not a Labrador booking, and it is not a reason to pretend mines are not on this system.",
  technical:
    "Hydro-Québec’s 19 February 2026 press release framed a 13¢/kWh data-centre rate for loads of 5 MW and up (blockchain 19.5¢). The 4 August 2026 Régie filing (R-4333-2026-B-0076) is a two-part Rate CD: $32.704/kW-month plus 8.710¢/kWh. Those are Québec figures, not a Labrador tariff. NL has published no equivalent. British Columbia’s regulation in force from 1 February 2026 caps allocations at 100 MW conventional plus 300 MW AI data-centre load for two years, and its crypto-mining moratorium is permanent. Alberta’s AESO 1,200 MW interim large-load limit (to 2028) is described by the province as fully taken, with a Data Centre Regulation in effect since June 2026. Those postures do not allocate Labrador megawatts.",
};

export const COMPUTE_HONESTY = [
  "That the province will allocate firm Labrador power to this campus over mining — not proven; minerals are named first in the public paper. Mines are a real constraint.",
  "Fibre economics for a training cluster at hyperscale path diversity — unproven; Labrador backbone is thin.",
  "That public-sector demand alone banks a facility — not proven.",
  "That binding DCIA agreements free near-term megawatts for a compute node — House endorsement is not that signature.",
] as const;
