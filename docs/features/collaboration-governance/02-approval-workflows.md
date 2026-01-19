# Approval Workflows

> **Priority:** P1 - High  
> **Category:** Collaboration & Governance  
> **Status:** Planned

## Overview

Configurable approval processes for AI-related changes including prompts, models, guardrails, and policies, ensuring proper review before production deployment.

## Problem Statement

AI changes without review create risk:
- Prompts deployed without quality review
- Model changes without impact assessment
- Configuration changes without approval
- No audit trail for who approved what
- Inconsistent approval processes across teams

## User Stories

### As a Team Lead
- I want to approve prompt changes before production
- I want to see what's pending my approval
- I want to delegate approval authority

### As a Developer
- I want to submit changes for review
- I want to track approval status
- I want feedback on rejected changes

### As a Compliance Officer
- I want approval trails for audit
- I want to enforce approval requirements
- I want approval SLAs

### As an Admin
- I want to configure approval workflows
- I want to define who can approve what
- I want to handle approval exceptions

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Approval Workflows                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │                Workflow Types                         │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │ Single  │  │ Multi-  │  │ Sequen- │              │   │
│  │  │Approver │  │  Level  │  │  tial   │              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │Parallel │  │ Condi-  │  │  Auto-  │              │   │
│  │  │         │  │ tional  │  │ Approve │              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Workflow   │  │   Request   │  │  Notifica-  │         │
│  │   Engine    │  │   Tracker   │  │    tions    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Workflow Types

| Type | Description | Use Case |
|------|-------------|----------|
| Single Approver | One person approves | Low-risk changes |
| Multi-Level | Multiple approval levels | High-risk changes |
| Sequential | Approvals in order | Compliance requirements |
| Parallel | Any approver can approve | Fast turnaround |
| Conditional | Different paths based on criteria | Risk-based |
| Auto-Approve | Automatic for certain criteria | Low-risk automation |

### Change Types Requiring Approval

- Prompt production deployment
- Model configuration changes
- Guardrail modifications
- Policy updates
- Access grants
- Budget increases

## Database Schema

```sql
-- Approval Workflows Schema

-- Workflow definitions
CREATE TABLE approval_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- What triggers this workflow
    trigger_type VARCHAR(50) NOT NULL, -- 'prompt_deploy', 'model_change', 'policy_change', 'access_request', etc.
    
    -- Conditions for workflow to apply
    trigger_conditions JSONB,
    -- {environment: 'production', risk_level: ['high', 'critical']}
    
    -- Workflow type
    workflow_type VARCHAR(50) NOT NULL, -- 'single', 'multi_level', 'sequential', 'parallel', 'conditional'
    
    -- Settings
    auto_approve_conditions JSONB, -- When to auto-approve
    sla_hours INTEGER, -- Expected completion time
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow stages (for multi-level)
CREATE TABLE approval_workflow_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    
    -- Order
    stage_order INTEGER NOT NULL,
    
    -- Approvers
    approver_type VARCHAR(50) NOT NULL, -- 'user', 'role', 'team', 'any_of', 'all_of'
    approver_config JSONB NOT NULL,
    -- {users: [...]} or {roles: [...]} or {team: '...'} or {any_of: [{type, value}]}
    
    -- Requirements
    required_approvals INTEGER DEFAULT 1,
    
    -- Conditions to skip this stage
    skip_conditions JSONB,
    
    -- Timeout
    timeout_hours INTEGER,
    timeout_action VARCHAR(50), -- 'escalate', 'auto_approve', 'auto_reject'
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approval requests
CREATE TABLE approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    workflow_id UUID NOT NULL REFERENCES approval_workflows(id),
    
    -- Request identification
    request_number VARCHAR(50) NOT NULL,
    
    -- Requestor
    requested_by UUID NOT NULL REFERENCES users(id),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- What's being approved
    change_type VARCHAR(50) NOT NULL,
    change_id VARCHAR(255) NOT NULL, -- ID of prompt, policy, etc.
    change_summary TEXT NOT NULL,
    change_details JSONB NOT NULL,
    
    -- Diff/comparison data
    previous_version JSONB,
    new_version JSONB,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'approved', 'rejected', 'cancelled', 'expired'
    
    -- Current stage (for multi-level)
    current_stage_id UUID REFERENCES approval_workflow_stages(id),
    
    -- Timeline
    sla_deadline TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Resolution
    resolution_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stage instances (for tracking multi-level progress)
CREATE TABLE approval_request_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES approval_workflow_stages(id),
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'skipped'
    
    -- Requirements
    required_approvals INTEGER NOT NULL,
    received_approvals INTEGER DEFAULT 0,
    
    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    timeout_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual approvals
CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
    stage_instance_id UUID REFERENCES approval_request_stages(id),
    
    -- Approver
    approver_id UUID NOT NULL REFERENCES users(id),
    
    -- Decision
    decision VARCHAR(20) NOT NULL, -- 'approve', 'reject', 'request_changes'
    
    -- Feedback
    comments TEXT,
    requested_changes JSONB,
    
    -- Timing
    decided_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approval delegation
CREATE TABLE approval_delegations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Delegator
    delegator_id UUID NOT NULL REFERENCES users(id),
    
    -- Delegate
    delegate_id UUID NOT NULL REFERENCES users(id),
    
    -- Scope
    workflow_ids JSONB, -- NULL = all workflows
    
    -- Validity
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ NOT NULL,
    
    reason TEXT,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approval reminders
CREATE TABLE approval_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
    
    reminder_type VARCHAR(50) NOT NULL, -- 'initial', 'follow_up', 'sla_warning', 'escalation'
    
    sent_to UUID NOT NULL REFERENCES users(id),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    
    channel VARCHAR(50), -- 'email', 'slack', 'in_app'
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_approval_workflows_tenant ON approval_workflows(tenant_id);
CREATE INDEX idx_approval_workflow_stages ON approval_workflow_stages(workflow_id, stage_order);
CREATE INDEX idx_approval_requests_tenant ON approval_requests(tenant_id, created_at DESC);
CREATE INDEX idx_approval_requests_status ON approval_requests(status) WHERE status IN ('pending', 'in_progress');
CREATE INDEX idx_approval_requests_requestor ON approval_requests(requested_by, status);
CREATE INDEX idx_approval_request_stages ON approval_request_stages(request_id);
CREATE INDEX idx_approvals_request ON approvals(request_id);
CREATE INDEX idx_approvals_approver ON approvals(approver_id, created_at DESC);
CREATE INDEX idx_approval_delegations_delegate ON approval_delegations(delegate_id, is_active);
```

