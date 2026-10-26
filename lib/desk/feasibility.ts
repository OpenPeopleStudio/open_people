import { DESK_VERIFIED } from "./sources";
import type { DeskVoice } from "./types";

/** Feasibility work. Phase 1 ask shape. No invented rates or reserved megawatts. */

export const FEASIBILITY_LAST_VERIFIED = DESK_VERIFIED;

export const FEASIBILITY_HERO: DeskVoice = {
  plain:
    "Near-term work is feasibility on costs and impact, in general terms. The campus is proposed and in feasibility. Phase 1 is a written request to NL Hydro and a non-firm, interruptible pilot. No megawatts are reserved. It is not approved, not funded, and not under construction. Mines and existing industry are real constraints on the same power.",
  technical:
    "What we are doing now is feasibility work: the costs and the impact of the project, in general terms, until there is a public figure to cite. Phase 1 is a written request to NL Hydro and a non-firm, interruptible pilot. No megawatts are reserved. This page does not publish budgets, money figures, or a funding ask. Mines remain a live constraint on Labrador firm power.",
};

export const FEASIBILITY_SECTIONS = [
  {
    id: "means",
    title: "What feasibility means here",
    body: {
      plain:
        "Feasibility is the public near-term work: costs and impact in general terms. It is not approval. It is not funding. It is not construction. The campus stays proposed until cleared facts say otherwise.",
      technical:
        "Near-term work is feasibility on cost and impact. Status remains proposed / in feasibility — not approved, not funded, not under construction. No reserved block and no utility queue position are claimed on this page.",
    } satisfies DeskVoice,
  },
  {
    id: "phase-1",
    title: "Phase 1 ask shape",
    body: {
      plain:
        "Phase 1 is a written request to NL Hydro and a non-firm, interruptible pilot. No megawatts are reserved. This page does not invent a Labrador rate or a firm allocation.",
      technical:
        "Phase 1 shape: written request to NL Hydro; non-firm, interruptible pilot; no megawatts reserved. Neighbouring-grid tariffs and caps on /compute are context only. NL has published no equivalent data-centre rate claimed here.",
    } satisfies DeskVoice,
  },
  {
    id: "unpublished",
    title: "What stays unpublished until cleared",
    body: {
      plain:
        "No budgets. No money figures. No funding ask. No named customers. When a figure is cleared for the public record, it lands as a new Build board entry.",
      technical:
        "This page does not publish budgets, money figures, or a funding ask. It does not name customers. Cleared external facts require sources on a new Build board entry. Until then, feasibility stays general.",
    } satisfies DeskVoice,
  },
  {
    id: "records",
    title: "Related Build records",
    body: {
      plain:
        "The compute plan is the campus page. This page is the feasibility work beside it. Both sit on the Build track.",
      technical:
        "Build records: /compute (campus plan) and /feasibility (this page). Track door: /build. Power constraints and the Churchill record stay on the Power track.",
    } satisfies DeskVoice,
  },
] as const;
