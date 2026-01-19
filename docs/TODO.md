# Project Todo

> Last updated: 2026-01-19

Master todo list for the Open People platform.

---

## Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Marketing Site | ✅ Complete | Landing, login, signup |
| Tenant Platform | ✅ Core done | Shop, admin dashboards |
| Super Admin | ✅ Core done | Tenants, storage, vault |
| Cloud Storage (R2) | ✅ Complete | Tenant-scoped file storage |
| Email (Resend) | ✅ Complete | Tenant-scoped email |
| Notifications (Twilio) | ✅ Complete | SMS notifications |
| Feature Flags | ✅ Complete | A/B experiments |
| Encrypted Vault | ✅ Phases 1-4 | Core encryption + AI analysis |
| Vault Automation | 🔲 Scaffolded | Phase 5: Email worker + rules UI/API aligned to schema |
| API Key Manager | ✅ Complete | AES-256 encrypted storage |
| Project Notes | ✅ Complete | MD editor + templates + external API |
| Quick Share | ✅ Complete | CLI, extension, token management |
| AI Chat | ✅ Complete | Memory, context, conversation history |
| MLF Foundation | ✅ Complete | Tenant/roles, activity ledger, knowledge store, AI traces |
| AI Personalization | ✅ Complete | Profile, communication style, goals |
| Context Assembly | ✅ Complete | Rules, deterministic builder, assemblies |
| Workflows/Tasks | ✅ Complete | Projects, tasks, rhythms, reminders |
| Automation | ✅ Complete | Integrations, webhooks, job runner |
| Observability | ✅ Complete | Traces, feedback, cost tracking |
| Global Search | ✅ Complete | Unified search, semantic + text, relevance |
| Knowledge Graph | ✅ Complete | Neural web visualization, Obsidian-style |

---

## Current Priorities

### 1. Quick Share System - COMPLETE

One-click file sharing to vault from any device.

- [x] Long-lived upload tokens with rate limiting
- [x] `POST /api/vault/quick-upload` endpoint
- [x] Token management UI (`/super-admin/vault/quick-share`)
- [x] Browser extension scaffold (Chrome/Firefox)
- [x] CLI tool (`scripts/vault-cli/vault-upload.js`)
- [x] AI auto-categorization on upload
- [ ] PWA share target for mobile (future)
- [ ] macOS menu bar app (future)

### 2. Vault Phase 5: Email Automation

Complete email-to-vault pipeline.

- [ ] Cloudflare Email Worker
- [ ] Email webhook receiver (`/api/vault/webhook/email`)
- [ ] Automation rules engine
- [ ] Rules management UI
- [ ] Auto-approval flow for trusted senders

### 3. MLF Foundation - COMPLETE

Minimum Lovable Foundation infrastructure.

- [x] Tenant memberships (multi-workspace support)
- [x] Tenant invitations system
- [x] Unified activity ledger
- [x] Knowledge store with citations
- [x] Knowledge facts (separated from raw chat)
- [x] AI run traces for explainability
- [x] Deterministic context builder
- [x] Context entities and presets
- [x] Knowledge and Activity UI pages

### 4. Testing Infrastructure

- [ ] Write comprehensive unit tests
- [ ] Write integration tests for APIs
- [ ] Write isolation tests (tenant data protection)
- [ ] Set up Playwright for E2E tests
- [ ] Add CI/CD pipeline (GitHub Actions)
- [ ] Add pre-commit hooks
- [ ] Database seed scripts for tests

---

## Infrastructure

### Security (HIGH PRIORITY)

- [ ] Add root `middleware.ts` for route protection
- [ ] Create `withTenantAuth()` and `withSuperAdminAuth()` helpers
- [ ] Audit all API routes for auth/authz gaps
- [ ] Review RLS policies completeness
- [ ] Add rate limiting to APIs
- [ ] Add CSRF protection
- [ ] Security headers (CSP, HSTS, etc.)

### API Quality

- [ ] Add Zod for request validation
- [ ] Create shared schemas in `/lib/schemas/`
- [ ] Standardize API error responses
- [ ] Add OpenAPI/Swagger documentation
- [ ] API versioning strategy

### Monitoring & Observability

- [ ] Structured logging (pino/winston)
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Correlation IDs for request tracing
- [ ] Audit log viewer UI
- [ ] Alerting for security events

---

## By Domain

### Marketing (`/app/(marketing)/`)

- [ ] SEO optimization
- [ ] Analytics integration
- [ ] Contact form
- [ ] Blog/content pages
- [ ] Pricing page

### Tenant Platform (`/app/(platform)/`)

- [ ] Onboarding flow completion
- [ ] Dashboard improvements
- [ ] File preview (images, PDFs)
- [ ] Better mobile responsiveness
- [ ] Tenant settings page

### Super Admin (`/app/super-admin/`)

- [ ] Tenant creation wizard
- [ ] Billing/subscription management
- [ ] Platform analytics dashboard
- [ ] User management UI
- [ ] System health monitoring

### Vault Enhancements

- [ ] File preview (decrypt in browser)
- [ ] Thumbnail generation
- [ ] Smart folders UI
- [ ] Full content AI analysis (OCR)
- [ ] Streaming encryption for large files

---

## Technical Debt

### High Priority

- [ ] Centralize auth/authz logic (scattered in routes)
- [ ] Add tenant_id middleware enforcement
- [ ] Standardize API error responses
- [ ] Add request validation (Zod)

### Medium Priority

- [ ] Extract shared components to library
- [ ] Add loading states/skeletons consistently
- [ ] Improve TypeScript strictness
- [ ] Event-driven processing (job queue)

### Low Priority

- [ ] Dark/light theme toggle
- [ ] Keyboard shortcuts
- [ ] Accessibility audit (WCAG)
- [ ] Performance optimization (bundle size)

---

## Documentation

- [x] Build isolation strategy (`docs/development/build-isolation.md`)
- [x] Vault detailed todo (`docs/vault-todo.md`)
- [x] AI Suggestions Inbox (`docs/suggestions-inbox.md`)
- [ ] API documentation (OpenAPI)
- [ ] Deployment guide
- [ ] Contributing guide
- [ ] Architecture overview

---

## Future Considerations

See [docs/suggestions-inbox.md](./suggestions-inbox.md) for detailed architectural suggestions.

**Key ideas for future:**
- Event-driven async processing (BullMQ/Inngest)
- Streaming encryption for large files
- API route generator for consistency
- Audit log retention & export
- Mobile apps for Quick Share

---

## Quick Reference

### Test Commands

```bash
npm run test           # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage report
npm run test:unit      # Unit tests only
npm run test:isolation # Isolation tests only
npm run test:vault     # Vault-related tests
```

### Development

```bash
npm run dev           # Start dev server
npm run build         # Production build
npm run lint          # Run linter
npm run typecheck     # Type checking
```

### Domains (Local)

```
http://localhost:3000           # Marketing
http://super.localhost:3000     # Super admin
http://demo.localhost:3000      # Tenant (add to /etc/hosts)
```

### Environment Variables (New Features)

```bash
# API Key encryption (generate: openssl rand -base64 32)
API_KEYS_ENCRYPTION_KEY=

# Vault encryption (generate: openssl rand -base64 32)
VAULT_ENCRYPTION_KEY=
```
