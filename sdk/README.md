# SDKs

Generated clients live here. Current automated target: TypeScript (types only).

- Run `npm run generate:sdk` to regenerate from `docs/api/openapi.json`.
- Output: `sdk/typescript/index.d.ts` (types for fetch-compatible clients).
- Extend `scripts/generate-sdks.js` or the npm scripts to add Go/Python once OpenAPI stabilizes.
