# PLAN — /ask: selectable $0 non-OpenAI providers

## Goal

Tom wants to test $0 non-OpenAI options for live `/ask` and pick the best. This slice makes the provider selectable through env. No OpenAI models. Stay on `cursor/avoid-openai-ask-00d0`. No force-push. Never touch `main`.

## In

- `ASK_MODEL` still sets the AI Gateway model string when `ASK_PROVIDER` is unset (default: Gateway, Grok then Claude).
- `ASK_PROVIDER=google`: `@ai-sdk/google` with `GOOGLE_GENERATIVE_AI_API_KEY`. Model from `ASK_MODEL` or a current Gemini flash default.
- `ASK_PROVIDER=openrouter`: `@openrouter/ai-sdk-provider` with `OPENROUTER_API_KEY`. Model from `ASK_MODEL` (a `:free` non-OpenAI id). Reject any model id that starts with `openai/`.
- Missing Google or OpenRouter key: fail closed to the existing snag copy plus the follow-up form. Never leak errors or key names.
- Unconfigured Gateway (default provider) still returns 503.
- One-line note on `/ask` under the box, sentence case: “Questions may be processed by a third-party AI provider.”
- Server log includes provider and model, never keys.
- Unit tests for the provider picker. Known main failures stay: `__tests__/unit/lib/email/sync.test.ts`, `__tests__/unit/app/sitemap.test.ts` (`/compute` 0.4 vs 0.85).
- Stamp `0.5.20`. Update this PLAN, locks, CHANGELOG, ACTIONS, SITE-LOG.

## Out

- OpenAI models, `OPENAI_API_KEY`, and the deleted openai-direct path.
- Parked SaaS OpenAI clients, the `openai` npm package, admin model lists, super-admin fallback toggle.
- Brand, board, home, nav, `/letter`.
- Changing Vercel env vars from this agent. List what Tom must set to try Google or OpenRouter.
- Merge to `main`, force-push, or production promote.

## Dest

- This repo’s marketing site. Vercel project `open-people`. Preview on PR #35.
- Ship path: this feature branch → same PR → Vercel preview. Do not promote.

## First slice (this PR add-on)

Env-selectable `/ask` providers: Gateway (default), Google Gemini, OpenRouter `:free`. Public one-line third-party note. Logs name the provider and model.

## Done when

- Default path is still Gateway with no OpenAI models.
- `ASK_PROVIDER=google` and `ASK_PROVIDER=openrouter` resolve a non-OpenAI model and require their own keys.
- Missing keys snag; they do not leak. Gateway still 503s when unconfigured.
- `/ask` shows the third-party line under the box.
- Logs include provider and model, no keys.
- Unit tests cover the picker. Lint, typecheck, and build pass. Known main test failures unchanged.
- Commit is on `cursor/avoid-openai-ask-00d0`. PR #35 is updated. CI is green. Preview URL reported.
