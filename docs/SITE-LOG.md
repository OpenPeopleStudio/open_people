# Site log

Dated public-copy notes. Not a changelog of every commit.

## 2026-10-26 — Labrador AI campus, footer links, process-only partnership (PR #26)

Based on latest `main` (`aa8c327`). Home page and nav not edited (in-flight home rewrite). `/brief` partner listings left for PR #25.

Old → new:

- `app/(marketing)/about/page.tsx` metadata: “proposed 500 MW Labrador campus” → “proposed 500 MW Labrador AI campus”
- `lib/marketing/approach.ts` lede: same AI insertion
- `app/(marketing)/compute/page.tsx` title: “500 MW Labrador campus” → “500 MW Labrador AI campus”
- `lib/marketing/approach.ts` partners line: “Proposed partners: NL Hydro, Indigenous nations (consent first), and capital…” → “We intend to seek early, respectful engagement with each nation. No partnership or agreement exists. Partnership, if any, is on terms each nation sets…”
- `lib/desk/compute.ts` Open People leads rule: dropped “in proposed partnership with NL Hydro, Indigenous nations”; same process-only sentences
- `app/(marketing)/compute/page.tsx` lede technical and closing paragraph: same process-only sentences. `COMPUTE_HERO.technical` left unchanged for the home board.

Footer (social only; campus sentence left as main wrote it):

- X https://x.com/OpenPeopleAI — confirmed (`<title>Open People (@OpenPeopleAI) / X</title>`)
- LinkedIn https://www.linkedin.com/in/tomlanenl — not a 404 (LinkedIn returned authwall HTTP 999 to the crawler)

Skipped: `/` and nav; footer campus sentence still “proposed 500 MW Labrador campus”; `COMPUTE_HERO.technical` still lists proposed partners (home). `/brief` still has “Proposed partners: NL Hydro…” on this branch — that is PR #25.
