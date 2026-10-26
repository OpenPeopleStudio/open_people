# Site log

Dated public-copy notes. Not a changelog of every commit.

## 2026-10-26 — Consent-first wording (Tom-approved campus-room copy)

Public pages were still listing NL Hydro and Indigenous nations as “proposed partners,” treating equity as a scoring point, and leaving the Innu “never invited to the table” line unattributed. Tom’s campus-room copy is consent-first: nothing proposed is stated as done, no nation is named as a partner, and Phase 1 power is a written request plus a non-firm pilot, not a reserved block.

Applied on this date (PR #25, `cursor/brief-consent-wording-f946`), after merging `aa8c327` from `main`:

- Power (the old “enough firm green power… proposed 500 MW campus” line): replaced with “The campus is proposed and in feasibility. Phase 1 is a written request to NL Hydro and a non-firm, interruptible pilot. No megawatts are reserved.” Headline “Get involved — keep firm power here” unchanged. NL Hydro removed from proposed-partner listings.
- Consent / partners: “Partnership, if any, will be on terms each nation sets. No nation has been contacted.”
- Ashini quote kept and attributed, linked to VOCM 21 Sep 2026: https://vocm.com/2026/09/21/premier-has-yet-to-contact-innu-about-hydro-deal-says-grand-chief/
- Equity / ISED: “ISED lists Indigenous participation as one of its criteria. Any role is for each nation to decide.” No “equity earns points.” No “stakeholders” in that passage.
- NunatuKavut: no standing line existed; nothing cut.

Home and nav were left alone (another agent is rewriting them). Shared home-board strings in `lib/board/entries.ts`, `lib/board/tracks.ts`, and `COMPUTE_HERO.technical` were also left, so `/`, `/consent`, `/build`, `/capital`, and `/power` still show the older partner listing until that rewrite.

The AI-campus wording PR stays separate.
