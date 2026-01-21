# Onboarding API (stable)

Envelope: `{ data, error, traceId }` per `docs/api/STANDARDS.md`.

Tenant onboarding is stored in the `tenant_onboarding` table and exposed via `/api/onboarding`.

## GET `/api/onboarding`

Fetch the onboarding record for the current tenant.

- **Auth**: required
- **Super-admin override**: `GET /api/onboarding?tenant_id=<uuid>` fetches another tenant’s record
- **Super-admin list mode**: if super-admin has no tenant and does not pass `tenant_id`, returns up to 100 recent onboarding records

**Response**

```json
{ "onboarding": { /* tenant_onboarding row */ }, "isNew": false }
```

## PUT `/api/onboarding` (and PATCH)

Upsert/update onboarding fields.

- **Auth**: required
- **Request body**:
  - For regular users: a partial set of onboarding fields
  - For super-admins: may include `tenant_id` to update another tenant

The accepted fields are defined by `types/onboarding.ts` (`OnboardingUpdateRequest`).

**Response**

```json
{ "onboarding": { /* updated tenant_onboarding row */ } }
```

---

**Last Updated**: January 20, 2026
