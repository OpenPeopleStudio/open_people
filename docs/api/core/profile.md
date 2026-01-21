# Profile API (stable)

Envelope: `{ data, error, traceId }` per `docs/api/STANDARDS.md`.

This repo stores a user’s **AI profile** and related preferences in `ai_user_profiles` (plus goal records in `ai_user_goals`).

## Who should use it
- Frontend experiences that need the current user’s AI profile, goals, and style preferences.
- Automations personalizing AI behavior per user/tenant.
- Admin/support tooling that inspects user settings (read-only).

## Why it exists
- Centralize AI persona settings so chat/notes/workflows share the same profile.
- Avoid duplicating preference storage in clients; keep authoritative data in Postgres.
- Provide a stable contract for profile reads/writes during onboarding and daily use.

## Risks & responsibilities
- PATCH can overwrite preferences; always send only intended fields (use typed request).
- Profiles are tenant-scoped; leaking tokens can expose personal goals and styles.
- Auto-create on GET means excess unauthenticated calls could create stray rows—keep auth on.

## Quick start
1) Authenticate with Supabase session cookies (in-app) or bearer token (external).
2) `GET /api/profile` to fetch (creates if missing); cache minimally because goals change.
3) `PATCH /api/profile` with `UpdateProfileRequest` shape; validate user input before sending.
4) Use related endpoints (`/styles`, `/goals`) for specialized updates instead of overloading PATCH.

## GET `/api/profile`

Fetch the current user’s AI profile.

- **Auth**: required (Supabase session cookies / access token)
- **Behavior**: if no profile exists yet, the handler creates one automatically.

**Response**

```json
{
  "profile": { /* ai_user_profiles row */ },
  "goals": [{ /* active ai_user_goals rows */ }]
}
```

## PATCH `/api/profile`

Update the current user’s AI profile fields.

- **Auth**: required
- **Body**: see `types/ai-profile.ts` (`UpdateProfileRequest`) for the accepted fields.

**Response**

```json
{ "profile": { /* updated ai_user_profiles row */ } }
```

## Related endpoints

- `GET/PUT /api/profile/styles` - User style preferences used by chat/AI features
- `GET/POST /api/profile/goals` and `GET/PATCH/DELETE /api/profile/goals/:goalId` - Manage goals

---

**Last Updated**: January 20, 2026
