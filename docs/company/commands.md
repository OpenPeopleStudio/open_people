# Staff Commands and Routines

Owner: CTO

Human-readable guide to the commands staff should run during normal development and release work.

## Daily Development

- Start dev server: `npm run dev`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Tests: `npm test`

## Environment and Database

- Health check: `npm run doctor`
- Apply migrations: `npm run db:migrate`
- Seed Mars tenant: `npm run db:seed`

## When To Run What

- Before opening a PR: `npm run lint`, `npm run typecheck`, `npm test`
- When touching env, DB, or migrations: `npm run doctor`, `npm run db:migrate`
- When validating tenant workflows: `npm run db:seed` and use `mars.localhost:3000/admin`

## Expectations

- Explain skipped commands in the PR or change notes.
- Keep release gates green before merging to main.
- Use the release checklist before production releases: `docs/company/release-checklist.md`.
