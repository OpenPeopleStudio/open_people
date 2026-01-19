# Human-in-the-Loop (HITL) Workflows

> **Priority:** P0 - Critical  
> **Category:** Safety & Compliance  
> **Status:** Planned

## Overview

Escalation queues and review workflows for AI edge cases requiring human judgment, ensuring critical decisions have appropriate human oversight.

## Problem Statement

AI systems encounter situations they shouldn't handle autonomously:
- Low confidence predictions
- High-stakes decisions (healthcare, finance, legal)
- Content moderation edge cases
- Potential safety violations
- Customer escalations

Without HITL workflows, these cases either get wrong automated decisions or create bottlenecks.

## User Stories

### As a Human Reviewer
- I want a clear queue of items needing my review
- I want sufficient context to make informed decisions
- I want efficient tools for high-volume review

### As an Operations Manager
- I want to monitor review queue health
- I want to distribute workload fairly
- I want SLA tracking and alerts

### As a Product Manager
- I want to configure when cases escalate to humans
- I want to understand what types of cases need review
- I want to reduce human review needs over time

### As a Compliance Officer
- I want audit trails of human review decisions
- I want to demonstrate human oversight for regulations
- I want quality assurance for reviewer decisions

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    HITL Workflow System                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  AI Decision ──▶ [Escalation Rules] ──▶ Human Queue         │
│                         │                    │               │
│                         ▼                    ▼               │
│                  Auto-Approve         ┌──────────────┐      │
│                                       │   Reviewer   │      │
│                                       │   Workbench  │      │
│                                       └──────────────┘      │
│                                              │               │
│                                              ▼               │
│                                       [Decision + Feedback]  │
│                                              │               │
│                                              ▼               │
│                                       Learning Loop          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Escalation Triggers

| Trigger Type | Example | Priority |
|--------------|---------|----------|
| Low Confidence | Model confidence < 0.7 | Medium |
| High Stakes | Financial transaction > $10k | High |
| Safety Flag | Content moderation triggered | High |
| Policy Match | Regex pattern matched | Varies |
| User Request | Customer asks for human | Medium |
| Random Sample | QA sampling 5% of decisions | Low |
| Model Disagreement | Multiple models disagree | Medium |

### Components

1. **Escalation Engine** - Rules for what gets escalated
2. **Queue Manager** - Priority queuing and assignment
3. **Reviewer Workbench** - UI for human review
4. **Decision Capture** - Record review decisions
5. **Feedback Loop** - Use decisions to improve AI
6. **SLA Monitor** - Track review timeliness

## Database Schema

