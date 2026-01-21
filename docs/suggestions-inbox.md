# AI Suggestions Inbox

> A persistent record of AI-generated suggestions, future enhancements, and long-term architectural outlooks.

**Last updated:** 2026-01-21

---

## How to Use This Document

**For AI Agents:**
- When you identify a potential enhancement or architectural improvement, add it here
- Use the template at the bottom for consistency
- Tag suggestions with relevant categories
- Don't remove suggestions - mark them as addressed when implemented

**For Developers:**
- Review periodically for valuable insights
- Move implemented suggestions to "Addressed" section
- Use as input for sprint planning

---

## Active Suggestions

### [DATA-OPS] Migration Idempotency & Drift Guardrails
**Priority:** Medium | **Added:** 2026-01-21

**Context:** Recent Supabase runs surfaced duplicate triggers/policies and partition clashes when reapplying migrations or using `--include-all`.

**Recommendation:**
1. Add a preflight script to scan migrations for duplicate names/version collisions and missing `DROP IF EXISTS`.
2. Standardize partition creation in migrations with `DO $$ BEGIN ... EXCEPTION WHEN duplicate_table THEN NULL; END $$;`.
3. Add CI step to run `supabase db diff` against a scratch database to catch drift before pushing.
4. Provide a one-click “reset and reseed” script for local environments to ensure clean replays.

**Impact:** Fewer migration failures, faster onboarding for new devs, safer recovery when replaying history.

---

### [SECURITY] Policy Lint & Auto-Fix
**Priority:** Medium | **Added:** 2026-01-21

**Context:** RLS policies have duplicated definitions and mixed patterns (`current_user_tenant_id` vs. manual subqueries), increasing risk of gaps.

**Recommendation:**
1. Build a lint script that flags duplicate policy names and inconsistent tenant scoping.
2. Offer autofix helpers to insert `DROP POLICY IF EXISTS` and standard predicates (tenant isolation + `is_super_admin()` escape).
3. Add the lint to CI and block pushes on policy duplicates or missing tenant predicates.
4. Generate a policy manifest (table → policies → predicates) to review during security audits.

**Impact:** Consistent tenant isolation, cleaner migrations, and reduced auth regressions.

---

### [OPERATIONS] Supabase Local Health Automation
**Priority:** Low | **Added:** 2026-01-21

**Context:** Local stack requires manual `--include-all` and ad-hoc checks to confirm containers, health endpoints, and ports.

**Recommendation:**
1. Add `npm run supabase:health` script: check container status, `:54321` readiness, `pg_isready`, and key service health endpoints.
2. Auto-suggest `--include-all` when local migrations precede remote head; print the pending list for clarity.
3. Tail structured logs for core services (db, auth, storage, realtime) with colored severity filters.
4. Document common recovery flows (reset volumes, reseed, relink project) and surface them in CLI help.

**Impact:** Faster local recovery, fewer blocked dev cycles, predictable setup for new contributors.

---

### [ARCHITECTURE] Event-Driven Processing
**Priority:** Medium | **Added:** 2026-01-18

**Context:** AI analysis runs inline after upload, could timeout for complex analysis.

**Recommendation:**
1. Implement job queue (BullMQ, Inngest, or Trigger.dev)
2. File upload emits "file.uploaded" event
3. Workers handle AI analysis, thumbnails async
4. UI polls or uses websockets for status

**Benefits:** Non-blocking uploads, retry failed jobs, scale workers independently

**Impact:** More reliable async processing, better UX

---


### [DEVEX] API Route Generator
**Priority:** Low | **Added:** 2026-01-18

**Context:** Many API routes follow same pattern: auth → get tenant → query → return.

**Recommendation:**
```typescript
generateCrudRoute({
  table: 'storage_files',
  basePath: '/api/storage/files',
  tenantScoped: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
});
```

**Impact:** Faster development, consistent patterns

---

### [SECURITY] Audit Log Retention & Export
**Priority:** Low | **Added:** 2026-01-18

**Context:** Audit logs grow indefinitely. Need retention policy for compliance.

**Recommendation:**
1. Retention policy (90 days hot, 1 year cold)
2. Export to R2 for long-term storage
3. UI to view and search audit logs
4. Export to CSV/JSON for compliance reports

**Impact:** Compliance readiness, storage management

---


## Addressed Suggestions

### [FEATURE] Notes Collaboration & Sharing
**Addressed:** 2026-01-20

**Original:** Notes system is complete but single-user only. Future considerations for sharing and collaboration.

**Implementation:**
- Added to TODO.md under Super Admin domain
- Share notes with other super admins (read-only or edit)
- Public note links (like Notion public pages)
- Collaborative editing (real-time sync)
- Comments and discussions on notes
- Export collections as documentation site

---

### [SECURITY] Centralized Auth Middleware
**Addressed:** 2026-01-20

