# SDK & Contract Generation

This folder documents how to regenerate OpenAPI specs and language SDKs.

- `npm run generate:openapi` writes `docs/api/openapi.json` from `scripts/generate-openapi.js`.
- `npm run generate:sdk:ts` generates TypeScript types into `sdk/typescript/index.d.ts`.
- `npm run generate:sdk` runs both in sequence.

Prereqs: Node + npm installed. Go/Python SDKs can be added later via `openapi-generator` once the spec stabilizes.
