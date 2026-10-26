# Site log

Dated public-copy notes. Not a changelog of every commit.

## 2026-10-26 — Consent-first wording (Tom-approved campus-room copy)

Public pages were still listing NL Hydro and Indigenous nations as “proposed partners,” treating equity as a scoring point, and leaving the Innu “never invited to the table” line unattributed. Tom’s campus-room copy is consent-first: nothing proposed is stated as done, no nation is named as a partner, and Phase 1 power is a written request plus a non-firm pilot, not a reserved block.

Applied on this date (PR #25, `cursor/brief-consent-wording-f946`), after merging `aa8c327` from `main`:

- Power (the old “enough firm green power… proposed 500 MW campus” line): replaced with “The campus is proposed and in feasibility. Phase 1 is a written request to NL Hydro and a non-firm, interruptible pilot. No megawatts are reserved.” Headline “Get involved — keep firm power here” unchanged. NL Hydro removed from proposed-partner listings.
- Consent / partners: “Partnership, if any, will be on terms each nation sets. No nation has been asked about this project.” (was “No nation has been contacted.” — consent desk sourced wording.)
- Ashini quote kept and attributed, linked to VOCM 21 Sep 2026: https://vocm.com/2026/09/21/premier-has-yet-to-contact-innu-about-hydro-deal-says-grand-chief/
- Equity / ISED: “ISED lists Indigenous participation as one of its criteria. Any role is for each nation to decide.” No “equity earns points.” No “stakeholders” in that passage.
- NunatuKavut: no standing line existed; nothing cut.

Home and nav were left alone (another agent is rewriting them). Shared home-board strings in `lib/board/entries.ts`, `lib/board/tracks.ts`, and `COMPUTE_HERO.technical` were also left, so `/`, `/consent`, `/build`, `/capital`, and `/power` still show the older partner listing until that rewrite.

Ottawa / ISED (same date, still PR #25; confirmed against official ISED pages):

- Heading “Ottawa is already paying for this” → “Ottawa is looking for projects like this” (`app/(marketing)/brief/page.tsx`).
- Unblended two programs: (a) ISED “Enabling large-scale sovereign AI data centres”, 15 Jan–15 Feb 2026, now closed, potential non-binding MOU — https://ised-isde.canada.ca/site/ised/en/enabling-large-scale-sovereign-ai-data-centres and the intake form (non-binding MOU) https://ised-isde.canada.ca/site/ised/en/enabling-large-scale-sovereign-ai-data-centres-intake-form; (b) Canadian Sovereign AI Compute Strategy, Budget 2024 “$2 billion over five years” — https://ised-isde.canada.ca/site/ised/en/canadian-sovereign-ai-compute-strategy. ISED writes “$2 billion”, not “C$2B”.
- “a structure federal programs reward” was already gone; not found on this branch.
- Home and nav skipped (in-flight home rewrite). Latest `main` is still `aa8c327` (campus board, 12:37 AM NT). The home agent has not published a branch yet.

The AI-campus wording PR stays separate.

## 2026-10-26 — Labrador AI campus, footer links, process-only partnership (PR #26)

Based on latest `main` (`aa8c327`). Home page and nav not edited (in-flight home rewrite). `/brief` partner listings left for PR #25.

Old → new:

- `app/(marketing)/about/page.tsx` metadata: “proposed 500 MW Labrador campus” → “proposed 500 MW Labrador AI campus”
- `lib/marketing/approach.ts` lede: same AI insertion
- `app/(marketing)/compute/page.tsx` title: “500 MW Labrador campus” → “500 MW Labrador AI campus”
- `lib/voice-mode/anchors.ts` `ENGAGE_HERO_LEDE`: “proposed 500 MW campus on that power” → “proposed 500 MW AI campus on that power” (and the matching plain line)
- `lib/marketing/approach.ts` partners line: “Proposed partners: NL Hydro, Indigenous nations (consent first), and capital…” → “We intend to seek early, respectful engagement with each nation. No partnership or agreement exists. Partnership, if any, is on terms each nation sets…”
- `lib/marketing/approach.ts` “What we will not do”: “Indigenous engagement is first-class: an equity conversation from day one, not a consultation footnote at the end.” → “We intend to seek early, respectful engagement with each nation. No partnership or agreement exists. Partnership, if any, is on terms each nation sets.”
- `lib/desk/compute.ts` Open People leads rule: dropped “in proposed partnership with NL Hydro, Indigenous nations”; same process-only sentences
- `app/(marketing)/compute/page.tsx` lede technical and closing paragraph: same process-only sentences. `COMPUTE_HERO.technical` left unchanged for the home board.

Footer:

- Campus sentence: “proposed 500 MW Labrador campus” → “proposed 500 MW Labrador AI campus”
- X https://x.com/OpenPeopleAI — confirmed (`<title>Open People (@OpenPeopleAI) / X</title>`), label `@OpenPeopleAI`, `rel="me noopener"` `target="_blank"`
- LinkedIn https://www.linkedin.com/in/tomlanenl — not a 404 (LinkedIn returned authwall HTTP 999 to the crawler)

Skipped (home / nav): `/` headline “Building a Labrador campus.”; `HOME_TITLE` / home OG card; `COMPUTE_HERO` (home lede; plain already says “AI data campus”). `/brief` partner listings left for PR #25.
