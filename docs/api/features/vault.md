# Vault API (stable)

Envelope: `{ data, error, traceId }` per `docs/api/STANDARDS.md`.

Vault is an encrypted, tenant-scoped “secure inbox” for sensitive files and artifacts. It supports:

- vault setup + unlock sessions
- folders + files (upload/download/delete)
- tokenized sharing/inbound workflows
- AI analysis helpers for content extraction and suggestions

Routes live under `app/api/vault/**`.

## Setup + status

- `POST /api/vault/setup` - initialize the vault for the tenant
- `GET /api/vault/status` - summary stats (file counts, size, setup state)

## Unlock + sessions

- `POST /api/vault/unlock` - unlock the vault (creates an unlock session)
- `GET /api/vault/sessions` and `GET /api/vault/sessions/:sessionId` - list/fetch sessions
- `POST /api/vault/password` - set/update vault password (if enabled)
- `GET /api/vault/recovery-codes` - recovery code workflows

## Folders

- `GET/POST /api/vault/folders` - list/create folders
- `GET/PATCH/DELETE /api/vault/folders/:folderId` - folder operations

## Files

- `GET/POST /api/vault/files` - list/upload metadata
- `GET/PATCH/DELETE /api/vault/files/:fileId` - file operations
- `POST /api/vault/files/confirm` - confirm an upload (finalize metadata, indexing, etc.)
- `POST /api/vault/quick-upload` - convenience upload path for demo / quick starts

## Inbox + tokens

- `GET /api/vault/inbox` - inbound items / secure intake
- `GET/POST /api/vault/tokens` and `GET /api/vault/tokens/:tokenId` - tokenized access/sharing

## AI helpers

- `POST /api/vault/ai/analyze` - high-level analysis entrypoint
- `POST /api/vault/ai/analyze-content` - content extraction / structured parsing
- `GET /api/vault/suggestions` - suggested actions (tasks, notes, redaction)

## Webhooks

- `POST /api/vault/webhook/email` - inbound email → vault intake

---

**Last Updated**: January 20, 2026