## API Endpoints

```
# Workflows
GET    /api/approvals/workflows           # List workflows
POST   /api/approvals/workflows           # Create workflow
GET    /api/approvals/workflows/:id       # Get workflow
PUT    /api/approvals/workflows/:id       # Update workflow
DELETE /api/approvals/workflows/:id       # Delete workflow

# Requests
GET    /api/approvals/requests            # List requests
POST   /api/approvals/requests            # Submit request
GET    /api/approvals/requests/:id        # Get request
DELETE /api/approvals/requests/:id        # Cancel request

# Actions
POST   /api/approvals/requests/:id/approve # Approve
POST   /api/approvals/requests/:id/reject  # Reject
POST   /api/approvals/requests/:id/request-changes # Request changes

# My approvals
GET    /api/approvals/pending             # My pending approvals
GET    /api/approvals/history             # My approval history

# Delegations
GET    /api/approvals/delegations         # List delegations
POST   /api/approvals/delegations         # Create delegation
DELETE /api/approvals/delegations/:id     # Revoke delegation

# Dashboard
GET    /api/approvals/dashboard           # Dashboard data
GET    /api/approvals/metrics             # Approval metrics
```

## UI Components

### Dashboard Pages

1. **Approval Dashboard** (`/approvals`)
   - Pending approvals
   - My requests
   - Recent activity
   - SLA status

2. **Request Detail** (`/approvals/requests/:id`)
   - Request summary
   - Diff view
   - Approval history
   - Action buttons

3. **Submit Request** (`/approvals/new`)
   - Change selection
   - Justification
   - Workflow preview

4. **Workflow Builder** (`/admin/approvals/workflows`)
   - Visual workflow builder
   - Stage configuration
   - Approver assignment
   - Condition builder

5. **Delegation Manager** (`/approvals/delegations`)
   - Active delegations
   - Create delegation
   - Delegation history

6. **Analytics** (`/admin/approvals/analytics`)
   - Approval velocity
   - SLA compliance
   - Bottleneck analysis
   - Approver workload

## Dependencies

- **Existing:** Users, Roles, Teams
- **Related:** Policy Engine, Prompt Management
- **External:** Notification service

## Security Considerations

- Approver verification
- Delegation limits
- Audit trail immutable
- Conflict of interest detection
- Approval token security

## Success Metrics

| Metric | Target |
|--------|--------|
| SLA compliance | > 95% |
| Average approval time | < 24 hours |
| Rejection rate | < 20% |
| Auto-approval rate | > 30% (for low-risk) |

## Implementation Notes

### Phase 1: Basic Workflows
- Single approver workflow
- Basic request/approve flow
- Email notifications

### Phase 2: Advanced Workflows
- Multi-level approvals
- Parallel approval
- Conditional routing

### Phase 3: Automation
- Auto-approve conditions
- SLA management
- Escalation

### Phase 4: Intelligence
- Approval recommendations
- Workload balancing
- Risk-based routing
