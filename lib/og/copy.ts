/**
 * Public share-card copy. Open People is the company; the file is what we publish.
 * No ¢/kWh on the image. Compute may name the proposed 500 MW. Mining remains first.
 *
 * Home card:
 *   Kicker:    OPEN PEOPLE · NEWFOUNDLAND AND LABRADOR
 *   Dominant:  Keep the power here.
 *   Secondary: Open People is on it.
 *   Footer:    OPEN PEOPLE · NL / OPENPEOPLE.AI
 * Compute: A 500 MW Labrador campus. / Open People leads.
 */

export type DeskOgCard = {
  kicker: string;
  kickerAccent: string;
  headline: string;
  accent: string;
  footer: string;
  alt: string;
  quiet?: boolean;
};

export function deskOgKicker(card: DeskOgCard): string {
  return `${card.kicker} · ${card.kickerAccent}`.toUpperCase();
}

export function deskOgFooterUrl(card: DeskOgCard): string {
  return card.footer.toUpperCase();
}

export const HOME_TITLE = "Open People — Keep the power here";
export const HOME_DESCRIPTION =
  "Open People is working to keep firm Churchill Falls / Gull Island power in Newfoundland and Labrador. Mining first. We publish what is signed and what is still blank. Compute is a separate page.";

/** Document / og / twitter title for /brief. Template adds " · Open People". */
export const BRIEF_TITLE = "Keep the power here: the Labrador case";
/**
 * Search snippet for /brief. Matched to page body: hydro-dominated / green /
 * cleanest large power; campus proposed, in feasibility; first facility kept
 * deliberately small; NL Hydro a proposed partner, not a reserved block.
 * Does not name a nation, quote 5,428 MW, or imply that plant is for sale.
 */
export const BRIEF_DESCRIPTION =
  "Labrador runs on clean hydro. Open People's proposed campus starts small, in feasibility, with NL Hydro as a proposed partner, not a reserved block.";

export const DESK_OG = {
  home: {
    kicker: "OPEN PEOPLE",
    kickerAccent: "NEWFOUNDLAND AND LABRADOR",
    headline: "Keep the power here.",
    accent: "Open People is on it.",
    footer: "OPENPEOPLE.AI",
    alt: "Open People. Keep firm Churchill Falls and Gull Island power in Newfoundland and Labrador. Mining first.",
  },
  tracker: {
    kicker: "Tracker",
    kickerAccent: "Open People",
    headline: "What’s signed. What’s open.",
    accent: "We publish the blanks.",
    footer: "openpeople.ai/tracker",
    alt: "Open People tracker — what is signed, what is open, and what we still cannot say from the public text.",
  },
  costs: {
    kicker: "Costs",
    kickerAccent: "Open People",
    headline: "Seven price stories.",
    accent: "We will not merge them.",
    footer: "openpeople.ai/costs",
    alt: "Open People costs — seven price stories. We keep them labelled and do not merge them.",
  },
  industries: {
    kicker: "Industries",
    kickerAccent: "Open People",
    headline: "Mining first.",
    accent: "Then the wire.",
    footer: "openpeople.ai/industries",
    alt: "Open People — mining and Labrador industry first, then the wire. A campus has to live with that.",
  },
  engage: {
    kicker: "Engage",
    kickerAccent: "Open People",
    headline: "Keep firm power here.",
    accent: "Write in while it is paper.",
    footer: "openpeople.ai/engage",
    alt: "Open People — keep firm power in Newfoundland and Labrador. Write in while the contracts are still paper.",
  },
  brief: {
    kicker: "Brief",
    kickerAccent: "Open People",
    headline: "Keep the power here.",
    accent: "Mining first. Then the wire.",
    footer: "openpeople.ai/brief",
    alt: "Open People’s public case for Labrador power and industry. Mining first. Compute is not the opener.",
  },
  coalition: {
    kicker: "Coalition",
    kickerAccent: "Partner brief",
    headline: "Keep firm power in NL.",
    accent: "Open People leads. Mining first.",
    footer: "openpeople.ai/coalition",
    alt: "Open People coalition brief — keep firm power in NL. Open People leads. Mining first.",
  },
  compute: {
    kicker: "Compute",
    kickerAccent: "Proposed · in feasibility",
    headline: "A 500 MW Labrador campus.",
    accent: "Open People leads.",
    footer: "openpeople.ai/compute",
    alt: "Open People — a proposed 500 MW Labrador AI campus, in feasibility. Open People leads.",
    quiet: true,
  },
  ask: {
    kicker: "Ask",
    kickerAccent: "Preliminary proposal",
    headline: "Ask the proposal.",
    accent: "Honest, labelled answers.",
    footer: "openpeople.ai/ask",
    alt: "Open People — ask about the preliminary proposal. Answers are honest and labelled.",
    quiet: true,
  },
} as const satisfies Record<string, DeskOgCard>;

export type DeskOgRoute = keyof typeof DESK_OG;

/** Static share card. metadataBase turns this into https://www.openpeople.ai/og-image.png */
export const DESK_OG_IMAGE_PATH = "/og-image.png";

export const DESK_OG_IMAGE = {
  url: DESK_OG_IMAGE_PATH,
  width: 1200,
  height: 630,
  alt: DESK_OG.home.alt,
} as const;

