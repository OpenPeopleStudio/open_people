/**
 * Public /vision thesis. Proposal language only.
 * Do not add dollar figures, funding asks, named customers, or build-status claims.
 */

export const VISION_TITLE = "Vision — Open People";
export const VISION_CANONICAL = "/vision";

export const VISION_HEADLINE_LEAD = "People who care for this land should";
export const VISION_HEADLINE_EMPHASIS = "prosper from it";

export const VISION_DESCRIPTION =
  "Newfoundland and Labrador hydro as Canada’s base for sovereign AI compute. Open People leads a proposed 500 MW Labrador AI campus and a research campus, in feasibility.";

export const VISION_OG_ALT =
  "Vision — Open People. Firm hydro in Newfoundland and Labrador as Canada’s base for sovereign AI compute. Open People leads a proposed 500 MW Labrador AI campus, in feasibility.";

/** Tom Lane’s four-sentence statement. Keep verbatim as the close. */
export const VISION_SENTENCES = [
  "People who care for this land should prosper from it.",
  "People working toward a shared goal should share in what it yields.",
  "Big goals raise hard questions; hard questions lead to discovery, and a better life for everyone who calls Earth home.",
  "Explorers bring us together.",
] as const;

export const VISION_CONTACT = "tom@openpeople.ai";

export const VISION_LEDE = {
  plain:
    "Newfoundland and Labrador’s hydro can be Canada’s base for sovereign AI compute — tied to the national grid and to federal sovereign-AI goals. This is a proposal for how the country uses its power, not a story about one site.",
    technical:
      "The public thesis is national: dispatchable Newfoundland and Labrador hydro as a foundation for Canadian-controlled AI compute, connected into the national grid and aligned with federal sovereign-AI aims. Open People is the proponent of a proposed Labrador campus and a research campus. Nothing on this page is an allocation, a contract, or a construction schedule.",
} as const;

export const VISION_SECTIONS = [
  {
    id: "thesis",
    num: "01 — The thesis",
    title: "A country-scale use of firm hydro.",
    plain:
      "Canada needs compute it actually controls. The firm, clean power that can host it already exists in this province. The question is whether the country uses it that way — on the national grid, for sovereign AI — instead of treating Labrador as a leftover of one deal.",
    technical:
      "Sovereign AI compute needs firm, carbon-free capacity and a path onto the national grid. Newfoundland and Labrador hydro is that kind of resource. This page proposes that national use. It does not say Ottawa or St. John’s has designated a site, reserved megawatts, or signed offtake.",
  },
  {
    id: "campus",
    num: "02 — A proposed campus",
    title: "500 MW in Labrador. Proposed. In feasibility.",
    plain:
      "Open People leads a proposed 500 MW AI data campus in Labrador. We lead it, in proposed partnership with NL Hydro, Indigenous nations — consent first — and capital. It is proposed, and it is in feasibility. It is not approved. It is not funded. It is not under construction. Mines and existing industry are real constraints on the same power.",
    technical:
      "Open People is the proponent. Proposed scale: 500 MW of AI data-centre load in Labrador. Treat that figure as a proposal, not a reserved block and not a utility queue position. Proposed partners are categories, not signed names: NL Hydro, Indigenous nations (consent first), and capital. No customers are named. Status is only proposed / in feasibility. Mines remain a live constraint on Labrador firm power.",
  },
  {
    id: "research",
    num: "03 — A research campus",
    title: "People, not only machines.",
    plain:
      "Open People also leads a proposed research campus: people from across Canada coming to work on the problems society will face in the age of AI. Residencies, fellowships, gatherings. In the spirit of the Perimeter Institute and the Banff Centre — a Canadian house for hard questions, not a visitor gallery for a data hall.",
    technical:
      "Open People is the proponent of a proposed research campus in Newfoundland and Labrador, aimed at national participation: residencies, fellowships, and gatherings on the societal problems of the AI age. Perimeter Institute and the Banff Centre are named as spirit, not as partners, hosts, or funders. No programme size, calendar, or endowment is published here.",
  },
  {
    id: "near-term",
    num: "04 — Near term",
    title: "Feasibility on costs and impact.",
    plain:
      "What we are doing now is feasibility work: the costs and the impact of the project, in general terms, until there is a public figure to cite.",
    technical:
      "Near-term work is feasibility on cost and impact. This page does not publish budgets, dollar figures, or a funding ask. It does not name government programmes. Contact is tom@openpeople.ai only.",
  },
] as const;

export function visionPublicText() {
  return [
    VISION_TITLE,
    VISION_DESCRIPTION,
    VISION_LEDE.plain,
    VISION_LEDE.technical,
    ...VISION_SECTIONS.flatMap((s) => [s.title, s.plain, s.technical]),
    ...VISION_SENTENCES,
    VISION_CONTACT,
  ].join("\n");
}
