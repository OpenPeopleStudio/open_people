# Authentication (Supabase Auth)

OpenPeople.ai uses **Supabase Auth** for user authentication. There is **no custom `/api/auth/*` REST API** in this repo; login/signup flows use the Supabase client and session cookies.

## ✅ What API routes do

Most `app/api/**/route.ts` handlers authenticate like this:

- Build a server Supabase client (see `lib/supabase/server.ts`)
- Call `supabase.auth.getUser()`
- Use the authenticated user’s `id` to look up `709_profiles` for `tenant_id` and `role`

If the user is missing/invalid, endpoints typically return:

- `401` with `{ error: "Unauthorized" }`

## 🧑‍💻 Calling authenticated endpoints

### From the web app (recommended)

Calls from the app usually rely on **Supabase session cookies**, so you don’t manually attach headers.

### From external clients

Send a Supabase access token as a Bearer token:

```http
Authorization: Bearer <supabase_access_token>
```

## 🔎 Where authorization rules live

Authorization is implemented per endpoint. Common patterns:

- Tenant-scoped access via the user’s `profile.tenant_id`
- Role checks against `profile.role` (for example `"super_admin"`, `"owner"`, `"admin"`)

If you need an endpoint’s exact rules, open the corresponding `app/api/.../route.ts`.

---

**Last Updated**: January 20, 2026