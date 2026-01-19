# Model Guardrails

> **Priority:** P1 - High  
> **Category:** Safety & Compliance  
> **Status:** Planned

## Overview

Configurable boundaries and constraints on AI model behavior, defining what AI can and cannot do for each use case, preventing misuse and ensuring appropriate responses.

## Problem Statement

AI models without guardrails can:
- Perform actions outside their intended scope
- Respond to inappropriate requests
- Generate outputs violating business rules
- Access information they shouldn't
- Behave inconsistently across contexts

Guardrails provide a safety layer independent of model training.

## User Stories

### As a Product Manager
- I want to define what the AI should and shouldn't do
- I want different guardrails for different use cases
- I want to test guardrails before deployment

### As a Developer
- I want guardrails enforced automatically
- I want clear error messages when guardrails trigger
- I want to understand why requests were blocked

### As a Trust & Safety Lead
- I want to prevent AI misuse patterns
- I want visibility into guardrail activations
- I want to quickly respond to new threat patterns

### As a Compliance Officer
- I want to enforce regulatory constraints
- I want audit trails of constraint enforcement
- I want to demonstrate control over AI behavior

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Model Guardrails                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Request ──▶ [Input Guards] ──▶ AI Model ──▶ [Output Guards] ──▶ Response
│                     │                              │         │
│                     ▼                              ▼         │
│   ┌───────────────────────────────────────────────────────┐ │
│   │                  Guardrail Engine                      │ │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │ │
│   │  │  Topic   │  │  Action  │  │   Data   │            │ │
│   │  │ Filters  │  │  Limits  │  │  Access  │            │ │
│   │  └──────────┘  └──────────┘  └──────────┘            │ │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │ │
│   │  │ Response │  │  Format  │  │ Jailbreak│            │ │
│   │  │ Policies │  │ Enforce  │  │ Detect   │            │ │
│   │  └──────────┘  └──────────┘  └──────────┘            │ │
│   └───────────────────────────────────────────────────────┘ │
│                              │                               │
│                              ▼                               │
│                    [Block / Modify / Log]                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Guardrail Types

| Type | Purpose | Example |
|------|---------|---------|
| Topic Restriction | Block certain topics | No medical advice, no legal advice |
| Action Limits | Restrict AI capabilities | Cannot make purchases, cannot delete data |
| Data Access | Control information access | Only access user's own data |
| Response Policy | Define response behavior | Always include disclaimer, max length |
| Format Enforcement | Ensure output format | JSON only, structured response |
| Jailbreak Detection | Catch manipulation attempts | Detect prompt injection |
| Rate Limits | Prevent abuse | Max requests per user/minute |
| Scope Boundaries | Keep AI focused | Only answer product questions |

### Components

1. **Input Guardrails** - Check requests before AI processing
2. **Output Guardrails** - Check responses before delivery
3. **Rule Engine** - Evaluate guardrail conditions
4. **Action Handler** - Execute block/modify/log actions
5. **Jailbreak Detector** - Identify manipulation attempts
6. **Guardrail Testing** - Validate guardrails work correctly

## Database Schema

