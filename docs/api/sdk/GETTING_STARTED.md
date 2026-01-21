# API & SDK Getting Started

1) Generate OpenAPI
- Run `npm run generate:openapi` (or `npm run generate:sdk` to include TS types).
- Output: `docs/api/openapi.json` and `sdk/typescript/index.d.ts`.

2) Consume the TypeScript SDK (types only)
```ts
import type { paths, components } from "./sdk/typescript";
```
Use your own fetch client; the types map to `/v1` routes (tenants, users, devices, vault files, chat gateway, quick-upload).

3) Error format
- 4xx/5xx return `{ error: { message, code?, type? } }`. 401/403/429 are defined in `components.responses`.

4) Regeneration guardrails
- Add `npm run generate:openapi` + `npm test` to CI.
- Contract tests live in `__tests__/contracts/`.

5) Environment
- Supply auth headers per route (Bearer `op_sk_*` for chat gateway; JWT/service tokens for `/v1/*`; `x-vault-token` for quick upload).
