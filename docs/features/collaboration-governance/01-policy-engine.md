# Policy Engine

> **Priority:** P0 - Critical  
> **Category:** Collaboration & Governance  
> **Status:** Planned

## Overview

A rule engine for defining and enforcing organization-wide AI usage policies, controlling who can use what AI capabilities, when, and under what conditions.

## Problem Statement

Organizations lack control over AI usage:
- No way to restrict AI access by role or context
- Inconsistent policy enforcement across applications
- Shadow AI usage outside governed channels
- Difficulty implementing regulatory requirements
- No audit trail for policy decisions

## User Stories

### As a Governance Officer
- I want to define AI usage policies
- I want policies enforced automatically
- I want to see policy compliance

### As a CISO
- I want to control AI data exposure
- I want to restrict high-risk AI uses
- I want security policies enforced

### As an Admin
- I want to grant/revoke AI access
- I want role-based AI permissions
- I want to manage exceptions

### As a Developer
- I want to understand what I can/cannot do
- I want clear feedback on policy violations
- I want to request policy exceptions

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Policy Engine                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │                Policy Types                           │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │ Access  │  │ Usage   │  │  Data   │              │   │
│  │  │ Control │  │ Limits  │  │ Policies│              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │ Time    │  │ Content │  │Approval │              │   │
│  │  │ Based   │  │ Rules   │  │ Required│              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Policy    │  │  Decision   │  │   Audit     │         │
│  │   Store     │  │   Engine    │  │   Logger    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Policy Types

| Type | Description | Example |
|------|-------------|---------|
| Access Control | Who can use AI | Engineering team only |
| Model Restrictions | Which models allowed | No GPT-4 for interns |
| Data Policies | What data can be sent | No PII to external AI |
| Usage Limits | Quotas and caps | 10k tokens/day |
| Time Restrictions | When AI can be used | Business hours only |
| Content Rules | What topics allowed | No legal advice |
| Approval Required | Human approval needed | Large purchases |

### Policy Language

```yaml
# Example policy definition
policy:
  name: "Engineering AI Access"
  description: "AI access policy for engineering team"
  
  subjects:
    - type: role
      value: engineer
    - type: team
      value: engineering
  
  resources:
    - type: model
      value: ["gpt-4", "gpt-3.5-turbo", "claude-3"]
    - type: application
      value: ["code-assistant", "doc-generator"]
  
  conditions:
    - type: time
      business_hours: true
      timezone: America/Los_Angeles
    - type: data
      no_pii: true
    - type: topic
      blocked: ["legal-advice", "medical-advice"]
  
  effect: allow
  
  limits:
    tokens_per_day: 100000
    requests_per_hour: 100
```

## Database Schema

```sql
-- Policy Engine Schema

-- Policies
CREATE TABLE policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Policy definition
    policy_type VARCHAR(50) NOT NULL, -- 'access', 'usage', 'data', 'content', 'approval'
    
    -- Effect
    effect VARCHAR(20) NOT NULL, -- 'allow', 'deny'
    
    -- Priority (higher = evaluated first)
    priority INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Validity
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Policy subjects (who the policy applies to)
CREATE TABLE policy_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    
    subject_type VARCHAR(50) NOT NULL, -- 'user', 'role', 'team', 'group', 'all'
    subject_value VARCHAR(255), -- NULL for 'all'
    
    include BOOLEAN DEFAULT true, -- false = exclude
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policy resources (what the policy applies to)
CREATE TABLE policy_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    
    resource_type VARCHAR(50) NOT NULL, -- 'model', 'application', 'prompt', 'feature', 'all'
    resource_values JSONB, -- ['gpt-4', 'claude-3'] or NULL for 'all'
    
    include BOOLEAN DEFAULT true, -- false = exclude
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policy conditions
CREATE TABLE policy_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    
    condition_type VARCHAR(50) NOT NULL,
    -- 'time', 'location', 'data', 'topic', 'rate', 'approval', 'custom'
    
    condition_config JSONB NOT NULL,
    -- Time: {business_hours: true, days: ['mon', 'tue', ...], timezone: '...'}
    -- Location: {allowed_countries: ['US', 'CA'], denied_ips: [...]}
    -- Data: {no_pii: true, allowed_classifications: ['public', 'internal']}
    -- Topic: {blocked_topics: [...], allowed_topics: [...]}
    -- Rate: {max_tokens: 10000, period: 'day'}
    -- Approval: {required_for: ['high_value'], approvers: [...]}
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policy actions (what happens when policy applies)
CREATE TABLE policy_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    
    action_type VARCHAR(50) NOT NULL, -- 'block', 'allow', 'log', 'notify', 'require_approval'
    
    action_config JSONB,
    -- {message: "Access denied", notification_channel: 'slack'}
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policy decisions (audit log)
CREATE TABLE policy_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Request context
    request_id VARCHAR(64),
    audit_log_id UUID REFERENCES ai_audit_logs(id),
    
    -- Subject
    user_id UUID,
    user_roles JSONB,
    user_teams JSONB,
    
    -- Resource
    model_requested VARCHAR(255),
    application_id VARCHAR(255),
    
    -- Decision
    decision VARCHAR(20) NOT NULL, -- 'allow', 'deny'
    
    -- Which policies applied
    policies_evaluated JSONB NOT NULL, -- [{policy_id, matched, effect}]
    deciding_policy_id UUID REFERENCES policies(id),
    
    -- Reason
    decision_reason TEXT,
    
    -- Conditions that triggered
    triggered_conditions JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approval requests
CREATE TABLE policy_approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Requestor
    requested_by UUID NOT NULL REFERENCES users(id),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- What needs approval
    request_type VARCHAR(50) NOT NULL, -- 'access', 'exception', 'resource'
    request_details JSONB NOT NULL,
    justification TEXT,
    
    -- Related policy
    policy_id UUID REFERENCES policies(id),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'denied', 'expired'
    
    -- Approval
    approvers_required INTEGER DEFAULT 1,
    approvals_received INTEGER DEFAULT 0,
    
    expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approval decisions
CREATE TABLE policy_approval_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES policy_approval_requests(id) ON DELETE CASCADE,
    
    approver_id UUID NOT NULL REFERENCES users(id),
    decision VARCHAR(20) NOT NULL, -- 'approve', 'deny'
    
    comments TEXT,
    
    decided_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policy exceptions (temporary overrides)
CREATE TABLE policy_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES policies(id),
    
    -- Scope
    subject_type VARCHAR(50) NOT NULL,
    subject_value VARCHAR(255),
    
    -- Exception details
    reason TEXT NOT NULL,
    
    -- Validity
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ NOT NULL,
    
    -- Approval
    approved_by UUID REFERENCES users(id),
    approval_request_id UUID REFERENCES policy_approval_requests(id),
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_policies_tenant ON policies(tenant_id);
CREATE INDEX idx_policies_active ON policies(tenant_id, is_active, priority DESC);
CREATE INDEX idx_policy_subjects_policy ON policy_subjects(policy_id);
CREATE INDEX idx_policy_resources_policy ON policy_resources(policy_id);
CREATE INDEX idx_policy_conditions_policy ON policy_conditions(policy_id);
CREATE INDEX idx_policy_decisions_tenant ON policy_decisions(tenant_id, created_at DESC);
CREATE INDEX idx_policy_decisions_user ON policy_decisions(user_id, created_at DESC);
CREATE INDEX idx_policy_approval_requests_tenant ON policy_approval_requests(tenant_id);
CREATE INDEX idx_policy_approval_requests_status ON policy_approval_requests(status) WHERE status = 'pending';
CREATE INDEX idx_policy_exceptions_policy ON policy_exceptions(policy_id);
CREATE INDEX idx_policy_exceptions_active ON policy_exceptions(policy_id, valid_until) WHERE is_active = true;
```

