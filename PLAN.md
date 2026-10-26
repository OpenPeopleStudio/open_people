# PLAN — /ask: Gemini primary, OpenRouter Nemotron fallback

## Goal

Tom approved shipping PR #35 on Gemini with OpenRouter Nemotron as backup. This slice adds a one-shot cross-provider fallback when the primary fails before any text streams. Stay on `cursor/avoid-openai-ask-00d0`. No force-push. Never touch `main`.

## In

- `ASK_FALLBACK_PROVIDER` (`google` | `openrouter` | `gateway`) and `ASK_FALLBACK_MODEL`.
- Production values Tom will set: `ASK_PROVIDER=google`, `ASK_MODEL=gemini-flash-lite-latest`, `ASK_FALLBACK_PROVIDER=openrouter`, `ASK_FALLBACK_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free`.
- If the primary errors before any text (503, 429, auth/missing key, ~12s to first token), retry once on the fallback. If both fail, the existing snag copy plus the follow-up form.
- When neither `ASK_FALLBACK_*` is set, keep current behavior.
- Reject any `openai/` model id on every slot.
- Log which provider/model answered and whether fallback fired. No keys. Question text stays as `log.ts` already does.
- System prompt: do not introduce as an AI assistant; answer directly.
- Unit tests for fallback selection and primary-fails-then-fallback (mock providers).
- Stamp `0.5.21`. Known main failures stay: email sync, sitemap `/compute`.

## Out

- Changing Vercel env vars from this agent. List what Tom must set.
- OpenAI models, parked SaaS OpenAI clients, brand, board, home, nav, `/letter`.
- Merge to `main`, force-push, or production promote.

## Dest

- Live `/ask` on this repo. Vercel project `open-people`. Preview on PR #35.

## First slice (this PR add-on)

Cross-provider fallback for `/ask`. Gemini first, Nemotron if the primary never emits text. Prompt no longer opens as an AI assistant.

## Done when

- Fallback is env-gated and off when unset.
- Primary pre-text failure retries once on the fallback. Double failure snags.
- `openai/` is rejected on primary and fallback.
- Logs name provider, model, and `fallbackFired`.
- Unit tests cover selection and the mock fallback path.
- Lint, typecheck, and build pass. Known main test failures unchanged.
- Head commit is on this branch. CI status reported.
