# Content Moderation Pipeline

> **Priority:** P0 - Critical  
> **Category:** Safety & Compliance  
> **Status:** Planned

## Overview

Pre and post-processing filters for AI inputs and outputs, detecting and handling harmful, toxic, illegal, or off-brand content before it impacts users.

## Problem Statement

AI systems can generate or be prompted to generate:
- Hate speech and discriminatory content
- Violence, self-harm, or dangerous instructions
- Sexually explicit material
- Misinformation and harmful advice
- Brand-damaging or off-policy content

Without moderation, organizations expose themselves to legal liability, reputational damage, and user harm.

## User Stories

### As a Trust & Safety Lead
- I want to block harmful content before users see it
- I want to customize moderation rules for our use case
- I want visibility into what content is being flagged

### As a Developer
- I want moderation built into the AI pipeline
- I want to test my application against moderation rules
- I want clear feedback when content is blocked

### As a Compliance Officer
- I want audit trails of all moderation decisions
- I want to demonstrate content safety to regulators
- I want configurable policies for different jurisdictions

### As a Product Manager
- I want to balance safety with user experience
- I want to understand false positive rates
- I want to handle edge cases appropriately

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Content Moderation Pipeline                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Input ──▶ [Pre-Filter] ──▶ AI Model ──▶ [Post-Filter] ──▶ Output
│                  │                              │            │
│                  ▼                              ▼            │
│             ┌─────────────────────────────────────┐         │
│             │         Moderation Engine           │         │
│             │  ┌─────────┐  ┌─────────┐         │         │
│             │  │ Toxicity│  │  Custom │         │         │
│             │  │  Model  │  │  Rules  │         │         │
│             │  └─────────┘  └─────────┘         │         │
│             │  ┌─────────┐  ┌─────────┐         │         │
│             │  │ Provider│  │Keyword  │         │         │
│             │  │   API   │  │ Filter  │         │         │
│             │  └─────────┘  └─────────┘         │         │
│             └─────────────────────────────────────┘         │
│                              │                               │
│                              ▼                               │
│                    [Action Handler]                         │
│                    Block / Warn / Log / Escalate            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Moderation Categories

| Category | Description | Default Action |
|----------|-------------|----------------|
| Hate Speech | Discriminatory content against protected groups | Block |
| Violence | Content promoting or glorifying violence | Block |
| Self-Harm | Suicide, self-injury content | Block + Escalate |
| Sexual Content | Explicit sexual material | Block |
| Harassment | Personal attacks, bullying | Block |
| Dangerous Content | Illegal activities, weapons, drugs | Block |
| Misinformation | Health, safety misinformation | Warn |
| Off-Brand | Competitor mentions, off-policy content | Warn/Log |
| PII | Personal identifiable information | Redact |

### Components

1. **Pre-Filter** - Moderate inputs before AI processing
2. **Post-Filter** - Moderate AI outputs before delivery
3. **Moderation Engine** - Core detection logic
4. **Rule Engine** - Custom business rules
5. **Action Handler** - Execute moderation decisions
6. **Appeals System** - Handle false positives

## Database Schema

```sql
-- Content Moderation Schema

-- Moderation policies
CREATE TABLE moderation_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Scope
    is_default BOOLEAN DEFAULT false,
    application_ids JSONB, -- NULL = all applications
    
    -- Category thresholds
    category_thresholds JSONB NOT NULL, 
    -- {
    --   "hate": {"threshold": 0.7, "action": "block"},
    --   "violence": {"threshold": 0.8, "action": "block"},
    --   ...
    -- }
    
    -- Custom rules
    custom_rules_enabled BOOLEAN DEFAULT false,
    
    -- Behavior
    pre_filter_enabled BOOLEAN DEFAULT true,
    post_filter_enabled BOOLEAN DEFAULT true,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom keyword/pattern rules
CREATE TABLE moderation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES moderation_policies(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- 'keyword', 'regex', 'semantic'
    
    -- Rule definition
    pattern TEXT NOT NULL, -- Keyword, regex, or semantic description
    case_sensitive BOOLEAN DEFAULT false,
    
    -- Categorization
    category VARCHAR(100),
    severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    
    -- Action
    action VARCHAR(50) NOT NULL, -- 'block', 'warn', 'log', 'redact', 'escalate'
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allowlist/blocklist
CREATE TABLE moderation_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(255) NOT NULL,
    list_type VARCHAR(20) NOT NULL, -- 'allowlist', 'blocklist'
    
    entries JSONB NOT NULL, -- Array of strings/patterns
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moderation results
CREATE TABLE moderation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Source
    audit_log_id UUID REFERENCES ai_audit_logs(id),
    policy_id UUID REFERENCES moderation_policies(id),
    
    -- What was moderated
    content_type VARCHAR(20) NOT NULL, -- 'input', 'output'
    content_hash VARCHAR(64), -- For deduplication
    
    -- Results
    flagged BOOLEAN NOT NULL,
    action_taken VARCHAR(50), -- 'none', 'blocked', 'warned', 'redacted', 'escalated'
    
    -- Category scores
    category_scores JSONB NOT NULL,
    -- {
    --   "hate": 0.12,
    --   "violence": 0.05,
    --   ...
    -- }
    
    -- Triggered rules
    triggered_categories JSONB DEFAULT '[]', -- ['hate', 'violence']
    triggered_rules JSONB DEFAULT '[]', -- [{rule_id, matched_text}]
    
    -- Detection source
    detection_source VARCHAR(50), -- 'model', 'keyword', 'regex', 'provider'
    model_version VARCHAR(100),
    
    -- Performance
    latency_ms INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Escalated content for human review
CREATE TABLE moderation_escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    result_id UUID NOT NULL REFERENCES moderation_results(id),
    
    -- Escalation reason
    reason VARCHAR(255) NOT NULL,
    priority VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'urgent'
    
    -- Content (stored for review)
    content_text TEXT NOT NULL,
    context JSONB,
    
    -- Review
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewing', 'resolved'
    assigned_to UUID REFERENCES users(id),
    
    reviewed_at TIMESTAMPTZ,
    decision VARCHAR(50), -- 'upheld', 'overturned', 'modified'
    reviewer_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appeals from users
CREATE TABLE moderation_appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    result_id UUID NOT NULL REFERENCES moderation_results(id),
    
    -- Appellant
    appellant_user_id VARCHAR(255),
    appeal_reason TEXT NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewing', 'approved', 'denied'
    
    -- Review
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    decision_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aggregated metrics
CREATE TABLE moderation_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Scope
    policy_id UUID REFERENCES moderation_policies(id),
    application_id VARCHAR(255),
    
    -- Time bucket
    bucket_timestamp TIMESTAMPTZ NOT NULL,
    bucket_interval VARCHAR(20) NOT NULL,
    
    -- Counts
    total_moderated INTEGER NOT NULL,
    total_flagged INTEGER NOT NULL,
    total_blocked INTEGER NOT NULL,
    
    -- By category
    category_counts JSONB, -- {category: count}
    
    -- By action
    action_counts JSONB, -- {action: count}
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_moderation_policies_tenant ON moderation_policies(tenant_id);
CREATE INDEX idx_moderation_results_tenant ON moderation_results(tenant_id, created_at DESC);
CREATE INDEX idx_moderation_results_audit ON moderation_results(audit_log_id);
CREATE INDEX idx_moderation_results_flagged ON moderation_results(tenant_id, created_at DESC) WHERE flagged = true;
CREATE INDEX idx_moderation_escalations_status ON moderation_escalations(status) WHERE status IN ('pending', 'reviewing');
CREATE INDEX idx_moderation_appeals_status ON moderation_appeals(status) WHERE status = 'pending';
CREATE INDEX idx_moderation_metrics_tenant ON moderation_metrics(tenant_id, bucket_timestamp DESC);
```

