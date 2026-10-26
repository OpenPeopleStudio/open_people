/**
 * Home front door. Company and campus share the lead.
 * Churchill Falls is background, not the opener.
 * Do not name a nation as a partner. Do not invent figures.
 */

export const HOME_HEADLINE_COMPANY = "An AI company.";
export const HOME_HEADLINE_CAMPUS = "A proposed Labrador AI campus.";

export const HOME_LEDE_COMPANY =
  "Open People is a Newfoundland and Labrador company. Tom Lane is the founder.";

export const HOME_LEDE_CAMPUS =
  "Open People leads a proposed 500 MW Labrador AI campus, in feasibility.";

/** Canonical campus line. Use after a sentence that names the power. */
export const HOME_CAMPUS_CANONICAL =
  "Open People leads a proposed 500 MW Labrador AI campus on that power, in feasibility.";

export const HOME_POWER_CONTEXT =
  "The firm, clean power that can host it already exists in this province.";

export const HOME_POWER_LINE =
  "The campus is proposed and in feasibility. Phase 1 is a written request to NL Hydro and a non-firm, interruptible pilot. No megawatts are reserved.";

export const HOME_CONSENT = "Partnership, if any, will be on terms each nation sets.";

export const HOME_ISED_CRITERIA =
  "ISED lists Indigenous participation as one of its criteria. Any role is for each nation to decide.";

export const HOME_STATUS =
  "It is not approved. It is not funded. It is not under construction. Mines and existing industry are real constraints on the same power.";

export const HOME_RESEARCH =
  "We also lead a proposed research campus beside it: residencies, fellowships, gatherings, in the spirit of the Perimeter Institute and the Banff Centre.";

export const HOME_OTTAWA_HEADING = "Ottawa is looking for projects like this";

export const HOME_OTTAWA_CALL =
  "ISED invited proposals for sovereign, large-scale AI data centres with planned capacity greater than 100 MW. The call ran from 15 January to 15 February 2026. It is now closed. Selected projects may enter a non-binding memorandum of understanding.";

export const HOME_OTTAWA_STRATEGY =
  "A separate programme, the Canadian Sovereign AI Compute Strategy, was announced in Budget 2024 as $2 billion over five years, starting in 2024–25. That is not the 100 MW call.";

export const HOME_CHURCHILL =
  "Open People is not a party to the Churchill Falls agreement. The public power record is on the tracker, the brief, and the power track.";

export const HOME_COMPANY_CLOSE = "Write to tom@openpeople.ai.";

export const HOME_TITLE = `Open People — ${HOME_HEADLINE_COMPANY} ${HOME_HEADLINE_CAMPUS}`;

export const HOME_DESCRIPTION = `${HOME_LEDE_COMPANY} ${HOME_LEDE_CAMPUS} ${HOME_POWER_LINE}`;

export const HOME_OTTAWA_SOURCES = [
  "isedDataCentreCall",
  "isedDataCentreIntake",
  "isedComputeStrategy",
] as const;

export function homePublicText() {
  return [
    HOME_HEADLINE_COMPANY,
    HOME_HEADLINE_CAMPUS,
    HOME_LEDE_COMPANY,
    HOME_LEDE_CAMPUS,
    HOME_POWER_CONTEXT,
    HOME_CAMPUS_CANONICAL,
    HOME_POWER_LINE,
    HOME_CONSENT,
    HOME_ISED_CRITERIA,
    HOME_STATUS,
    HOME_RESEARCH,
    HOME_OTTAWA_HEADING,
    HOME_OTTAWA_CALL,
    HOME_OTTAWA_STRATEGY,
    HOME_CHURCHILL,
    HOME_COMPANY_CLOSE,
    HOME_TITLE,
    HOME_DESCRIPTION,
  ].join("\n");
}
