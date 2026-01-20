# Storage API

Storage is backed by **Cloudflare R2** with metadata stored in Postgres (`storage_buckets`, `storage_files`).

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
