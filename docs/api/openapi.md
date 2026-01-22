# OpenAPI Specification

Owner: CTO

This document explains where the OpenAPI contract lives, how it is generated,
and how to consume it.

## What this is

- Source file: `docs/api/openapi.json`
- Coverage: critical/externally consumed endpoints (not every internal route)
- Status: generated artifact that should stay in sync with route schemas

## How to view it

1) Open `docs/api/openapi.json` in Swagger UI, Insomnia, or Postman.
2) Use the base URL for your environment (local or production).

## How to update it

Run one of the generation commands:

```bash
npm run generate:openapi
npm run generate:sdk
```

The generator lives at `scripts/generate-openapi.js`. Keep this spec updated
whenever an external contract changes.

## Related docs

- `docs/api/overview.md` (API entry point)
- `docs/api/sdk/README.md` (SDK + contract generation)
