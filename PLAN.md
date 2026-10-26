# PLAN — Vercel Web Analytics on the public site

## Goal

Add Vercel Web Analytics to openpeople.ai so we can see aggregate traffic. No Speed Insights. No extra trackers. No keys. No PII in custom events.

## In

- Install `@vercel/analytics`. Render `<Analytics />` from `@vercel/analytics/next` once in `app/layout.tsx`.
- Custom `track()` events, event name only, no free text or PII:
  - `/ask` question submitted
  - `/ask` follow-up form submitted (after a successful send)
  - contact form submitted (mailto send on `/contact` and the leftover contact form)
- `/privacy` states, in short sentence-case words, that the site uses Vercel Web Analytics, which is cookieless and collects aggregate page views, referrers, country and device, not personal identity. Stay inside Vercel’s published privacy page. Do not claim cookies we do not set, and do not claim we collect nothing.
- Drop the `/ask` line “this page has no analytics trackers.”
- Bump `VERSION` to 0.5.23 (next patch after main’s 0.5.22 from PR #38). Trio: VERSION + CHANGELOG.md + ACTIONS. Keep every 0.5.19–0.5.22 /ask entry.
- Checks: layout mounts Analytics once and not Speed Insights; custom events carry no question text, email, or name; public-PII test stays green; e2e `/ask` privacy copy. Lint, typecheck, build, `npm test` except the two known failures on main.

## Out

- `@vercel/speed-insights`, ads pixels, and any other tracker.
- Env vars and API keys. Web Analytics does not need them in the app.
- `/ask` provider code (`lib/ask/*`, `app/api/ask/*`) and `content/ask/proposal-knowledge.md` (PR #38).
- Project-board pages (`/build`, `/capital`, `/consent`, `/power`) and `lib/board/*`.
- Sitemap ranks (`__tests__/unit/app/sitemap.test.ts` `/compute` priority stays a known failure).
- `__tests__/unit/lib/email/sync.test.ts` (known failure on main).
- Merge to `main`, force-push, or production promote. Tom merges.

## Dest

- This repo’s marketing site. Vercel project `open-people`. Production host `www.openpeople.ai`.
- Ship path: feature branch → PR → Vercel preview. Enable Web Analytics in the Vercel project dashboard if it is not already on. Do not promote the preview.

## First slice (this PR)

This spec. Package, root layout, three named events, privacy copy, version bump. Rebased onto current `origin/main` at `9ab06b6` (0.5.22).

## Done when

- Root layout renders `<Analytics />` from `@vercel/analytics/next` once. No Speed Insights.
- `/ask` question submit fires an event name only. Follow-up success fires an event name only. Contact mailto / form fires an event name only. No question text, email, name, or message in props.
- `/privacy` says the site uses Vercel Web Analytics, cookieless, aggregate page views, referrers, country and device, not personal identity.
- `/ask` no longer claims it has no analytics trackers.
- VERSION is 0.5.23. 0.5.22–0.5.19 /ask notes stay in CHANGELOG, ACTIONS, SITE-LOG, locks, and repo-map. Lint and typecheck pass. Public-PII test passes. Known email-sync and sitemap `/compute` failures unchanged.
- PR is open. CI is green except those two known unit failures. Vercel preview builds.
