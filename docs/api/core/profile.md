# Profile API

This repo stores a user’s **AI profile** and related preferences in `ai_user_profiles` (plus goal records in `ai_user_goals`).

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

