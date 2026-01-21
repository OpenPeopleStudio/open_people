# Workflows API (stable)

Envelope: `{ data, error, traceId }` per `docs/api/STANDARDS.md`.

Workflows are the “operating system” layer: projects + tasks (plus search indexing).

Routes live under `app/api/workflows/**`.

## Who should use it
- Users building task/project experiences inside the product.
- Automations that need to create or triage tasks for a human user.
- AI workers that should operate on server-owned task data instead of custom tables.

## Why it exists
- Provide a shared task model so chat/notes/ops-worker can coordinate on the same entities.
- Keep prioritization, due dates, and search indexing consistent across clients.
- Allow incremental rollout of features without duplicating task storage.

## Risks & responsibilities
- Task mutations can be noisy; respect rate limits and avoid bulk loops without backoff.
- Incorrect tenant/auth could surface another tenant’s tasks—always use auth middleware.
- Search indexing may lag briefly; design idempotent clients to handle eventual consistency.

## Quick start
1) Authenticate (Supabase cookies or bearer token).
2) `GET /api/workflows/projects` or `/tasks` to display the current user’s work.
3) `POST /api/workflows/projects` or `/tasks` to add items; include `parent_id` for nesting.
4) Use query params (`status`, `due_within`, `priority`) to power filtered views.

## Projects

### GET `/api/workflows/projects`

List projects for the current user.

### POST `/api/workflows/projects`

Create a project.

## Tasks

### GET `/api/workflows/tasks`

List tasks for the current user.

- **Common query params**:
  - `project_id`
  - `status` (`active` expands to “not done/cancelled”)
  - `priority`
  - `due_within` (days)
  - `limit`

### POST `/api/workflows/tasks`

Create a task (optionally nested via `parent_id`).

### GET/PATCH/DELETE `/api/workflows/tasks/:taskId`

Fetch/update/delete an individual task.

---

**Last Updated**: January 20, 2026
