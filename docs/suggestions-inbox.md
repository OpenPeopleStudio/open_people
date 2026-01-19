# AI Suggestions Inbox

> A persistent record of AI-generated suggestions, future enhancements, and long-term architectural outlooks.

**Last updated:** 2026-01-19

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

### [SECURITY] Centralized Auth Middleware
**Priority:** High | **Added:** 2026-01-18

**Context:** Auth/authz is scattered across individual API routes. Each route manually fetches user, checks tenant_id, etc.

**Recommendation:**
1. Create root `middleware.ts` for all protected routes
2. Create helpers: `withTenantAuth()`, `withSuperAdminAuth()`
3. Inject `tenantId` and `user` into request context

**Impact:** Reduces duplication, prevents auth bypass bugs, easier to audit

---

### [ARCHITECTURE] API Request Validation
**Priority:** Medium | **Added:** 2026-01-18

**Context:** API routes accept JSON without validation. Invalid data could cause runtime errors.

**Recommendation:**
1. Add Zod for schema validation
2. Create shared schemas in `/lib/schemas/`
3. Validate all request bodies at route entry
4. Return consistent 400 errors for validation failures

```typescript
// Example
const body = createFolderSchema.parse(await request.json());
```

**Impact:** Prevents invalid data, better error messages, self-documenting APIs

---

### [UX] Vault File Preview
**Priority:** Medium | **Added:** 2026-01-18

**Context:** Users must download files to view them.

**Recommendation:**
1. Images: Decrypt in memory, display in modal
2. PDFs: Use pdf.js with decrypted data
3. Text/code: Syntax-highlighted viewer
4. Thumbnails: Generate on upload for gallery view

**Technical Note:** Preview must happen client-side for zero-knowledge encryption.

**Impact:** Major UX improvement for document management

---

### [PERFORMANCE] Streaming Encryption for Large Files
**Priority:** Low | **Added:** 2026-01-18

**Context:** Current encryption loads entire file into memory. Files >100MB could crash browser.

**Recommendation:**
1. Switch from AES-GCM to AES-CTR + HMAC for streaming
2. Implement chunked upload with progress
3. Use Web Workers for non-blocking encryption
4. Add file size warnings/limits in UI

**Impact:** Enables large file support, better memory usage

---

### [FEATURE] Smart Folders with Saved Searches
**Priority:** Medium | **Added:** 2026-01-18

**Context:** Database supports `is_smart_folder` but UI doesn't implement it.

**Recommendation:**
1. Add UI to create smart folders
2. Store search criteria (category, tags, date range)
3. Smart folders auto-update based on criteria
4. Example: "All Invoices from 2026" auto-populates

**Impact:** Powerful organization without manual filing

---

### [TESTING] Database Seeding
**Priority:** Medium | **Added:** 2026-01-18

**Context:** Tests need realistic data. Manual test data is tedious and inconsistent.

**Recommendation:**
```
scripts/seed/
  tenants.ts      # 3 tenants: active, suspended, trial
  users.ts        # Users for each tenant + super admin
  storage.ts      # Sample files and buckets
  vault.ts        # Sample vault with files
```

**Impact:** Reliable tests, easier debugging

---

### [MONITORING] Structured Logging
**Priority:** Medium | **Added:** 2026-01-18

**Context:** Current logging is inconsistent `console.log/error`. Hard to search.

**Recommendation:**
1. Add structured logging (pino/winston)
2. Include context: tenant_id, user_id, request_id
3. Log levels: debug, info, warn, error
4. JSON format for log aggregation

```typescript
logger.info('file_uploaded', {
  tenant_id, user_id, file_id, size_bytes, duration_ms
});
```

**Impact:** Easier debugging, better observability

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


### [FEATURE] Notes Collaboration & Sharing
**Priority:** Low | **Added:** 2026-01-19

**Context:** Notes system is complete but single-user only.

**Future Considerations:**
1. Share notes with other super admins (read-only or edit)
2. Public note links (like Notion public pages)
3. Collaborative editing (real-time sync)
4. Comments and discussions on notes
5. Export collections as documentation site

**Impact:** Team knowledge sharing, public documentation

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