```sql
-- HITL Workflows Schema

-- Escalation policies
CREATE TABLE hitl_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Scope
    application_ids JSONB, -- NULL = all
    
    -- Trigger configuration
    triggers JSONB NOT NULL,
    -- [
    --   {type: 'confidence', threshold: 0.7, priority: 'medium'},
    --   {type: 'content_flag', categories: ['violence'], priority: 'high'},
    --   {type: 'amount', field: 'transaction_amount', threshold: 10000, priority: 'high'},
    --   {type: 'random_sample', percentage: 5, priority: 'low'}
    -- ]
    
    -- Behavior
    queue_id UUID REFERENCES hitl_queues(id),
    auto_assign BOOLEAN DEFAULT false,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review queues
CREATE TABLE hitl_queues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- SLA configuration
    sla_minutes INTEGER, -- Target response time
    warning_threshold_minutes INTEGER, -- When to warn
    
    -- Assignment
    assignment_strategy VARCHAR(50) DEFAULT 'round_robin', -- 'round_robin', 'load_balanced', 'skill_based', 'manual'
    
    -- Reviewers
    reviewer_user_ids JSONB DEFAULT '[]',
    reviewer_team_id UUID,
    
    -- Settings
    max_concurrent_per_reviewer INTEGER DEFAULT 10,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Escalated items
CREATE TABLE hitl_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    policy_id UUID REFERENCES hitl_policies(id),
    queue_id UUID NOT NULL REFERENCES hitl_queues(id),
    
    -- Source
    audit_log_id UUID REFERENCES ai_audit_logs(id),
    source_type VARCHAR(50) NOT NULL, -- 'ai_response', 'moderation', 'classification', etc.
    source_id VARCHAR(255), -- External reference
    
    -- Escalation reason
    trigger_type VARCHAR(50) NOT NULL,
    trigger_details JSONB,
    
    -- Priority
    priority VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    
    -- Content for review (denormalized for reviewer access)
    review_content JSONB NOT NULL,
    -- {
    --   input: "user query",
    --   output: "ai response",
    --   context: {...},
    --   ai_decision: "approve",
    --   confidence: 0.65
    -- }
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'assigned', 'in_review', 'completed', 'expired'
    
    -- Assignment
    assigned_to UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ,
    
    -- SLA tracking
    due_at TIMESTAMPTZ,
    sla_breached BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review decisions
CREATE TABLE hitl_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES hitl_items(id) ON DELETE CASCADE,
    
    -- Reviewer
    reviewer_id UUID NOT NULL REFERENCES users(id),
    
    -- Decision
    decision VARCHAR(50) NOT NULL, -- 'approve', 'reject', 'modify', 'escalate_further'
    
    -- For modifications
    modified_output TEXT,
    
    -- Reasoning
    decision_reason TEXT,
    decision_tags JSONB DEFAULT '[]', -- ['low_quality', 'incorrect_info', ...]
    
    -- Confidence in AI
    ai_was_correct BOOLEAN, -- For feedback loop
    
    -- Timing
    review_started_at TIMESTAMPTZ,
    review_completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    review_duration_seconds INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Decision options (configurable per queue)
CREATE TABLE hitl_decision_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID NOT NULL REFERENCES hitl_queues(id) ON DELETE CASCADE,
    
    decision_value VARCHAR(50) NOT NULL,
    display_label VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- UI hints
    keyboard_shortcut VARCHAR(10),
    color VARCHAR(20),
    
    -- Behavior
    requires_reason BOOLEAN DEFAULT false,
    requires_modification BOOLEAN DEFAULT false,
    
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviewer performance metrics
CREATE TABLE hitl_reviewer_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    reviewer_id UUID NOT NULL REFERENCES users(id),
    
    -- Time bucket
    bucket_timestamp TIMESTAMPTZ NOT NULL,
    bucket_interval VARCHAR(20) NOT NULL, -- 'day', 'week', 'month'
    
    -- Volume
    items_reviewed INTEGER DEFAULT 0,
    
    -- Speed
    avg_review_seconds INTEGER,
    median_review_seconds INTEGER,
    
    -- Quality (from QA sampling)
    qa_sampled INTEGER DEFAULT 0,
    qa_correct INTEGER DEFAULT 0,
    
    -- Decisions breakdown
    decision_distribution JSONB, -- {approve: 50, reject: 30, modify: 20}
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- QA reviews of reviewer decisions
CREATE TABLE hitl_qa_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID NOT NULL REFERENCES hitl_decisions(id),
    
    qa_reviewer_id UUID NOT NULL REFERENCES users(id),
    
    -- Assessment
    was_correct BOOLEAN NOT NULL,
    feedback TEXT,
    
    -- If incorrect
    correct_decision VARCHAR(50),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Queue metrics (aggregated)
CREATE TABLE hitl_queue_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID NOT NULL REFERENCES hitl_queues(id),
    
    -- Time bucket
    bucket_timestamp TIMESTAMPTZ NOT NULL,
    bucket_interval VARCHAR(20) NOT NULL,
    
    -- Volume
    items_created INTEGER DEFAULT 0,
    items_completed INTEGER DEFAULT 0,
    
    -- Queue health
    avg_queue_depth INTEGER,
    max_queue_depth INTEGER,
    
    -- SLA
    sla_met_count INTEGER DEFAULT 0,
    sla_breached_count INTEGER DEFAULT 0,
    
    -- Timing
    avg_wait_seconds INTEGER,
    avg_review_seconds INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_hitl_policies_tenant ON hitl_policies(tenant_id);
CREATE INDEX idx_hitl_queues_tenant ON hitl_queues(tenant_id);
CREATE INDEX idx_hitl_items_queue ON hitl_items(queue_id, status, priority DESC);
CREATE INDEX idx_hitl_items_assigned ON hitl_items(assigned_to, status);
CREATE INDEX idx_hitl_items_status ON hitl_items(status) WHERE status IN ('pending', 'assigned', 'in_review');
CREATE INDEX idx_hitl_items_sla ON hitl_items(due_at) WHERE status IN ('pending', 'assigned', 'in_review');
CREATE INDEX idx_hitl_decisions_item ON hitl_decisions(item_id);
CREATE INDEX idx_hitl_decisions_reviewer ON hitl_decisions(reviewer_id, created_at DESC);
CREATE INDEX idx_hitl_reviewer_metrics ON hitl_reviewer_metrics(reviewer_id, bucket_timestamp DESC);
CREATE INDEX idx_hitl_queue_metrics ON hitl_queue_metrics(queue_id, bucket_timestamp DESC);
```