```sql
-- Model Guardrails Schema

-- Guardrail sets (collection of rules for a use case)
CREATE TABLE guardrail_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Scope
    application_ids JSONB, -- NULL = all
    model_ids JSONB, -- Specific models, NULL = all
    
    -- Priority for conflict resolution
    priority INTEGER DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual guardrail rules
CREATE TABLE guardrails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guardrail_set_id UUID NOT NULL REFERENCES guardrail_sets(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Rule type
    guardrail_type VARCHAR(50) NOT NULL, -- 'topic', 'action', 'data_access', 'response', 'format', 'jailbreak', 'rate_limit', 'scope'
    
    -- When to apply
    apply_to VARCHAR(20) NOT NULL, -- 'input', 'output', 'both'
    
    -- Rule configuration (varies by type)
    rule_config JSONB NOT NULL,
    -- Topic: {blocked_topics: ['medical_advice'], detection_method: 'classifier'}
    -- Action: {blocked_actions: ['purchase', 'delete'], action_detection: 'function_call'}
    -- Format: {required_format: 'json', schema: {...}}
    -- Rate limit: {max_requests: 10, window_seconds: 60, per: 'user'}
    
    -- Action when triggered
    action VARCHAR(50) NOT NULL, -- 'block', 'modify', 'warn', 'log'
    action_config JSONB,
    -- {message: "I can't help with that.", fallback_response: "..."}
    
    -- Severity
    severity VARCHAR(20) DEFAULT 'medium',
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topic classifier definitions
CREATE TABLE guardrail_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Detection
    detection_method VARCHAR(50) NOT NULL, -- 'keyword', 'classifier', 'embedding'
    
    -- For keyword detection
    keywords JSONB,
    
    -- For classifier
    classifier_model VARCHAR(255),
    classifier_threshold DECIMAL(3,2),
    
    -- For embedding similarity
    embedding_examples JSONB, -- Example texts for similarity matching
    similarity_threshold DECIMAL(3,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jailbreak patterns
CREATE TABLE guardrail_jailbreak_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    name VARCHAR(255) NOT NULL,
    pattern_type VARCHAR(50) NOT NULL, -- 'keyword', 'regex', 'semantic', 'structure'
    
    -- Pattern definition
    pattern TEXT NOT NULL,
    
    -- Severity
    severity VARCHAR(20) DEFAULT 'high',
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guardrail activation logs
CREATE TABLE guardrail_activations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Source
    audit_log_id UUID REFERENCES ai_audit_logs(id),
    guardrail_id UUID REFERENCES guardrails(id),
    guardrail_set_id UUID REFERENCES guardrail_sets(id),
    
    -- Activation details
    guardrail_type VARCHAR(50) NOT NULL,
    apply_phase VARCHAR(20) NOT NULL, -- 'input', 'output'
    
    -- What triggered
    trigger_reason TEXT NOT NULL,
    trigger_details JSONB,
    
    -- Content (redacted if needed)
    triggering_content TEXT,
    
    -- Action taken
    action_taken VARCHAR(50) NOT NULL,
    response_modified BOOLEAN DEFAULT false,
    original_response TEXT,
    modified_response TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guardrail test cases
CREATE TABLE guardrail_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guardrail_id UUID NOT NULL REFERENCES guardrails(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    
    -- Test input
    test_input TEXT NOT NULL,
    test_context JSONB,
    
    -- Expected behavior
    should_trigger BOOLEAN NOT NULL,
    expected_action VARCHAR(50),
    
    -- Last run
    last_run_at TIMESTAMPTZ,
    last_run_passed BOOLEAN,
    last_run_details JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aggregated metrics
CREATE TABLE guardrail_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Scope
    guardrail_set_id UUID REFERENCES guardrail_sets(id),
    guardrail_id UUID REFERENCES guardrails(id),
    
    -- Time bucket
    bucket_timestamp TIMESTAMPTZ NOT NULL,
    bucket_interval VARCHAR(20) NOT NULL,
    
    -- Counts
    total_evaluated INTEGER DEFAULT 0,
    total_triggered INTEGER DEFAULT 0,
    
    -- By action
    blocked_count INTEGER DEFAULT 0,
    modified_count INTEGER DEFAULT 0,
    warned_count INTEGER DEFAULT 0,
    logged_count INTEGER DEFAULT 0,
    
    -- By type
    type_distribution JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_guardrail_sets_tenant ON guardrail_sets(tenant_id);
CREATE INDEX idx_guardrails_set ON guardrails(guardrail_set_id);
CREATE INDEX idx_guardrails_type ON guardrails(guardrail_type);
CREATE INDEX idx_guardrail_topics_tenant ON guardrail_topics(tenant_id);
CREATE INDEX idx_guardrail_activations_tenant ON guardrail_activations(tenant_id, created_at DESC);
CREATE INDEX idx_guardrail_activations_guardrail ON guardrail_activations(guardrail_id);
CREATE INDEX idx_guardrail_activations_type ON guardrail_activations(guardrail_type, created_at DESC);
CREATE INDEX idx_guardrail_metrics_tenant ON guardrail_metrics(tenant_id, bucket_timestamp DESC);
```

