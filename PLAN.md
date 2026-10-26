# PLAN — Desk IA fixes on the current board

## Goal

Close the remaining information-architecture holes on current main (`e1daf6f` and after). Home already leads with the company and the campus, and the header is already About, Build, Capital, Consent, Power. This slice takes the campus-only sentence off the build track, lets a record page return to its track, puts Privacy and Terms on the desk shell, and makes the sitemap agree with the board.

## In

- Item 1: `COMPUTE_HERO.plain` stops at the mines sentence. The two campus-only sentences stay on `/compute` only, as a compute-page plain string next to `COMPUTE_PAGE_TECHNICAL`. Home and the build row still render `COMPUTE_HERO.technical`.
- Item 2: Optional parent link on `DeskPage` (kicker row). Power records pass Power → `/power`. `/compute` passes Build → `/build`. Existing cross-links stay.
- Item 3: `/privacy` and `/terms` render through `DeskPage` / `SiteNav`. NavBar comes off those pages. Legal text unchanged.
- Item 4: Sitemap priorities only. Tracks `/build` `/capital` `/consent` `/power` at 0.9. Record pages `/brief` `/tracker` `/engage` `/industries` `/costs` `/letter` at 0.8. `/compute` stays 0.4. `/about` stays 0.8. Same set of routes.
- Checks from the spec: unit (build seed vs compute-page plain), e2e (parent links + privacy desk nav). Lint, typecheck, build, `npm test`. Public-PII test stays green.
- Brand: sentence case, paper `#f3f3ef`, ink `#0e1014`, orange `#f2501f`, orange text on paper `#c23a12`, Schibsted Grotesk and DM Mono. Consent-first: claim no partnerships. No new figures or copy beyond what this spec moves.

## Out

- Header: About, Build, Capital, Consent, Power.
- Power’s job line in `lib/board/tracks.ts`. Record labels: Tracker, Industries, Costs, Brief, Letter, Engage.
- `/coalition` unlisted, noindex, unlinked.
- Retired product routes and their redirects. No new interstitial. Do not move or edit retired pages. Do not touch `notes/repo-map.ts` or `PARKED.md`.
- Home copy in `lib/marketing/home.ts`.
- `__tests__/unit/lib/email/sync.test.ts` (known failure on main).
- Merge to `main`, force-push, or production promote. Tom merges.

## Dest

- This repo’s marketing site. Vercel project `open-people`. Production host `www.openpeople.ai`.
- Ship path: feature branch → PR → Vercel preview. Do not promote the preview.

## First slice (this PR)

This spec. All four items and the checks, starting from current `origin/main` at or after `e1daf6f`.

## Done when

- The build seed does not contain “This page is the campus”. The compute page plain string does. `/compute` still shows that sentence.
- A power-record page links to `/power`. `/compute` links to `/build`. `/privacy` and `/terms` show Build / Capital / Consent / Power and do not show Sign in or Pricing.
- Sitemap tracks 0.9, record pages 0.8, `/compute` 0.4, `/about` 0.8. Route set unchanged.
- Lint, typecheck, and build pass. Public-PII test passes. Known email-sync unit failure unchanged.
- PR is open. CI is green. Vercel preview READY. Screenshots of home, `/power`, `/brief`, `/compute`, `/privacy` at desktop and with the mobile nav sheet open.
