# API Keys API

API keys are stored in `api_keys` with the secret encrypted at rest (see `lib/api-keys/encryption.ts`).

Routes live under `app/api/keys/**`.

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

