# AI Workers

This repo includes several **AI workers** that produce **structured artifacts** (tasks, notes, knowledge docs, decisions) rather than chat-only output. Worker UIs are centralized under the **AI hub** at `/admin/ai`.

## UI Routes (canonical)

- **AI hub**: `/admin/ai`
- **AI Team roster**: `/admin/ai/team`
- **Worker pages**: `/admin/ai/team/[workerId]`

### Legacy redirects (permanent)

- `/admin/chief-of-staff` → `/admin/ai/team/chief-of-staff`
- `/admin/ops` → `/admin/ai/team/ops`

## Worker Registry

Workers are defined in a single registry so the app can power:

- the AI Team roster
- route mapping (`workerId` → UI component)
- feature-gated visibility in navigation

**Source of truth**: `lib/ai/workers/registry.ts`

## Chief of Staff (Weekly Plan)

The **Chief of Staff** worker generates a weekly plan aligned to your goals and active work.

### POST /api/ai/plan/week

Generate a plan proposal.

**Used by UI**: `/admin/ai/team/chief-of-staff`

**Request (example):**

```json
{
  "start_date": "2026-01-20",
  "available_hours": 40,
  "non_negotiables": ["Gym 3x", "Investor update"],
  "focus_goal_ids": ["uuid-goal-1"],
  "focus_project_ids": ["uuid-project-1"],
  "additional_context": "Ship onboarding improvements before Friday"
}
```

**Response (high level):**

- `proposal`: structured plan output (outcomes, tasks to create, tasks to update, questions, concerns)
- `context_used`: counts of goals/tasks/notes included

**Prompt contract**: `lib/ai/prompts/chiefOfStaff.ts`

## AI Costs / Budgets

AI endpoints may record costs and enforce budgets.

### /api/ai/costs

See `app/api/ai/costs/route.ts` for the current API surface.

## Ops Worker

The **Ops Worker** turns decisions (meeting notes/emails/manual text) into tasks.

See **[Ops Worker](./ops-worker.md)**.

## Planned / Scaffolded Workers (UI present, APIs not yet implemented)

These workers currently have **typed prompt contracts** and **UI shells**, but the corresponding `/api/...` routes may not exist yet.

### Researcher

- **UI**: `/admin/ai/team/researcher`
- **Planned API**: `POST /api/ai/research`
- **Prompt contract**: `lib/ai/prompts/researcher.ts`
- **Outputs**: knowledge docs, facts, notes, tasks

### Writer

- **UI**: `/admin/ai/team/writer`
- **Planned API**: `POST /api/ai/write`
- **Prompt contract**: `lib/ai/prompts/writer.ts`
- **Outputs**: notes (drafts), email drafts, email templates

### Inbox Triage

- **UI**: `/admin/ai/team/inbox-triage`
- **Planned API**: `POST /api/ai/inbox/triage`
- **Prompt contract**: `lib/ai/prompts/inboxTriage.ts`
- **Outputs**: suggested replies, follow-up tasks, labels/tags

### Analyst (Weekly Review)

- **UI**: `/admin/ai/team/analyst`
- **Planned API**: `POST /api/ai/analyze/weekly`
- **Prompt contract**: `lib/ai/prompts/analyst.ts`
- **Outputs**: weekly review note, decisions for Ops ingest

## Sales Desk

The **Sales Desk** worker prepares for sales calls by generating call prep briefs, objection scripts, follow-up email drafts, and suggested next-step tasks.

- **Status**: beta
- **Feature flag**: `sales_desk_worker`
- **UI**: `/admin/ai/team/sales-desk`
- **Prompt contract**: `lib/ai/prompts/salesDesk.ts`
- **Job executor**: `lib/ai/jobs/workers/salesDeskPrep.ts`
- **Outputs**: call prep brief, talking points, objection scripts, follow-up drafts, tasks

### Job Enqueue (async via /api/ai/jobs)

Sales Desk runs as an **async job** (does not block the UI).

**Enqueue request:**

```json
POST /api/ai/jobs
{
  "worker_id": "sales-desk",
  "job_type": "sales_prep",
  "input": {
    "lead_name": "John Smith",
    "company_name": "Acme Corp",
    "opportunity_context": "Enterprise deal, Q1 close target, budget confirmed",
    "previous_emails": "Email thread pasted here (optional)",
    "known_objections": "Competitor evaluation, timing concern",
    "call_objective": "Book a pilot",
    "cheap_mode": false
  }
}
```

**Response (202 Accepted):**

```json
{
  "job": {
    "id": "uuid",
    "status": "queued",
    ...
  }
}
```

Poll `GET /api/ai/jobs/[jobId]` for status and results.

**Completed job `result.response` shape:**

```json
{
  "call_prep_brief": "Multi-paragraph summary...",
  "talking_points": ["Point 1", "Point 2", "Point 3"],
  "objection_scripts": [
    { "objection": "You're too expensive", "response": "I understand budget is..." }
  ],
  "follow_up_draft": {
    "subject": "Next steps from our call",
    "body": "Hi John,\n\nThank you for..."
  },
  "suggested_tasks": [
    { "title": "Send pilot proposal", "due_date": "2026-01-25", "priority": "high" }
  ],
  "reasoning": "Brief explanation of approach"
}
```

