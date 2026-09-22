/**
 * First-slice ScaleAnchor pairs. Plain metaphors must point at a live-page
 * technical twin. Do not invent MW, ¢/kWh, $B NPV, or seats.
 */
export const SCALE_ANCHORS = {
  exportScale: {
    technical:
      "Newfoundland and Labrador generates about 43 TWh of renewable electricity a year and exports most of it. The Churchill Falls / Gull Island DCIA, signed 17 August 2026, is a framework — not binding power-purchase agreements. The House endorsed that framework 21–18 on 17 September. The contracts that actually bind the power are still ahead.",
    plain:
      "We make a huge amount of clean electricity — about 43 TWh a year — and ship most of it out. The fight is what we keep for industry here. August’s paper and the September House vote (21–18) are a framework and a political yes. The contracts that lock the power are still ahead.",
    source: "NL generation / export framing on this site",
  },
  retainedMw: {
    technical:
      "Public framing is about 2,350 MW retained from Churchill Falls and Gull Island, plus wind if built. That is announcement language — not a signed industrial allocation, not a compute tranche, and not a published queue.",
    plain:
      "Public talk is enough firm power for a few large industrial campuses — still not a year-by-year signed list of who gets it. That campus scale is an illustration, not a project. Announcement language only: not a signed allocation, not a compute tranche, not a published queue.",
    source: "Aug 17 announcement language — not a signed allocation",
  },
  retainedMwEngage: {
    technical:
      "Public framing is about 2,350 MW retained from Churchill Falls and Gull Island, plus wind if built. That is announcement language, not a signed compute tranche, not a published industrial queue, and not a confirmed preference versus Hydro-Québec or mining.",
    plain:
      "Public talk is enough firm power for a few large industrial campuses — still not a year-by-year signed list of who gets it. That campus scale is an illustration, not a project. Announcement language only: not a signed compute tranche, not a published industrial queue, and not a confirmed preference versus Hydro-Québec or mining.",
    source: "Aug 17 announcement language — not a signed allocation",
  },
  dciaFramework: {
    technical:
      "The Churchill Falls / Gull Island DCIA, signed 17 August 2026, is a framework — not binding power-purchase agreements. The House endorsed that framework 21–18 on 17 September. The contracts that actually bind the power are still ahead.",
    plain:
      "August’s paper and the September House vote (21–18) are a framework and a political yes — the contracts that lock the power are still ahead.",
    source: "17 Aug 2026 DCIA · House 17 Sep 2026",
  },
  federalAssessment: {
    technical:
      "IAAC has not received proponent confirmation that 2026 Gull Island matches the 2012 Lower Churchill scope. The 2026 plant as described is larger than the roughly 2,000 MW reviewed then.",
    plain:
      "Ottawa has not yet confirmed this plant matches the older review — and the 2026 description is larger than what was studied then.",
    source: "IAAC public posture · 2012 Lower Churchill review",
  },
  federalAssessmentEngage: {
    technical:
      "IAAC has said no new federal impact assessment is needed if 2026 Gull Island matches the 2006–2012 Lower Churchill review. The agency has not received proponent confirmation that the scopes match. The 2026 plant as described is larger than the roughly 2,000 MW reviewed then.",
    plain:
      "Ottawa has not yet confirmed this plant matches the older review — and the 2026 description is larger than what was studied then.",
    source: "IAAC public posture · 2012 Lower Churchill review",
  },
} as const;

export const HOME_GATES = [
  {
    v: "21–18",
    technical: "House endorsed the DCIA framework, 17 Sep 2026 — not binding PPAs",
    plain: "September vote is a political yes — not the contracts that lock the power",
  },
  {
    v: "5 Oct",
    technical: "Québec election — next public political gate",
    plain: "Next public political gate is early October in Québec",
  },
  {
    v: "YE 2026",
    technical: "Binding definitive agreements targeted ~31 Dec",
    plain: "Year-end is when binding paper is targeted",
  },
  {
    v: "31 Mar",
    technical: "DCIA instrument can run to 31 Mar 2027 unless replaced",
    plain: "The framework clock can run into March 2027",
  },
] as const;

export const ENGAGE_BINDING_PAPER = {
  title: "Binding paper is still unsigned",
  technical:
    "The House endorsed the DCIA framework 21–18 on 17 September 2026. That vote does not create power-purchase agreements. Definitive agreements are targeted around 31 December 2026. The DCIA instrument can run to 31 March 2027.",
  plain:
    "The House said yes 21–18 in September. That vote does not write the power-purchase contracts. Binding paper is aimed at around year-end. The framework clock can run into March 2027.",
} as const;

export const ENGAGE_QUEBEC_GATE = {
  title: "Québec votes 5 October",
  technical:
    "The next public political gate is the Québec election. It is not an NL door you can walk through. It still matters for the counterparty government.",
  plain:
    "Next public political gate is early October in Québec. It is not an NL door you can walk through. It still matters for the other government on the paper.",
} as const;

export const ENGAGE_HERO_LEDE = {
  technical:
    "The Churchill Falls / Gull Island DCIA is a framework. The House endorsed it. Binding contracts are not signed. There is still time to insist that firm power this province keeps is used here — mines and Labrador industry first. Compute is one named use of that power, not the opener, and not a reserved block.",
  plain:
    "August’s paper and the September House vote are a framework and a political yes — not signed contracts. There is still time to insist that firm power this province keeps is used here — mines and Labrador industry first. Compute is one named use of leftover firm power, not the opener, and not a reserved block.",
} as const;

export const ENGAGE_CHECKS = [
  {
    technical:
      "How in-province power will be metered and scheduled, year by year — not just a headline retain figure.",
    plain: "Who gets the power, year by year — not only a headline retain number.",
  },
  {
    technical: "The contract definition of domestic / in-province load, in words a voter can check.",
    plain: "What “used here” means in the contract, in words a voter can check.",
  },
  {
    technical:
      "What happens to unused retain: default buyer, notice, and price — so leftover megawatts do not slide west by indecision.",
    plain:
      "If we don’t use the retained power, who gets it by default — so leftover megawatts do not slide west by indecision.",
  },
  {
    technical:
      "Whether a recall right is in the signed text, not only in House testimony (including the three-year notice described to MHAs).",
    plain: "Whether the three-year recall talked about in the House is actually in the signed paper.",
  },
  {
    technical:
      "Whether industrial uses beyond mining — towns, other Labrador industry, and compute if the province writes it — are eligible at all.",
    plain:
      "Whether uses beyond mining — towns, other Labrador industry, and compute if the province writes it — are allowed at all.",
  },
  {
    technical:
      "Whether an Innu Nation partnership / royalty / Gull Island tariff path is settled before large Labrador builds lock.",
    plain:
      "Whether the Innu Nation partnership, royalty, and Gull Island tariff path is settled before large Labrador builds lock.",
  },
  {
    technical:
      "Whether the proponent has confirmed that 2026 Gull Island matches the 2012 Lower Churchill federal review scope — or that a new assessment is coming.",
    plain:
      "Whether Ottawa has been told this 2026 plant matches the older review — or that a new assessment is coming.",
  },
] as const;