**Original:** Auth/authz is scattered across individual API routes. Each route manually fetches user, checks tenant_id, etc.

**Implementation:**
- Enhanced TODO.md Security section with specific requirements
- Create root `middleware.ts` for all protected routes
- Create helpers: `withTenantAuth()`, `withSuperAdminAuth()`
- Inject `tenantId` and `user` into request context

---

### [ARCHITECTURE] API Request Validation
**Addressed:** 2026-01-20

**Original:** API routes accept JSON without validation. Invalid data could cause runtime errors.

**Implementation:**
- Enhanced TODO.md API Quality section with specific requirements
- Add Zod for schema validation
- Create shared schemas in `/lib/schemas/`
- Validate all request bodies at route entry
- Return consistent 400 errors for validation failures

---

### [UX] Vault File Preview
**Addressed:** 2026-01-20

**Original:** Users must download files to view them.

**Implementation:**
- Enhanced TODO.md Vault Enhancements section with specific requirements
- Images: Decrypt in memory, display in modal
- PDFs: Use pdf.js with decrypted data
- Text/code: Syntax-highlighted viewer
- Thumbnails: Generate on upload for gallery view

---

### [PERFORMANCE] Streaming Encryption for Large Files
**Addressed:** 2026-01-20

**Original:** Current encryption loads entire file into memory. Files >100MB could crash browser.

**Implementation:**
- Enhanced TODO.md Vault Enhancements section with specific requirements
- Switch from AES-GCM to AES-CTR + HMAC for streaming
- Implement chunked upload with progress
- Use Web Workers for non-blocking encryption
- Add file size warnings/limits in UI

---

### [FEATURE] Smart Folders with Saved Searches
**Addressed:** 2026-01-20

**Original:** Database supports `is_smart_folder` but UI doesn't implement it.

**Implementation:**
- Enhanced TODO.md Vault Enhancements section with specific requirements
- Add UI to create smart folders
- Store search criteria (category, tags, date range)
- Smart folders auto-update based on criteria
- Example: "All Invoices from 2026" auto-populates

---

### [TESTING] Database Seeding
**Addressed:** 2026-01-20

**Original:** Tests need realistic data. Manual test data is tedious and inconsistent.

**Implementation:**
- Enhanced TODO.md Testing Infrastructure section with specific requirements
- Create `scripts/seed/` directory structure
- `tenants.ts` - 3 tenants: active, suspended, trial
- `users.ts` - Users for each tenant + super admin
- `storage.ts` - Sample files and buckets
- `vault.ts` - Sample vault with files

---

### [MONITORING] Structured Logging
**Addressed:** 2026-01-20

**Original:** Current logging is inconsistent `console.log/error`. Hard to search.

**Implementation:**
- Enhanced TODO.md Monitoring & Observability section with specific requirements
- Add structured logging (pino/winston)
- Include context: tenant_id, user_id, request_id
- Log levels: debug, info, warn, error
- JSON format for log aggregation

---

### [FEATURE] API Key Management System
**Addressed:** 2026-01-19

**Original:** Create secure storage for API keys across projects.

**Implementation:**
- `supabase/migrations/20260119130000_api_keys_schema.sql`
- AES-256-GCM encryption at rest
- Environment grouping (dev/staging/prod)
- Key validity testing for 10+ providers
- Usage tracking and audit logging
- Full UI at `/super-admin/keys`

---

### [FEATURE] Project Notes Editor
**Addressed:** 2026-01-19

**Original:** Build notes system with MD export for project scaffolding.

**Implementation:**
- `supabase/migrations/20260119140000_notes_schema.sql`
- Rich markdown editor with live preview
- 5 system templates (Project, API, ADR, Meeting, Agent Context)
- Version history with restore
- External API at `/api/v1/notes` with API key auth
- Categories, tags, and project organization
- Export as .md with frontmatter

---

### [FEATURE] Quick Share Multi-Platform
**Addressed:** 2026-01-19

**Original:** Create frictionless way to send files to vault from any device.

**Implementation:**
- `supabase/migrations/20260119150000_quick_share_schema.sql`
- Long-lived upload tokens with rate limiting
- `POST /api/vault/quick-upload` endpoint with AI categorization
- Token management UI at `/super-admin/vault/quick-share`
- CLI tool at `scripts/vault-cli/vault-upload.js`
- Browser extension scaffold at `scripts/vault-extension/`
- Quick share inbox for pending review
- Auto-approve option for trusted tokens

---

### [FEATURE] AI Chat with Persistent Memory
**Addressed:** 2026-01-19

**Original:** Create AI chat that remembers everything, stores conversations, and learns from interactions.

**Implementation:**
- `supabase/migrations/20260119160000_ai_chat_schema.sql`
  - Conversations, messages, memories, context snapshots, attachments
  - pgvector for semantic memory search