## API Endpoints

```
# Policies
GET    /api/ai/moderation/policies        # List policies
POST   /api/ai/moderation/policies        # Create policy
GET    /api/ai/moderation/policies/:id    # Get policy
PUT    /api/ai/moderation/policies/:id    # Update policy

# Rules
GET    /api/ai/moderation/policies/:id/rules    # List rules
POST   /api/ai/moderation/policies/:id/rules    # Add rule
PUT    /api/ai/moderation/rules/:id             # Update rule
DELETE /api/ai/moderation/rules/:id             # Delete rule

# Lists
GET    /api/ai/moderation/lists           # Get lists
POST   /api/ai/moderation/lists           # Create list
PUT    /api/ai/moderation/lists/:id       # Update list

# Moderation (real-time)
POST   /api/ai/moderation/check           # Check content
POST   /api/ai/moderation/batch           # Batch check

# Results
GET    /api/ai/moderation/results         # List results
GET    /api/ai/moderation/results/:id     # Get result detail

# Escalations
GET    /api/ai/moderation/escalations     # List escalations
PUT    /api/ai/moderation/escalations/:id # Resolve escalation

# Appeals
GET    /api/ai/moderation/appeals         # List appeals
PUT    /api/ai/moderation/appeals/:id     # Process appeal

# Metrics
GET    /api/ai/moderation/metrics         # Get metrics
GET    /api/ai/moderation/dashboard       # Dashboard data
```

## UI Components

### Admin Dashboard Pages

1. **Moderation Dashboard** (`/admin/ai/moderation`)
   - Real-time moderation activity
   - Flagging rate trends
   - Category breakdown
   - Pending escalations count

2. **Policy Management** (`/admin/ai/moderation/policies`)
   - Policy list
   - Threshold configuration
   - Category enable/disable
   - Rule builder

3. **Review Queue** (`/admin/ai/moderation/queue`)
   - Escalated content
   - Quick review interface
   - Bulk actions
   - Assignment management

4. **Appeals** (`/admin/ai/moderation/appeals`)
   - Pending appeals
   - Appeal review interface
   - Decision history

5. **Analytics** (`/admin/ai/moderation/analytics`)
   - Volume trends
   - Category distribution
   - False positive analysis
   - Rule effectiveness

## Dependencies

- **Existing:** AI Audit Logs
- **Related:** PII Detection, HITL Workflows
- **External:**
  - Moderation model (Perspective API, OpenAI moderation, custom)
  - Optional: Provider moderation APIs

## Security Considerations

- Moderation content stored securely
- Access restricted to Trust & Safety team
- Audit log for moderation decisions
- Handle CSAM with special protocols
- Rate limiting to prevent abuse

## Success Metrics

| Metric | Target |
|--------|--------|
| Harmful content blocked | > 99% |
| False positive rate | < 5% |
| Moderation latency | < 200ms p95 |
| Escalation resolution time | < 4 hours |

## Implementation Notes

### Phase 1: Core Moderation
- Category-based detection using provider APIs
- Basic blocking/logging
- Results dashboard

### Phase 2: Custom Rules
- Keyword/regex rules
- Custom allowlists/blocklists
- Threshold tuning

### Phase 3: Human Review
- Escalation system
- Appeals handling
- Quality assurance sampling

### Phase 4: Advanced
- Custom model training
- Semantic rules
- Proactive detection
