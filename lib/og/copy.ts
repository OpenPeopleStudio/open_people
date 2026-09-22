/**
 * Desk v2 Open Graph / Twitter card copy.
 * No deal numbers on the image (no ¢/kWh, no MW). Mining first. Compute quiet.
 *
 * Locked home card (do not soften):
 *   Kicker:    OPEN PEOPLE · CHURCHILL RIVER DESK
 *   Dominant:  Keep the power here.
 *   Secondary: Watch the gates.
 *   Footer:    OPEN PEOPLE · NL / OPENPEOPLE.AI
 * Compute stays quiet (steel): A compute plan, / not a campus landing.
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

export const HOME_TITLE = "Open People — Churchill River desk · Keep the power here";
export const HOME_DESCRIPTION =
  "A living desk on the Churchill Falls / Gull Island framework: what is signed, what is still blank, and the industry Labrador can build if firm power stays here. Mining first. Compute is a separate page.";

export const DESK_OG = {
  home: {
    kicker: "OPEN PEOPLE",
    kickerAccent: "CHURCHILL RIVER DESK",
    headline: "Keep the power here.",
    accent: "Watch the gates.",
    footer: "OPENPEOPLE.AI",
    alt: "Open People — Churchill River desk. Keep the power here. Watch the gates.",
  },
  tracker: {
    kicker: "Tracker",
    kickerAccent: "Churchill River desk",
    headline: "What’s signed. What’s open.",
    accent: "What we still mark unknown.",
    footer: "openpeople.ai/tracker",
    alt: "Open People tracker — what’s signed, what’s open, and what the public text still does not say.",
  },
  costs: {
    kicker: "Costs",
    kickerAccent: "Churchill River desk",
    headline: "Seven price stories.",
    accent: "One ladder. Nothing merged.",
    footer: "openpeople.ai/costs",
    alt: "Open People costs — seven price stories on one ladder, labelled, not merged.",
  },
  industries: {
    kicker: "Industries",
    kickerAccent: "Churchill River desk",
    headline: "Mining first.",
    accent: "Then the wire.",
    footer: "openpeople.ai/industries",
    alt: "Open People industries — mining first, then the wire. Compute last, and short.",
  },
  engage: {
    kicker: "Engage",
    kickerAccent: "Churchill River desk",
    headline: "Keep firm power here.",
    accent: "In Newfoundland and Labrador.",
    footer: "openpeople.ai/engage",
    alt: "Open People — keep firm power in Newfoundland and Labrador. House endorsement is not a contract.",
  },
  brief: {
    kicker: "Brief",
    kickerAccent: "Churchill River desk",
    headline: "Keep the power here.",
    accent: "Mining first. Compute last.",
    footer: "openpeople.ai/brief",
    alt: "Open People brief — Labrador power and industry case. Mining first. Compute is not the opener.",
  },
  coalition: {
    kicker: "Coalition",
    kickerAccent: "Partner brief",
    headline: "Keep firm power in NL.",
    accent: "Catalyst only. Mining first.",
    footer: "openpeople.ai/coalition",
    alt: "Open People coalition brief — keep firm power in NL. Catalyst only. Mining first.",
  },
  compute: {
    kicker: "Compute",
    kickerAccent: "Named use · not the front door",
    headline: "A compute plan,",
    accent: "not a campus landing.",
    footer: "openpeople.ai/compute",
    alt: "Open People compute plan — a named use, not a data-centre pitch, not a seat at the deal table.",
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

