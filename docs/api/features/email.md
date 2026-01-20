# Email API

Email supports:

- **Sending** (Resend by default; can also send via configured accounts/providers)
- **Accounts** (SMTP/IMAP/POP3/Resend, plus “managed” DNS-only domains)
- **Templates**
- **Inbox/messages storage** (`email_messages`) + basic sync
- **Delivery logs** (`email_logs`) + webhook updates

## Sending

### POST `/api/email/send`

Send an email for the current tenant.

- Enforces plan limits via `email_subscriptions` + `email_usage`
- Can optionally send via a specific `email_accounts` record

**Body (common fields)**

```json
{
  "to": "person@example.com",
  "subject": "Hello",
  "html": "<p>Hi</p>",
  "text": "Hi",
  "templateId": "optional-template-uuid",
  "templateVariables": { "name": "…" },
  "cc": ["…"],
  "bcc": ["…"],
  "replyTo": "…",
  "accountId": "optional-email-account-uuid",
  "saveToSent": true
}
```

## Accounts

### GET/POST/PUT/DELETE `/api/email/accounts`

Manage `email_accounts`.

- Super-admins can pass `tenant_id` to manage accounts across tenants.
- Account passwords (SMTP/IMAP/POP3) are encrypted at rest.

### POST `/api/email/accounts/test`

Test connectivity for an account.

**Body**

```json
{ "accountId": "…" }
```

## Domains

### GET/POST/DELETE `/api/email/domains`

Manage Resend custom sending domains (`email_domains`).

Plan limits are enforced via `email_subscriptions`.

### GET/POST/PUT/DELETE `/api/email/domains/managed`

Managed domains are a DNS-only setup path backed by `managed_email_domains`.

`PUT` supports actions like `verify` / `refresh` (see route handler for details).

## Templates

### GET/POST/PUT/DELETE `/api/email/templates`

Manage `email_templates`.

## Inbox & Messages

### GET `/api/email/inbox`

List messages from `email_messages`.

- **Query params**:
  - `accountId` (optional)
  - `mailbox` (optional, default `INBOX`, use `all` to not filter)
  - `direction` (optional: `inbound` | `outbound`)
  - `status` (optional)
  - `unread` (optional: `true`)
  - `starred` (optional: `true`)
  - `search` (optional: matches `subject`, `from_address`, `body_preview`)
  - `limit` (optional, default `50`)
  - `offset` (optional, default `0`)

### GET `/api/email/messages/:id`

Fetch message detail (also marks the message read).

### PUT `/api/email/messages/:id`

Update fields such as `is_read`, `is_starred`, `is_archived`, `is_deleted`, `is_spam`, `mailbox`, `labels`.

### DELETE `/api/email/messages/:id`

Soft-deletes by default. Pass `?permanent=true` to hard-delete.

### POST `/api/email/inbox/sync`

Fetch messages from an account provider and store them into `email_messages`.

**Body**

```json
{ "accountId": "…", "mailbox": "INBOX", "limit": 50 }
```

### GET `/api/email/inbox/stats`

Fetch inbox stats. Optionally filter by account:

- `GET /api/email/inbox/stats?accountId=...`

## Logs & webhooks

### GET `/api/email/logs`

List `email_logs` records with optional `status`, plus pagination via `limit`/`offset`.

### POST `/api/email/webhooks`

Receives Resend delivery webhooks and updates `email_logs` and `email_usage`.

### POST `/api/email/inbound/webhook`

Inbound email webhook for managed email. Supports JSON, multipart form-data, or raw RFC822 payloads.

---

**Last Updated**: January 20, 2026