## API Endpoints

```
# Policies
GET    /api/policies                      # List policies
POST   /api/policies                      # Create policy
GET    /api/policies/:id                  # Get policy
PUT    /api/policies/:id                  # Update policy
DELETE /api/policies/:id                  # Delete policy

# Policy evaluation
POST   /api/policies/evaluate             # Check if request is allowed
GET    /api/policies/effective            # Get effective policies for user

# Approvals
GET    /api/policies/approvals            # List approval requests
POST   /api/policies/approvals            # Request approval
PUT    /api/policies/approvals/:id        # Approve/deny request
GET    /api/policies/approvals/pending    # My pending approvals

# Exceptions
GET    /api/policies/exceptions           # List exceptions
POST   /api/policies/exceptions           # Create exception
DELETE /api/policies/exceptions/:id       # Revoke exception

# Decisions
GET    /api/policies/decisions            # List decisions (audit)

# Dashboard
GET    /api/policies/dashboard            # Dashboard data
GET    /api/policies/compliance           # Compliance report
```

## UI Components

### Admin Dashboard Pages

1. **Policy Overview** (`/admin/policies`)
   - Active policies
   - Recent decisions
   - Compliance summary
   - Quick actions

2. **Policy Editor** (`/admin/policies/:id`)
   - Policy builder
   - Subject configuration
   - Resource configuration
   - Condition builder
   - Action configuration
   - Testing interface

3. **Policy Library** (`/admin/policies/library`)
   - Pre-built policy templates
   - Import/export policies
   - Policy versioning

4. **Approvals** (`/admin/policies/approvals`)
   - Pending approvals
   - Approval queue
   - Approval history

5. **Exceptions** (`/admin/policies/exceptions`)
   - Active exceptions
   - Create exception
   - Expiry management

6. **Audit Log** (`/admin/policies/audit`)
   - Decision history
   - Filter by user/policy
   - Export capabilities

7. **Compliance Dashboard** (`/admin/policies/compliance`)
   - Policy coverage
   - Violation trends
   - Risk assessment

## Dependencies

- **Existing:** Authentication, Tenant system
- **Related:** All AI features (policies apply to them)
- **External:** None

## Security Considerations

- Policy changes require admin role
- Audit log immutable
- Approval workflow for exceptions
- Policy encryption at rest
- Prevent policy bypass

## Success Metrics

| Metric | Target |
|--------|--------|
| Policy coverage | 100% of AI access |
| Decision latency | < 10ms |
| Compliance rate | > 99% |
| Exception rate | < 5% |

## Implementation Notes

### Phase 1: Basic Policies
- Access control policies
- Simple conditions
- Allow/deny decisions

### Phase 2: Advanced Conditions
- Time-based policies
- Data classification
- Rate limiting

### Phase 3: Workflows
- Approval workflows
- Exceptions
- Notifications

### Phase 4: Intelligence
- Policy recommendations
- Anomaly detection
- Auto-remediation
