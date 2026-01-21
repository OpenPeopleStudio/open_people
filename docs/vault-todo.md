# Vault Feature - Todo & Status

> Last updated: 2026-01-18

## Overview

Super Admin Encrypted Vault with R2 storage, client-side encryption, AI analysis, and email automation.

---

## Phase Status

| Phase | Status | Description |
|-------|--------|-------------|
| 1. Foundation | ✅ Complete | Database schema, encryption utilities, setup/unlock flows |
| 2. File Management | ✅ Complete | Browse UI, folders, upload/download, search/filter |
| 3. Encryption UX | ✅ Complete | Client-side crypto, password change, session management |
| 4. AI Integration | ✅ Complete | OpenAI analysis, suggestions, inbox review |
| 5. Automation | ✅ Complete | Email ingestion, automation rules (UI/API wired to schema) |

---

## Phase 5: Automation - Todo

### Email Ingestion (Cloudflare Email Worker)

- [x] **Create Cloudflare Email Worker**
  - Location: `workers/vault-email-worker/` (separate deployment)
  - Receives emails at `vault-ingest@yourdomain.com`
  - Extracts attachments
  - Encrypts with vault's public key (or stores encrypted pending approval)
  - Calls webhook to create inbox items

- [x] **Email Webhook API**
  - Location: `app/api/vault/webhook/email/route.ts`
  - Validates webhook signature
  - Creates `vault_inbox` entries
  - Triggers AI analysis on attachments
  - Matches against automation rules

- [x] **Email Configuration**
  - Add Cloudflare Email Routing setup instructions
  - DNS records for email receiving
  - Worker deployment scripts

### Automation Rules

- [x] **Rules API**
  - Location: `app/api/vault/automation/rules/route.ts`
  - CRUD operations for automation rules
  - Rule matching logic
  - Fields (schema-aligned): `email_from_pattern`, `email_from_exact[]`, `email_subject_pattern`, `email_subject_contains[]`, `attachment_types`, `attachment_name_pattern`, size bounds, `target_folder_id`, `auto_approve`, `ai_classify`, `apply_tags`, `priority`

- [x] **Rules UI**
  - Location: `app/super-admin/vault/automation/page.tsx`
  - List existing rules
  - Create/edit form uses pattern + exact/contains fields, attachment filters, target folder, auto-approve toggle, priority
  - Enable/disable rules
  - Test rule against recent emails

- [ ] **Rule Matching Engine**
  - Location: `lib/vault/automation.ts`
  - Match incoming emails against rules
  - Support wildcards and regex patterns
  - Priority ordering

### Integration Points

- [x] **Update inbox to show matched rule**
- [x] **Auto-approve flow** (bypass inbox for trusted rules)
- [x] **Email metadata storage** (from, subject, date, message-id)
- [ ] **Attachment deduplication** (check content hash before creating)

---

## Known Issues & Technical Debt

### High Priority

- [ ] **Full content AI analysis** - Currently only filename-based for encrypted files
  - Need client to decrypt and send content for full analysis
  - Consider: decrypt in secure iframe, send to AI, discard
  
- [ ] **Large file handling** - Files over 100MB may cause memory issues
  - Consider streaming encryption with AES-CTR + HMAC
  - Chunked upload/download

- [ ] **Session token refresh** - No automatic token refresh implemented
  - Currently 30-minute hard expiry
  - Add refresh mechanism or warning before expiry

### Medium Priority

- [ ] **Offline indicator** - No UI feedback when vault session expires
- [ ] **File preview** - No in-browser preview for images/PDFs
- [ ] **Thumbnail generation** - `thumbnail_key` field unused
- [ ] **Smart folders** - Schema exists but UI not implemented
- [ ] **Bulk operations** - Need progress indicator for bulk delete/move
- [ ] **Search improvements** - Add full-text search on AI summary/tags

### Low Priority

- [ ] **Keyboard shortcuts** - Add shortcuts for common actions
- [ ] **Drag to reorder** - Folder drag-and-drop reordering
- [ ] **File versioning** - Schema supports it, UI doesn't
- [ ] **Audit log viewer** - No UI to view audit logs
- [ ] **Export/backup UI** - Schema has `vault_backups`, no UI

---

## Database Tables (Reference)

