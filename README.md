# openpeople.ai

Public site for Open People. Production host: `www.openpeople.ai`. Vercel project: `open-people`.

The live story is the Churchill River desk and a proposed Labrador campus, in feasibility. Open People leads that proposal. It is not a signed allocation.

## Where to work

The map is [`notes/repo-map.ts`](notes/repo-map.ts). It classifies every tracked top-level path as `site`, `parked`, `spec`, `shared`, `record`, or `tooling`.

Public pages live in `app/(marketing)/`. Shared chrome is `components/marketing/`. Numbers on the desk come from `lib/desk/`.

`PLAN.md` is the current public-copy slice. It is not a map of this repo.

## What else is in this repo

Trees marked `PARKED.md` are not the public site: `templates/`, `app/(platform)/`, `app/super-admin/`, `context/`, `infra/`, `.codex/`, `types/`.

Trees marked `SPEC.md` are the identity standard, not the site: `packages/`, `sdk/`. The spec text is `docs/spec/`.

Do not delete parked or spec trees.

## Commands

```bash
npm run lint
npm run typecheck
npm test
```

Do not merge to `main` or promote a Vercel preview unless Tom says "ship it".