- Memory system with automatic extraction from conversations
- Context builder for notes, vault files, and folders
- OpenAI integration with full conversation history
- Memory categories: preference, fact, instruction, context
- Source tracking for AI responses
- Manual memory management UI
- Chat UI at `/super-admin/chat`

**Features:**
- Persistent conversation history
- Automatic memory extraction
- Semantic memory search (pgvector)
- Attach notes/files/folders as context
- View what context was used for each response
- Manual memory creation/deletion
- Toggle memory on/off per conversation

---

### [FEATURE] Context Assembly + Workflows + Automation + Observability + Search
**Addressed:** 2026-01-19

**Original Requirements:**
1. Context Assembly Layer - toggles + rules for deterministic context building
2. Workflow/Tasks - projects, tasks, checklists, routines, rhythms
3. Automation + Integrations - connectors, webhooks, job runner
4. Observability + Quality - traces, feedback loops, cost tracking
5. Search + Navigation UX - unified search with relevance explanation

**Implementation:**

**Schema:** `supabase/migrations/20260119190000_context_workflows_schema.sql`

**1. Context Assembly Layer**
- `context_rules` - Include/exclude rules with conditions
  - Rule types: always_include, always_exclude, include_if, exclude_if
  - Target by ID or pattern (e.g., "tag:important", "contracts/*")
  - Priority ordering for conflict resolution
- `context_assemblies` - Saved context configurations
  - Static inclusions (notes, files, folders, entities, documents)
  - Dynamic settings (facts, memories, goals, profile)
  - Token limits, rule references
- `context_assembly_logs` - Audit what was assembled per message
- `lib/workflows/context-assembly.ts` - Deterministic builder

**2. Workflows & Tasks**
- `projects` - Hierarchical project structure
  - Status, dates, progress tracking
- `tasks` - Full task management
  - Hierarchy (subtasks), position ordering
  - Priority, due dates, assignments
  - Checklists within tasks
  - Recurring tasks with rules
- `task_dependencies` - Finish-to-start, etc.
- `operating_rhythms` - Weekly review, quarterly planning
  - Schedule, agenda templates, prompts
  - Streak and completion tracking
- `rhythm_completions` - Session logs with AI summaries
- `reminders` - Multi-channel delivery
- APIs: `/api/workflows/tasks`, `/api/workflows/projects`

**3. Automation & Integrations**
- `integrations` - OAuth connectors
  - Providers: Google, Slack, GitHub, Notion, Linear, etc.
  - Encrypted credentials, token refresh
- `webhooks` - Incoming webhooks
  - Custom endpoints, secret hashing
  - Action triggers (create_task, run_automation, etc.)
- `webhook_logs` - Request/response logging
- `automation_jobs` - Scheduled/triggered flows
  - Trigger types: schedule (cron), webhook, event, manual
  - Multi-step action chains
- `job_runs` - Execution history with step results

**4. Observability & Quality**
- `ai_run_tool_calls` - Detailed tool usage traces
- `ai_feedback` - Good/bad/neutral ratings
  - Feedback types: accuracy, helpfulness, tone, etc.
  - Issue tracking, expected answer capture
- `ai_costs` - Per-run cost tracking (cents precision)
- `ai_cost_budgets` - Daily/weekly/monthly limits
  - Alert thresholds, exceed actions (warn/block/downgrade)
- `ai_evaluations` - Test case harness for quality
- `lib/workflows/observability.ts` - Utilities
- APIs: `/api/ai/feedback`, `/api/ai/costs`

**5. Global Search**
- `search_index` - Denormalized, indexed table
  - Entity type, title, content, preview
  - pgvector embeddings for semantic search
  - Full-text search via tsvector
  - Tags, category, status for filtering
- `search_queries` - Query logging for analytics
- `unified_search()` - PostgreSQL function
  - Combined text + semantic results
  - Relevance scoring, match type
- `lib/workflows/search.ts`
  - `unifiedSearch()` - Full search with explanations
  - `quickSearch()` - Fast text-only search
  - `indexEntity()` - Add to search index
  - `getSearchSuggestions()` - Autocomplete
- API: `/api/search`
  - POST for full search with filters
  - GET for quick search and suggestions
  - `?explain=true` for relevance explanations

**Types:** `types/workflows.ts`

---

### [FEATURE] AI Personalization Profile
**Addressed:** 2026-01-19

**Original:** Create customizable AI settings to tailor how it speaks to you. Help understand yourself better - your "why", strengths, weaknesses, and passions.

**Implementation:**

**1. User Profile (`ai_user_profiles`)**
- Identity: preferred name, self-description, roles, life stage
- Purpose: core "why", mission statement, long-term vision, core values (ranked)
- Strengths & Growth: strengths, growth areas, passions, expertise, learning goals
- Communication preferences: style, formality, detail level, emotional support
- Toggles: challenge thinking, celebrate wins, use analogies, humor, philosophical
- Current context: focus, challenges, important context
- Boundaries: topics to avoid, sensitive areas

