# Storage API (stable)

Envelope: `{ data, error, traceId }` per `docs/api/STANDARDS.md`.

Storage is backed by **Cloudflare R2** with metadata stored in Postgres (`storage_buckets`, `storage_files`).

## Who should use it
- Features needing tenant-scoped file storage (uploads/downloads) without new infra.
- Admin tools managing tenant buckets on the platform tenant.
- Automations that need presigned URLs for client-side uploads.

## Why it exists
- Centralize storage auth + presign logic; avoid direct R2 exposure from clients.
- Provide consistent metadata (size, key, bucket) for search and billing.
- Enforce tenant isolation while supporting platform-wide super_admin operations.

## Risks & responsibilities
- Presigned URLs are time-limited; leaking them exposes the object temporarily.
- Super admin scope uses the platform tenant; double-check role to avoid cross-tenant leaks.
- Bulk deletes with `force` can remove data irreversibly; consider soft-delete lifecycle.

## Quick start
1) Authenticate (session cookies or bearer token). Super admins operate on the platform tenant automatically.
2) List buckets with `GET /api/storage/buckets`; create via `POST /api/storage/buckets`.
3) Obtain upload URLs with `POST /api/storage/upload`, then PUT the file to the returned `uploadUrl`.
4) Fetch download URLs via `GET /api/storage/download/:fileId`; delete with `DELETE /api/storage/files`.

## Auth & tenant behavior

- Most endpoints require auth (Supabase session).
- If the caller is `profile.role === "super_admin"`, storage operations are scoped to the **platform tenant** (`00000000-0000-0000-0000-000000000001`).

## Buckets

### GET `/api/storage/buckets`

List buckets for the current tenant, including `file_count` and `total_size` derived from `storage_files`.

### POST `/api/storage/buckets`

Create a bucket.

**Body**

```json
{ "name": "my-bucket", "isPublic": false, "corsOrigins": ["https://…"] }
```

### DELETE `/api/storage/buckets`

Delete a bucket.

**Body**

```json
{ "bucketId": "…", "force": false }
```

If `force` is true, the API soft-deletes bucket files before deleting the bucket record.

## Files

### GET `/api/storage/files`

List files.

- **Query params**:
  - `bucket` (optional): bucket name
  - `prefix` (optional): substring match against `key`
  - `limit` (optional, default `100`)
  - `offset` (optional, default `0`)

### POST `/api/storage/upload`

Create a file record and return a **presigned upload URL**.

**Body**

```json
{ "filename": "report.pdf", "contentType": "application/pdf", "size": 12345, "bucketName": "my-bucket", "path": "optional/folder" }
```

**Response**

```json
{ "uploadUrl": "https://…", "fileId": "…", "key": "…", "expiresAt": "…" }
```

### GET `/api/storage/download/:fileId`

Return a download URL for a file:

- Public files may return a public URL (if configured)
- Otherwise returns a presigned download URL

### DELETE `/api/storage/files`

Soft-delete files (and attempt to delete from R2).

**Body**

```json
{ "fileIds": ["…", "…"] }
```

---

**Last Updated**: January 20, 2026