## API Endpoints

```
# Policies
GET    /api/hitl/policies                 # List policies
POST   /api/hitl/policies                 # Create policy
PUT    /api/hitl/policies/:id             # Update policy
DELETE /api/hitl/policies/:id             # Delete policy

# Queues
GET    /api/hitl/queues                   # List queues
POST   /api/hitl/queues                   # Create queue
PUT    /api/hitl/queues/:id               # Update queue
GET    /api/hitl/queues/:id/stats         # Queue statistics

# Items (for reviewers)
GET    /api/hitl/items                    # List items (filtered)
GET    /api/hitl/items/next               # Get next item to review
GET    /api/hitl/items/:id                # Get item detail
POST   /api/hitl/items/:id/claim          # Claim item for review
POST   /api/hitl/items/:id/release        # Release claimed item
POST   /api/hitl/items/:id/decision       # Submit decision

# Escalation (for AI systems)
POST   /api/hitl/escalate                 # Escalate item for review

# Analytics
GET    /api/hitl/metrics/queues           # Queue metrics
GET    /api/hitl/metrics/reviewers        # Reviewer metrics
GET    /api/hitl/metrics/trends           # Trend analysis

# QA
GET    /api/hitl/qa/sample                # Get items for QA
POST   /api/hitl/qa/review                # Submit QA review
```

## UI Components

### Reviewer Workbench

1. **Review Queue** (`/review`)
   - Priority-sorted item list
   - Quick claim action
   - Queue health indicators
   - Filter by queue/priority

2. **Review Interface** (`/review/:id`)
   - Full item context
   - AI decision and confidence
   - Decision buttons (keyboard shortcuts)
   - Reason/notes field
   - Timer display

3. **My Reviews** (`/review/history`)
   - Completed reviews
   - Performance stats
   - QA feedback

### Admin Dashboard

4. **Queue Management** (`/admin/hitl/queues`)
   - Queue list and health
   - Reviewer assignment
   - SLA configuration
   - Decision options

5. **Policy Configuration** (`/admin/hitl/policies`)
   - Escalation rules
   - Trigger configuration
   - Testing interface

6. **Analytics** (`/admin/hitl/analytics`)
   - Volume trends
   - SLA performance
   - Reviewer leaderboard
   - Decision distribution

7. **QA Dashboard** (`/admin/hitl/qa`)
   - QA queue
   - Reviewer accuracy
   - Calibration reports

## Dependencies

- **Existing:** AI Audit Logs, Content Moderation
- **Related:** All AI features can escalate
- **External:** Optional notification service (Slack, email)

## Security Considerations

- Reviewers only see assigned items
- Sensitive data handling in review content
- Audit trail for all decisions
- Role-based queue access
- PII redaction options

## Success Metrics

| Metric | Target |
|--------|--------|
| SLA compliance | > 95% |
| Review quality (QA) | > 95% accuracy |
| Avg review time | < 2 minutes |
| Queue depth | < 100 items |

## Implementation Notes

### Phase 1: Core Workflow
- Basic escalation triggers
- Simple queue management
- Review interface
- Decision capture

### Phase 2: Intelligence
- Smart assignment
- Priority optimization
- SLA management
- Performance tracking

### Phase 3: Learning Loop
- Decision feedback to AI
- Pattern detection
- Rule suggestions
- Automation candidates

### Phase 4: Scale
- High-volume optimizations
- Bulk review tools
- Advanced QA
- Cross-training
