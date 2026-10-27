# PLAN: AI company first, campus as the project (slice 1)

Status: in progress. Branch `cursor/ai-company-home-1fef`. Preview only; Tom merges.

Tom, 27 Oct 2026: "Lead with AI company, campus as the project."

## Goal

A reader or crawler landing on openpeople.ai can tell in one screen that Open People is an AI company. The proposed Labrador AI campus is the company's project. Use only things that exist: the `/ask` answer engine and the agent-readable surface (`llms.txt`, JSON-LD, home title/meta).

## Decisions (this slice)

- Home hero: keep "An AI company." Add a clear first-screen entry to `/ask` ("Ask the proposal") on mobile and desktop. Light reframe so the campus reads as the company's proposed project, in feasibility.
- `/ask` "How this works": answers come from a large language model grounded only in `content/ask/proposal-knowledge.md`. If it is not in the record, the model is told to say so. A fallback model takes over if the first is unavailable. Name models at provider/family level only: Google Gemini primary; an open-weights model via OpenRouter as fallback. Do not print exact model ids, env names, or keys. Production `ASK_MODEL` / `ASK_FALLBACK_MODEL` override code defaults in `lib/ask/provider.ts` and differ from those defaults.
- Privacy: verify against `lib/ask/log.ts`, `lib/ask/follow-up.ts`, `AskDesk`, and `/privacy` before writing any claim. Assistant questions are logged as text (and whether they were covered), without names or emails. The follow-up form is a separate path and does collect email (required) and name (optional).
- Home `<title>` and meta/OG description: put "AI" in them. Title example: "Open People, an AI company in Newfoundland and Labrador". Sentence case.
- JSON-LD Organization (the existing site-wide block, keep only one): add description (AI company in Newfoundland and Labrador; proposed Labrador AI campus in feasibility), PostalAddress with `addressLocality` "St. John's", `addressRegion` "NL", `addressCountry` "CA" only, and a `knowsAbout` list. Do not add phone, street, postal code, or email `contactPoint`.
- `public/llms.txt`: lead with Open People as an AI company and the campus as its proposed project. Remove/replace the lines that say not to describe a software product and that the data centre is not the opener. List `/ask` under Start here and For agents. Do not add claims.

## In

- `app/(marketing)/page.tsx`, `lib/marketing/home.ts` — hero entry, lede reframe, title/description.
- `app/(marketing)/ask/page.tsx` (and a small copy module if needed) — How this works block.
- `lib/og/jsonld.ts`, `__tests__/unit/lib/og/search-head.test.ts` — Organization fields.
- `public/llms.txt`, `__tests__/unit/lib/site/agent-visibility.test.ts`.
- Tests for home title, `/ask` copy (no secrets), privacy/PII ban, existing `/ask` tests.
- VERSION trio: VERSION + CHANGELOG.md + ACTIONS. Next stamp is 0.5.24.
- `docs/SITE-LOG.md`, `docs/company/locks.md`, `notes/repo-map.ts` version note.

## Out

- Desk board on `/power` `/capital` `/build` `/consent` (separate Cursor work). Open PRs #33, #34, #36.
- `/coalition` (stays unlisted, noindex, unlinked).
- New figures, products, customers, partners, agreements.
- Any OpenAI model, API, or product.
- Vercel / Supabase settings.
- Exact model ids, env var names, or keys on any public page.
- Phone, street, postal code, or `auth@` on any page. Location only as St. John's, NL.
- Brendan / Verafin.
- Merge to main. Tom merges.

## Guardrails (code, not new claims)

Read before writing `/ask` copy:

- `lib/ask/prompt.ts` `buildAskInstructions`: answers may use only the knowledge file; if a fact is not there, say so; labels CONFIRMED / REPORTED / ESTIMATE / UNKNOWN; never invent numbers; never claim a partner, tenant, nation, utility, funder, or government has agreed.
- `lib/ask/stream.ts` `runAskWithFallback`: try primary until first text; if it errors or times out before any token, try the fallback once.
- `lib/ask/log.ts`: question log is question text, covered, provider/model, fallbackFired. No name. No email.
- `lib/ask/follow-up.ts`: follow-up stores name (optional) and email (required) so Tom can reply. That path is not the assistant question log.
- `/privacy` states Vercel Web Analytics (cookieless, aggregate). `/ask` already says questions may be processed by a third-party AI provider, and that submitting records the event name only.

## Dest

Repo OpenPeopleStudio/open_people. One PR from this branch. Ship path: feature branch → PR → Vercel preview. Do not promote.

## First slice (this PR)

1. PLAN.md (this file).
2. Home hero `/ask` entry + light AI-company-leads copy.
3. `/ask` How this works.
4. Home title / meta / OG.
5. JSON-LD Organization description, address, knowsAbout.
6. `llms.txt` reframe + `/ask` links.
7. Version trio, tests, preview.

## Done when

- Home shows a visible `/ask` entry on the first screen; `curl` of `/` shows "AI" in `<title>`.
- `/ask` shows How this works (model family, fallback family, knowledge source, guardrails that match the code). No secrets, model ids, or env names in HTML.
- `/llms.txt` lists `/ask`; JSON-LD has no street, phone, or email contactPoint; one Organization only.
- Every campus sentence keeps proposed / in feasibility. Sentence case. Plain. No conquest language.
- Build, lint, and existing tests pass, including the public-PII / privacy tests.
- PR open. Not merged by the agent.

## Report separately (not in this PR)

Which `app/api/*` routes remain from the older app (vault, keys, tenants, hitl, etc.), and for each whether it is reachable unauthenticated in production (`GET https://www.openpeople.ai/api/<route>`, read-only, no payloads) and what it returns. List any that respond 200 with data.
