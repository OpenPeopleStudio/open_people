import { DESK_VERIFIED } from "./sources";
import type { DeskVoice } from "./types";

/** Quarantined compute-use plan. No reserved MW. Hogan: calm public precision. */

export const COMPUTE_LAST_VERIFIED = DESK_VERIFIED;

export const COMPUTE_HERO: DeskVoice = {
  plain:
    "This page is Open People’s energy-use plan for compute — not a campus pitch, not a reserved block, and not the front door of the site. Mines and Labrador industry come first. Compute is leftover-firm-power optionality if the province writes it eligible.",
  technical:
    "Quarantine page for compute. The DCIA Material Terms do not name AI or data centres as a reserved industrial class. No firm MW, price, queue, or policy preference for Labrador compute is confirmed. Open People is not a DCIA party, offtake seat, or demand seat. Partners would own any steel.",
};

export const COMPUTE_RULES = [
  {
    title: "Mining first",
    body: {
      plain:
        "Operating mines and the Labrador West corridor are first in line. This page does not jump that queue.",
      technical:
        "Public retain language and the mines-minister framing are industrial / minerals. LAB-IND-1 and the Labrador West transmission constraint are the live industrial facts. Compute does not get a modelled reservation against those planks.",
    } satisfies DeskVoice,
  },
  {
    title: "Named optionality, not a tranche",
    body: {
      plain:
        "If leftover firm power is written eligible for named uses, compute can be one of those uses. Eligibility is a contract-text question still ahead.",
      technical:
        "Schedule B §4 ties NLH entitlements to “domestic load” without defining compute as eligible. Until Definitive Agreements or a provincial framework say otherwise, compute is optionality — not Annex B capacity.",
    } satisfies DeskVoice,
  },
  {
    title: "No reserved megawatts",
    body: {
      plain:
        "Open People does not hold megawatts, a price, or a queue position. Anyone reading this as a Labrador campus build plan has the wrong page — and the wrong organisation.",
      technical:
        "No Open People offtake, FID path, or reserved Labrador DC block. Path C: constituent / catalyst; if partners later build capacity, software layer only. Illustrative 100–150 MW “asks” in older brief copy are campaign asks, not government figures, and are not a reservation.",
    } satisfies DeskVoice,
  },
] as const;

export const COMPUTE_NEIGHBOURS: DeskVoice = {
  plain:
    "Other provinces are rationing large new computing loads. That is context for leftover hydro — not a Labrador booking.",
  technical:
    "Québec has proposed a dedicated data-centre tariff (Hydro-Québec, Feb 2026, Régie pending) reported at 13¢/kWh. British Columbia and Alberta have capped or screened large AI / crypto-adjacent load. Those postures do not allocate Labrador megawatts. They are neighbouring-grid facts, quarantined here so they do not open the public site.",
};

export const COMPUTE_HONESTY = [
  "That the province will allocate firm Labrador power to compute over mining — not proven; minerals are named first.",
  "Fibre economics for a training cluster at hyperscale path diversity — unproven; Labrador backbone is thin.",
  "That public-sector demand alone banks a facility — not proven.",
  "That binding agreements free near-term megawatts for a compute node — House endorsement is not that signature.",
] as const;
