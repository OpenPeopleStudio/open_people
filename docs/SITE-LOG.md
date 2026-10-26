# Site log

Dated public-copy notes. Not a changelog of every commit.

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
