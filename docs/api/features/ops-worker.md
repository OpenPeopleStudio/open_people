# Ops Worker (stable)

Envelope: `{ data, error, traceId }` per `docs/api/STANDARDS.md`.

The Ops Worker is an AI-powered assistant that transforms decisions, meeting notes, emails, and other inputs into structured, actionable tasks with checklists and due dates.

## Overview

The Ops Worker follows a three-step workflow:

1. **Ingest** - Store the raw decision content with source metadata
2. **Propose** - AI analyzes the content and generates task proposals
3. **Commit** - User reviews and approves selected tasks for creation

All changes require explicit human approval before any tasks are created or modified.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Decision       │────▶│  AI Analysis    │────▶│  Task Proposals │
│  (raw text)     │     │  (Ops Worker)   │     │  (review)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │  Created Tasks  │
                                                │  (with audit)   │
                                                └─────────────────┘
```

## API Endpoints

### POST /api/ops/ingest

Store a new decision for processing.

**Request:**
```json
{
  "raw_text": "Meeting notes from team sync...",
  "source": {
    "type": "meeting_notes",
    "label": "Team sync Jan 15",
    "reference_id": "optional-note-id"
  },
  "context_assembly_id": "optional-context-id"
}
```

**Source types:**
- `manual` - Manually entered text
- `meeting_notes` - Notes from a meeting
- `email` - Email content
- `note` - Existing note
- `inbox` - Item from inbox

**Response:**
```json
{
  "decision": {
    "id": "uuid",
    "owner_id": "uuid",
    "raw_text": "...",
    "source": { "type": "meeting_notes", "label": "..." },
    "status": "draft",
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

### GET /api/ops/ingest

List decisions with optional filters.

**Query parameters:**
- `status` - Filter by status (draft, proposed, committed, archived)
- `source_type` - Filter by source type
- `limit` - Maximum results (default 50)

### POST /api/ops/propose

Generate task proposals from a decision using AI.

**Request:**
```json
{
  "decision_id": "uuid",
  "cheap_mode": false,
  "model": "gpt-4o"
}
```

**Response:**
```json
{
  "run": {
    "id": "uuid",
    "decision_id": "uuid",
    "model": "gpt-4o",
    "status": "completed",
    "cost_cents": 12,
    "duration_ms": 3500
  },
  "proposal": {
    "decision_id": "uuid",
    "decision_summary": "Team discussed Q1 priorities...",
    "tasks_to_create": [
      {
        "id": "task-1",
        "title": "Schedule design review meeting",
        "priority": "high",
        "due_date": "2024-01-20",
        "checklist": [
          { "title": "Find available time slot" },
          { "title": "Send calendar invite" }
        ],
        "rationale": "Mentioned as action item for John",
        "confidence": 0.9,
        "source_excerpt": "John to schedule design review by Friday"
      }
    ],
    "tasks_to_update": [],
    "questions": [],
    "reasoning": "Found 3 clear action items...",
    "themes": ["planning", "design"]
  },
  "budget": {
    "used_cents": 45,
    "remaining_cents": 955
  }
}
```

### POST /api/ops/commit

Apply selected task proposals.

**Request:**
```json
{
  "run_id": "uuid",
  "selected_task_ids": ["task-1", "task-3"],
  "selected_update_ids": ["existing-task-id"],
  "overrides": {
    "task-1": {
      "priority": "normal",
      "due_date": "2024-01-25"
    }
  }
}
```

**Response:**
```json
{
  "created_tasks": [
    { "proposal_id": "task-1", "task_id": "uuid", "title": "Schedule design review meeting" }
  ],
  "updated_tasks": [],
  "errors": []
}
```

### GET /api/ops/decisions/[decisionId]

Fetch a single decision with its ops run and proposal.

### DELETE /api/ops/decisions/[decisionId]

Archive or delete a decision.

**Query parameters:**
- `permanent=true` - Hard delete instead of archive

## Data Model

### decisions

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| owner_id | uuid | User who created the decision |
| tenant_id | uuid | Optional tenant |
| raw_text | text | Original content |
| summary | text | AI-generated summary |
| source | jsonb | Source metadata (type, reference_id, label, url) |
| status | text | draft, proposed, committed, archived |
| ops_run_id | uuid | Link to proposal run |
| created_task_ids | uuid[] | Tasks created from this decision |

### ops_runs

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| owner_id | uuid | User who ran the proposal |
| decision_id | uuid | Link to decision |
| model | text | AI model used |
| proposal | jsonb | The OpsProposal JSON |
| status | text | pending, completed, failed, committed |
| cost_cents | integer | AI cost in cents |
| created_task_ids | uuid[] | Tasks created |
| committed_by | uuid | User who approved |
| committed_at | timestamp | When approved |

## Task Tagging

All tasks created by the Ops Worker are tagged for traceability:

- `ops-worker` - All ops worker tasks
- `from-email` - Tasks from email sources
- `from-meeting` - Tasks from meeting notes
- `from-note` - Tasks from notes
- `manual-entry` - Manually entered decisions
- `from-inbox` - Tasks from inbox items

Each task also includes metadata:
- `source_decision_id` - Link back to the original decision
- `rationale` - Why this task was proposed
- `confidence` - AI confidence score (0-1)
- `source_excerpt` - Quote from original content

## Budget Management

The Ops Worker respects the user's AI cost budget:

1. **Budget check** before proposal generation
2. **Block** if budget exceeded and `on_exceed: "block"`
3. **Downgrade model** if `on_exceed: "downgrade_model"`
4. **Warning** displayed when budget is low

## UI Flow

**Canonical UI route**: `/admin/ai/team/ops` (legacy `/admin/ops` permanently redirects)

1. **Intake Form**
   - Select source type
   - Enter/paste content
   - Optional: enable cheap mode

2. **Proposal Review**
   - View extracted tasks with confidence scores
   - Toggle tasks on/off
   - Expand to see source excerpts and checklists
   - View AI questions and warnings

3. **Commit**
   - Create selected tasks
   - View success summary with links

## Service Functions

The `lib/ops/service.ts` module provides:

- `fetchOpsContext()` - Gather goals, projects, tasks for context
- `checkBudget()` - Check AI budget status
- `checkForDuplicates()` - Detect potential duplicate tasks
- `mapProposalToTaskCreate()` - Convert proposal to task payload
- `selectModel()` - Choose model based on budget/preferences
- `createDecisionFromEmail/Meeting/Note()` - Helpers for common sources
- `getOpsStats()` - Get ops worker usage statistics

## Example Use Cases

### Meeting Notes

```typescript
const decision = await createDecisionFromMeeting(
  noteId,
  "Weekly team sync",
  meetingContent
);
await ingest(decision);
```

### Email to Tasks

```typescript
const decision = createDecisionFromEmail(
  emailId,
  "Project kickoff",
  emailBody,
  "client@example.com"
);
await ingest(decision);
```

### Manual Entry

```typescript
const decision = createManualDecision(
  "Need to finish Q1 report, review budget, schedule 1:1s",
  "Quick capture"
);
await ingest(decision);
```

## Best Practices

1. **Be specific** - More context in the input leads to better proposals
2. **Review confidence** - Lower confidence items may need clarification
3. **Check duplicates** - Watch for potential duplicate tasks
4. **Use cheap mode** - For quick, simple extractions
5. **Iterate** - Run propose multiple times if questions need answering
