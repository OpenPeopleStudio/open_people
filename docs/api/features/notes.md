# Notes API (stable)

Envelope: `{ data, error, traceId }` per `docs/api/STANDARDS.md`.

Notes provide a lightweight knowledge/documentation system (markdown-first) with templates, versions, and a link graph.

Primary routes live under `app/api/notes/**`.

## Notes

### GET `/api/notes`

List notes for the current user.

- Supports filters such as `category_id`, `project_name`, `status`, `is_pinned`, `is_template`, `search`.

### POST `/api/notes`

Create a note.

### GET/PATCH/DELETE `/api/notes/:noteId`

Fetch/update/delete a note.

## Versions + export

- `GET /api/notes/:noteId/versions` - list versions
- `GET /api/notes/:noteId/export` - export a note (for example as markdown)

## Graph + links

- `GET /api/notes/graph` - link graph data
- `GET/POST /api/notes/:noteId/links` - manage outbound links

## Templates + categories

- `GET /api/notes/templates` - list note templates
- `GET /api/notes/categories` - list categories

## Legacy

- `GET/POST /api/v1/notes` - legacy compatibility endpoint

---

**Last Updated**: January 20, 2026