```
vault_spaces           - Vault metadata per super admin
vault_encryption_keys  - Encrypted DEKs
vault_folders          - Folder hierarchy + smart folders
vault_files            - File metadata + AI results
vault_automation_rules - Email automation rules
vault_inbox            - Pending review items
vault_suggestions      - AI organization suggestions
vault_audit_log        - Security audit trail
vault_sessions         - Active unlock sessions
vault_recovery_codes   - One-time recovery codes
vault_backups          - Backup records
```

---

## API Routes (Reference)

```
/api/vault/status              GET     - Check vault existence
/api/vault/setup               POST    - Create new vault
/api/vault/unlock              POST    - Unlock vault
/api/vault/unlock              DELETE  - Lock vault

/api/vault/files               GET     - List files
/api/vault/files               DELETE  - Soft delete files
/api/vault/files               PATCH   - Update file metadata
/api/vault/files/[id]          GET     - Get file details/download URL
/api/vault/files/confirm       POST    - Confirm upload

/api/vault/upload              POST    - Get presigned upload URL

/api/vault/folders             GET     - List folders
/api/vault/folders             POST    - Create folder
/api/vault/folders/[id]        GET     - Get folder details
/api/vault/folders/[id]        PATCH   - Update folder
/api/vault/folders/[id]        DELETE  - Delete folder

/api/vault/ai/analyze          POST    - Analyze file (server-side)
/api/vault/ai/analyze-content  POST    - Analyze decrypted content

/api/vault/suggestions         GET     - List suggestions
/api/vault/suggestions         POST    - Generate suggestions
/api/vault/suggestions         PATCH   - Accept/dismiss suggestion

/api/vault/inbox               GET     - List inbox items
/api/vault/inbox               PATCH   - Approve/reject item

/api/vault/sessions            GET     - List sessions
/api/vault/sessions            DELETE  - Revoke all other sessions
/api/vault/sessions/[id]       DELETE  - Revoke specific session

/api/vault/password            POST    - Change password
/api/vault/recovery-codes      GET     - Get remaining count
/api/vault/recovery-codes      POST    - Regenerate codes

/api/vault/qr                  POST    - Generate QR unlock
/api/vault/qr                  GET     - Poll QR status
/api/vault/qr/approve          POST    - Approve QR unlock
```

---

## UI Pages (Reference)

```
/super-admin/vault                    - Main dashboard
/super-admin/vault/browse             - File browser
/super-admin/vault/inbox              - Review automation inbox
/super-admin/vault/suggestions        - AI suggestions
/super-admin/vault/settings           - Security settings
/super-admin/vault/automation         - Automation rules (TODO)
```

---

## Environment Variables Required

```env
# R2 Storage (existing)
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_R2_ENDPOINT=

# OpenAI (for AI analysis)
OPENAI_API_KEY=

# Email Worker Webhook (Phase 5)
VAULT_WEBHOOK_SECRET=
```

---

## Testing Checklist

### Automated Tests (see `__tests__/`)

- [x] Unit tests for encryption utilities (`__tests__/unit/lib/vault/encryption.test.ts`)
- [ ] Unit tests for AI analysis functions
- [ ] Unit tests for automation matching
- [ ] Integration tests for vault API routes
- [ ] Isolation tests for vault access control

### Manual Testing

- [ ] Create new vault with strong password
- [ ] Unlock/lock vault
- [ ] Upload file and verify encryption
- [ ] Download file and verify decryption
- [ ] Create folders and organize files
- [ ] Search and filter files
- [ ] Verify AI categorization
- [ ] Generate and act on suggestions
- [ ] Change password
- [ ] Use recovery code
- [ ] Revoke session from another device
- [ ] QR code unlock flow

### Security Testing

- [ ] Verify files are encrypted at rest in R2
- [ ] Verify DEK is encrypted with password-derived key
- [ ] Verify session expiry works
- [ ] Verify RLS policies block cross-vault access
- [ ] Verify password requirements enforced
- [ ] Verify audit log captures all actions

---

## Notes

- All files are encrypted client-side before upload using AES-256-GCM
- Server never sees unencrypted file content
- Each vault has isolated encryption keys
- AI analysis works on filenames for encrypted files, or decrypted content if client sends it
- Recovery codes are hashed with bcrypt, originals shown once at creation
