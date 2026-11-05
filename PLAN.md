# PLAN: Hard-404 common scanner probe paths

Status: in progress. Branch `cursor/fix-probe-paths-404-4bbb`. Preview only; Tom merges.

Tom Lane approved this slice. Scanners hit `/wp-admin/install.php` and the live site does not return a hard app 404.

## Goal

Common WordPress, env, and git probe paths return a plain HTTP 404 with body `Not found`, no session work, and no caching of anything sensitive. The site is not WordPress. `/`, `/ask`, `/about`, `/api/ask`, and analytics must keep working.

## In

- `PLAN.md` (this file).
- `lib/security/probe-paths.ts` — matcher + plaintext 404 response.
- `middleware.ts` — short-circuit probe paths before Supabase session refresh. Keep the existing matcher (it already includes `.php`, `.env`, `.git`; do not exclude them). Re-apply the default 308 for other trailing-slash URLs.
- `next.config.ts` — `skipTrailingSlashRedirect` so `/wp-admin/` reaches middleware instead of 308ing first.
- Unit tests for the matcher/handler and the middleware short-circuit.
- VERSION trio: VERSION + CHANGELOG.md + ACTIONS. Next stamp is 0.5.26. Also bump `package.json` patch.
- `docs/SITE-LOG.md`, `docs/company/locks.md`, `notes/repo-map.ts` version note.

## Out

- WAF / IP blocks, Dependabot, branch protection, security headers, key rotation.
- Content or copy changes on public pages.
- Deploying production. No merge.
- New dependencies.
- Catch-all 404 redesign for every unknown URL (only the listed probe prefixes).

## Dest

Repo OpenPeopleStudio/open_people. Next.js middleware on Vercel (`openpeople.ai`). Ship path: feature branch → PR → Vercel preview. `curl -I` on preview probe paths must be 404. Do not promote.

## First slice (this PR)

1. PLAN.md (this file).
2. `isProbePath` for `/wp-admin` and `/wp-admin/*`, `/wp-login.php`, `/xmlrpc.php`, `/.env` and `/.env*` (including nested `/_next/.env`), `/.git` and `/.git/*`.
3. Middleware returns 404 `Not found` with `Cache-Control: no-store` and `X-Robots-Tag: noindex` before `updateSession`.
4. Tests, lint, typecheck, build, version trio.

## Done when

- Listed probe paths 404 with a short `Not found` body and are not cached as documents.
- `/`, `/ask`, `/about`, `/api/ask` are not classified as probes.
- PR body names the paths, the soft-200 / non-404 root cause, and preview curl checks.
- Build, lint, and tests pass. PR open. Not merged by the agent.

---

# Previous: Durable /ask question log (slice 1)

Status: merged as PR #40. Do not apply the migration from that PR unless Tom's database desk already has.

Tom, 29 Oct 2026: "We need to make logs if they are not stored."

## Goal

A question submitted at `/ask` must leave a durable row, not only a Vercel runtime log line that expires. Today `logAskQuestion` writes `msg:"ask.question"` and an `ASK_LOG_PATH` file that is useless on Vercel. After this slice, `POST /api/ask` writes `ask.received` as soon as the question is parsed, inserts `ask_questions` with status `received`, then updates that row to `answered` or `failed`. Missing env, a missing table, or a write error must not block or slow the answer.

## In

- `PLAN.md` (this file).
- `supabase/migrations/20261029133000_ask_questions.sql` — SQL file only. Same Supabase project and style as `ask_followups`. Tom's database desk applies it.
- `lib/ask/questions.ts` — service-role insert/update, fail-soft.
- `lib/ask/persist.ts` — schedule the write with `after()` so it does not delay the first token.
- `lib/ask/log.ts` — `ask.received` at send; keep `ask.question` on the outcome.
- `app/api/ask/route.ts` — call persist on the success and failure paths after the question is parsed.
- Tests for persist, fail-soft, no IP/user-agent, migration RLS shape.
- VERSION trio: VERSION + CHANGELOG.md + ACTIONS. Next stamp is 0.5.25.
- `docs/SITE-LOG.md`, `docs/company/locks.md`, `notes/repo-map.ts` version note.

## Out

- Applying the migration to any live database. Commit the SQL file only.
- Changing Vercel env vars. Existing `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are reused. No new secrets.
- Deploying production. No merge.
- Storing IP addresses, full user agents, names, emails, or any personal data beyond the question text. A coarse device class (`mobile` / `desktop` / `unknown`) is allowed.
- Email notification to Tom for each question (not approved).
- Debugging Gemini `gemini-flash-lite-latest` `first-token-timeout` / Nemotron fallback (flag only).
- Testing `/ask` submission on iPhone Safari (flag only).
- Project-board pages (`/power` `/capital` `/build` `/consent`).
- An admin poll API for `ask_questions`. Tom reads the table from the database desk.

## Dest

Repo OpenPeopleStudio/open_people. Same Supabase project as `ask_followups`. Table `ask_questions`. Ship path: feature branch → PR → Vercel preview. The code is harmless until Tom applies the migration: writes fail-soft and the assistant still answers. Do not promote.

## First slice (this PR)

1. PLAN.md (this file).
2. Unapplied migration: `ask_questions` with RLS on, no anon policies, service-role only.
3. `ask.received` log + `received` insert as soon as the question is parsed, before the model call.
4. Update the same row to `answered` or `failed` (provider, model, fallback flag, error). A cut-off stream still leaves the `received` row.
5. Fail-soft + `after()` so a store miss never blocks the first token.
6. Tests, lint, typecheck, build, version trio.

## Done when

- A parsed `POST /api/ask` writes `msg:"ask.received"` and attempts an `ask_questions` insert with status `received` before the model is called.
- Success updates that row to `answered`; model/stream failure updates it to `failed`. Correlation uses `request_id` and the row `id`.
- Missing Supabase env, missing table, or insert error logs a warning and the answer still streams.
- No IP, user-agent, name, or email in the table or in the new log lines. Question text only, plus optional device class.
- Migration file is in the repo and not applied by this PR. Rollback: `drop table public.ask_questions;`.
- Build, lint, and tests pass. PR open. Not merged by the agent.

## Flagged for Tom, not in this PR

- (a) An email notification to Tom for each question. Not approved yet.
- (b) Gemini `gemini-flash-lite-latest` hitting `first-token-timeout`. On 27 Oct at 11:15 AM NT, prod logs showed the Nemotron fallback answering. Every answer may be coming from the fallback.
- (c) Test `/ask` submission on iPhone Safari. A Safari GET of `/ask` on 28 Oct was never followed by a POST, so a client-side failure is possible.
