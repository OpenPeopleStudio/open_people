# Workflows API

Workflows are the “operating system” layer: projects + tasks (plus search indexing).

Routes live under `app/api/workflows/**`.

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