**2. Goals (`ai_user_goals`)**
- Title, description, why it's important
- Categories: personal, professional, health, relationship, financial, learning
- Timeframes: daily to life-long
- Progress tracking with milestones
- Connection to "why"

**3. Conversation Styles (`ai_conversation_styles`)**
- System presets: Executive Coach, Thoughtful Mentor, Creative Partner, Analytical Advisor, Supportive Friend
- Custom styles with full customization
- Quick style switching

**4. Personalization Library (`lib/ai-profile/personalization.ts`)**
- `buildPersonalizedPrompt()` - Creates tailored system prompt from profile
- Section builders for identity, purpose, strengths, communication, goals
- Discovery questions for onboarding
- Reflection prompt generator

**5. Integration**
- Profile automatically injected into chat system prompt
- Active goals included in context
- Communication style controls AI tone
- Profile completeness tracking

**API Endpoints:**
- `/api/profile` - Get/update AI profile
- `/api/profile/goals` - CRUD for goals
- `/api/profile/styles` - Conversation style presets

**UI:**
- `/super-admin/chat/profile` - Full profile editor with tabs:
  - Identity: name, description, roles, life stage
  - Purpose & Values: why, mission, vision, core values
  - Strengths & Growth: add/remove strengths, growth areas, passions
  - Communication: style presets, fine-tune all settings
  - Goals: create, track, complete goals

---

### [FEATURE] Minimum Lovable Foundation (MLF)
**Addressed:** 2026-01-19

**Original:** Build core infrastructure for production-ready AI-native platform:
- Tenant/workspace + roles
- Activity ledger
- Conversations + notes memory (separate "remembered facts" from raw chat)
- Knowledge store + retrieval with citations
- Context toggles (files/folders/entities) feeding a deterministic context builder
- AI run traces (so you can answer "why did it say that?")

**Implementation:**

**1. Tenant Memberships (`tenant_memberships`, `tenant_invitations`)**
- Multi-workspace support: users can belong to multiple tenants
- Role per tenant: owner, admin, member, viewer
- Invitation system with tokens and expiration
- RLS policies for tenant isolation

**2. Activity Ledger (`activity_ledger`)**
- Centralized logging for all platform actions
- Actor tracking (user, system, ai, api)
- Resource tracking with before/after changes
- Action categories: auth, data, ai, admin, security
- `lib/mlf/activity.ts` utilities
- Activity summary for dashboards
- UI at `/super-admin/activity`

**3. Knowledge Store (`knowledge_documents`, `knowledge_chunks`, `knowledge_citations`)**
- Documents with automatic chunking for RAG
- pgvector embeddings on chunks
- Citations tracking what was used and where
- `search_knowledge()` PostgreSQL function
- `lib/mlf/context-builder.ts` for deterministic context assembly

**4. Knowledge Facts (`knowledge_facts`, `fact_contradictions`)**
- Facts extracted and stored separately from raw chat
- Fact types: user_preference, project_detail, business_rule, contact, date, etc.
- Confidence scoring and verification workflow
- Temporal validity (valid_from, valid_until, is_current)
- Contradiction detection and resolution
- `lib/mlf/facts.ts` utilities
- UI at `/super-admin/knowledge`

**5. AI Run Traces (`ai_runs`, `ai_run_context_items`)**
- Every AI invocation is traced
- Input/output tracking with token counts
- Context used breakdown (memories, notes, files, chunks, facts)
- Reasoning and confidence capture
- Performance metrics (latency, time to first token)
- Cost estimation
- `lib/mlf/ai-traces.ts` with `startAIRun()` handle pattern
- `explainResponse()` for "why did it say that?"

**6. Context Entities & Presets (`context_entities`, `context_presets`)**
- Named entities (person, company, project, product, concept)
- Saved context combinations for quick loading
- Deterministic context builder with token limits

**API Endpoints:**
- `/api/mlf/activity` - Activity ledger
- `/api/mlf/facts` - Knowledge facts CRUD
- `/api/mlf/knowledge` - Knowledge documents
- `/api/mlf/knowledge/search` - Semantic search
- `/api/mlf/runs/[runId]` - AI run traces with explanation

---

## Template

```markdown
### [CATEGORY] Title
**Priority:** High / Medium / Low | **Added:** YYYY-MM-DD

**Context:** What prompted this suggestion?

**Recommendation:**
1. Step one
2. Step two
3. Step three

**Impact:** Why does this matter?
```

**Categories:** `SECURITY`, `ARCHITECTURE`, `PERFORMANCE`, `UX`, `FEATURE`, `DEVEX`, `TESTING`, `MONITORING`, `DOCS`
