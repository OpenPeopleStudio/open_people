# API Keys API (stable)

Envelope: `{ data, error, traceId }` per `docs/api/STANDARDS.md`.

API keys are stored in `api_keys` with the secret encrypted at rest (see `lib/api-keys/encryption.ts`).

Routes live under `app/api/keys/**`.

## Who should use it
- Users storing third-party LLM/provider keys for use inside OpenPeople features.
- Services that need to manage keys on behalf of a user (with consent).
- Admin/support tooling that audits key metadata without revealing plaintext.

## Why it exists
- Centralize encrypted storage and controlled reveal/testing of API keys.
- Provide a consistent way for downstream features to access provider credentials.
- Reduce risk of plaintext key sprawl across clients and logs.

## Risks & responsibilities
- Plaintext is returned only on create/reveal; logging it will leak the secret.
- Reveal/test endpoints are sensitive and logged—use minimal scopes and rotate regularly.
- Keys are user-scoped; ensure the caller is in the correct tenant and has permission.

## Quick start
1) Authenticate (cookies or bearer token).
2) `GET /api/keys` to list; `POST /api/keys` to create (capture plaintext immediately).
3) Manage individual keys with `GET/PATCH/DELETE /api/keys/:keyId`.
4) Use `POST /api/keys/:keyId/reveal` or `/test` only in secure contexts; log `traceId` on errors.

## List + create

### GET `/api/keys`

List API keys owned by the current user (with filter support).

**Response**

```json
{ "keys": [{ "id": "…", "provider": "openai", "key_hint": "sk-…abcd", "...": "..." }], "total": 3 }
```

### POST `/api/keys`

Create a new key. The plaintext key is returned **only once** on creation.

## Per-key operations

### GET `/api/keys/:keyId`

Fetch key metadata and recent usage history.

### PATCH `/api/keys/:keyId`

Update key metadata (name, tags, env, etc.).

### DELETE `/api/keys/:keyId`

Delete a key.

## Sensitive operations

### POST `/api/keys/:keyId/reveal`

Decrypt and return the plaintext key (logged).

### POST `/api/keys/:keyId/test`

Provider-specific key validation (makes a minimal upstream request when possible).

---

**Last Updated**: January 20, 2026
