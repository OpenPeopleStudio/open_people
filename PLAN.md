# PLAN — First slice: take OpenAI off live /ask

## Goal

Tom Lane decided openpeople.ai should avoid OpenAI wherever an alternative exists. This slice removes OpenAI from the live `/ask` path and from provider defaults, without touching parked SaaS, brand, or board work.

## In

- `app/api/ask/route.ts`, `lib/ask/prompt.ts`, `lib/ask/openai-direct.ts`: drop the OpenAI-direct path and `OPENAI_API_KEY` as a way to configure `/ask`. Chat stays on the Vercel AI SDK (`streamText`) through AI Gateway.
- Default model: current Gateway Grok id `spacexai/grok-4.7` (provider `xai`). Override with `ASK_MODEL`. Do not read `AI_GATEWAY_MODEL` (that Vercel var is still an OpenAI id).
- Gateway fallback, if any: Anthropic Claude via the gateway (`anthropic/claude-sonnet-5.5`). Provider options must not list `openai` or `azure`.
- If Gateway is not configured, keep the current 503 “not configured” response. An OpenAI key alone is not enough.
- `types/ai-providers.ts`: `defaultProvider` is not `openai`; no `gpt-*` in the default settings; `fallbackToOpenAI` and `useOpenAIForEmbeddings` are false. Types still compile. Parked readers stay as they are.
- Public marketing copy that names OpenAI or Azure OpenAI as a provider. Live pages only. `_retired` pages stay; list them in the PR.
- A unit test that the `/ask` path has no OpenAI model and no `openai-direct` import.
- Lint, typecheck, build, and the test suite. Known main failures stay: `__tests__/unit/lib/email/sync.test.ts`, and any sitemap `/compute` 0.4 vs 0.85 test.

## Out

- The `openai` npm package, if anything outside this slice still imports it.
- Parked platform: `v1/chat/completions`, chat conversations/actions, mlf/knowledge embeddings, `ai/plan/week`, `ops/propose`, semantic-cache, workflows/search, demo/scenario-packs, admin model lists, the super-admin OpenAI fallback toggle.
- `.codex/`, `AGENTS.md` title.
- Brand, board, home, nav, `/letter`. Cursor is building the project board; do not touch it.
- Changing Vercel env vars. List what Tom must add or can remove after merge.
- Merge to `main`, force-push, or production promote. Tom merges.

## Dest

- This repo’s marketing site. Vercel project `open-people`. Production host `www.openpeople.ai`.
- Ship path: feature branch → PR → Vercel preview. Do not promote the preview.

## First slice (this PR)

Live `/ask` off OpenAI (Grok default, Claude fallback, no direct key). Provider-type defaults off OpenAI. Live public copy only if it names OpenAI as a provider. Inventory of remaining OpenAI references in the PR body.

## Done when

- `/ask` has no OpenAI-direct path, no `OPENAI_API_KEY` dependency, and no OpenAI model in the default or gateway fallback order.
- Default model is a current non-OpenAI Gateway id; `ASK_MODEL` can override it.
- Unconfigured Gateway still returns 503.
- `DEFAULT_AI_SETTINGS` does not default to OpenAI or `gpt-*`.
- Live public pages do not name OpenAI or Azure OpenAI as a provider. `_retired` hits are listed, not edited.
- Unit test covers the `/ask` ban. Lint, typecheck, and build pass. Known main test failures are unchanged.
- PR is open with the remaining-OpenAI inventory and the env-var list. CI is green.