## API Endpoints

```
# Guardrail Sets
GET    /api/ai/guardrails/sets            # List guardrail sets
POST   /api/ai/guardrails/sets            # Create set
GET    /api/ai/guardrails/sets/:id        # Get set
PUT    /api/ai/guardrails/sets/:id        # Update set
DELETE /api/ai/guardrails/sets/:id        # Delete set

# Guardrails
GET    /api/ai/guardrails/sets/:id/rules  # List rules in set
POST   /api/ai/guardrails/sets/:id/rules  # Add rule
PUT    /api/ai/guardrails/rules/:id       # Update rule
DELETE /api/ai/guardrails/rules/:id       # Delete rule

# Topics
GET    /api/ai/guardrails/topics          # List topics
POST   /api/ai/guardrails/topics          # Create topic
PUT    /api/ai/guardrails/topics/:id      # Update topic

# Jailbreak Patterns
GET    /api/ai/guardrails/jailbreak       # List patterns
POST   /api/ai/guardrails/jailbreak       # Add pattern

# Testing
POST   /api/ai/guardrails/evaluate        # Test guardrails against input
GET    /api/ai/guardrails/rules/:id/tests # List test cases
POST   /api/ai/guardrails/rules/:id/tests # Add test case
POST   /api/ai/guardrails/rules/:id/run-tests # Run all tests

# Activations
GET    /api/ai/guardrails/activations     # List activations
GET    /api/ai/guardrails/activations/:id # Get activation detail

# Metrics
GET    /api/ai/guardrails/metrics         # Get metrics
GET    /api/ai/guardrails/dashboard       # Dashboard data
```

## UI Components

### Admin Dashboard Pages

1. **Guardrails Overview** (`/admin/ai/guardrails`)
   - Active guardrail sets
   - Activation summary
   - Trend charts
   - Quick actions

2. **Guardrail Set Editor** (`/admin/ai/guardrails/sets/:id`)
   - Rules list
   - Add/edit rules
   - Scope configuration
   - Enable/disable

3. **Rule Builder** (`/admin/ai/guardrails/rules/new`)
   - Type selection
   - Configuration wizard
   - Action setup
   - Test panel

4. **Topic Manager** (`/admin/ai/guardrails/topics`)
   - Topic list
   - Detection configuration
   - Keyword/example management

5. **Jailbreak Patterns** (`/admin/ai/guardrails/jailbreak`)
   - Pattern list
   - Add new patterns
   - Test interface

6. **Testing Center** (`/admin/ai/guardrails/test`)
   - Interactive testing
   - Batch testing
   - Test case management
   - Results analysis

7. **Activation Log** (`/admin/ai/guardrails/activations`)
   - Recent activations
   - Filter by type/action
   - Detail view
   - Export

## Dependencies

- **Existing:** AI Audit Logs
- **Related:** Content Moderation, HITL Workflows
- **External:**
  - Topic classifier model (optional)
  - Embedding model for semantic matching

## Security Considerations

- Guardrail config changes require approval
- Audit log all changes
- Protect guardrail bypass attempts
- Rate limit guardrail evaluation
- Secure storage of patterns

## Success Metrics

| Metric | Target |
|--------|--------|
| Guardrail coverage | 100% of production AI |
| Block accuracy (true positives) | > 95% |
| False positive rate | < 5% |
| Evaluation latency | < 50ms p95 |

## Implementation Notes

### Phase 1: Core Guards
- Topic blocking (keyword)
- Basic jailbreak detection
- Response policies
- Activation logging

### Phase 2: Advanced Detection
- ML-based topic classification
- Sophisticated jailbreak detection
- Action/tool restrictions
- Format enforcement

### Phase 3: Testing & Refinement
- Test case framework
- A/B testing guardrails
- False positive analysis
- Rule recommendations

### Phase 4: Intelligence
- Automatic pattern learning
- Threat intelligence integration
- Cross-tenant patterns (anonymized)
