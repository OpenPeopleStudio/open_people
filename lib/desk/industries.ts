import { DESK_VERIFIED } from "./sources";
import type { DeskSourceId } from "./sources";
import type { DeskVoice } from "./types";

export type IndustryCard = {
  id: string;
  title: string;
  rank: "first" | "cited" | "secondary";
  lastVerified: string;
  figure?: string;
  figureNote?: string;
  body: DeskVoice;
  sources: DeskSourceId[];
};

export const INDUSTRY_CARDS: IndustryCard[] = [
  {
    id: "labrador-west-mining",
    title: "Labrador West iron ore — first in line",
    rank: "first",
    lastVerified: DESK_VERIFIED,
    figure: "~312 MW",
    figureNote: "CBC report (15 Jan 2025, 2024 MOU era) of NL Hydro officials on IOC (Labrador City) + Tacora (Wabush), against a 525 MW NLH allocation from Churchill Falls. DCIA Annex B shows the same 525 MW existing-CF volume for NLH in 2027. Press cite, not a PUB order.",
    body: {
      plain:
        "The mines that already live on this grid are the first industrial claim. The west Labrador lines are tight. New large loads wait on a bigger line — and on contracts that still are not signed.",
      technical:
        "CBC reporting of NL Hydro officials: of about 525 MW allocated to NL Hydro from Churchill Falls to energize Labrador, roughly 312 MW is sold to mining companies, specifically Iron Ore Company of Canada in Labrador City and Tacora Resources in Wabush, via two transmission lines from Churchill Falls. Officials described that 525 MW as nearly fully used; new developments above 200 kW in Labrador West require a PUB exemption. Independent corroboration of the 312 MW figure in a current PUB order: not located in this pass — treat as reputable press, not a locked tariff MW.",
    },
    sources: ["cbcMining", "nlhLabWest"],
  },
  {
    id: "labrador-west-line",
    title: "The corridor the mines need",
    rank: "first",
    lastVerified: DESK_VERIFIED,
    figure: "~1,500 MW",
    figureNote: "NL Hydro preferred 735 kV transfer limit from the Labrador West study — a planning figure, not an in-service line.",
    body: {
      plain:
        "Hydro’s own study says the existing west lines are at their limit. A bigger line is the mining-first piece of steel. August’s announcement attaches money. In-service date is still unknown.",
      technical:
        "NL Hydro Labrador West Transmission Expansion Study: Churchill Falls has minimal surplus for new Labrador loads; existing 230 kV lines to Labrador West are at operational limits. Phase 1 preferred a single 735 kV line with a maximum power transfer limit of approximately 1,500 MW. Four large mining customers in Labrador West requested additional power. As of September 2026: FEED under way, geotechnical permits sought for summer/fall 2026, FEED completion targeted December 2026. Government of NL (17 Aug 2026) lists $1 billion (2026 NPV) in federal support for the line as publicly described. Commercial operation date: UNKNOWN.",
    },
    sources: ["nlhLabWest", "govNlDcia", "canadaDcia"],
  },
  {
    id: "named-minerals",
    title: "Critical minerals are the named industrial use",
    rank: "first",
    lastVerified: DESK_VERIFIED,
    body: {
      plain:
        "On announcement day the province named minerals and Labrador industry. It did not name a reserved compute class. Mining stays first until the binding paper says otherwise — and it has not.",
      technical:
        "Government of NL (17 Aug 2026) frames retained capacity as optionality for the province’s industrial development. Public retain language is “up to 2,350 MW” from Churchill Falls and Gull Island plus 400 MW of wind output if built — announcement language, not a signed industrial allocation. Mines minister named minerals in the August framing (as reported on this site’s brief). AI / compute is not a named reserved use in the DCIA Material Terms we read.",
    },
    sources: ["govNlDcia", "dciaHq"],
  },
  {
    id: "towns-rural",
    title: "Towns and Labrador interconnected load",
    rank: "cited",
    lastVerified: DESK_VERIFIED,
    body: {
      plain:
        "Happy Valley–Goose Bay, Churchill Falls townsite, Labrador City, and Wabush already sit on this system. They are not a footnote to a campus pitch.",
      technical:
        "NL Hydro planning material (2017 GRA RFI, historical) split Labrador interconnected peak among HVGB, Churchill Falls, Wabush, and Labrador City rural load in addition to industrial. Current 2026 rural MW split: not restated as a locked figure here. Towns share the same constrained west and central corridors as the mines.",
    },
    sources: ["nlhLabWest"],
  },
];

export const COMPUTE_SECONDARY_LINE: DeskVoice = {
  plain:
    "Compute is a named use of leftover firm power only if the province writes it eligible. It is not a reserved block. The plan for that optionality lives on a separate page.",
  technical:
    "No firm MW, price, queue, or policy preference for Labrador compute is confirmed in the DCIA Material Terms. Mining and Labrador industry remain first. Open People’s energy-use plan for compute is quarantined at /compute.",
};
