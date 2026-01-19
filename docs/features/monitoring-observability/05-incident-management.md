# AI Incident Management

> **Priority:** P2 - Medium  
> **Category:** Monitoring & Observability  
> **Status:** Planned

## Overview

AI-specific incident tracking and management system for handling AI failures, safety issues, and quality problems with structured workflows and postmortems.

## Problem Statement

AI incidents are different from traditional software incidents:
- May involve safety or ethical issues
- Harder to reproduce and diagnose
- May require model or prompt changes
- Can have regulatory implications
- Need specialized expertise to resolve

Organizations need AI-specific incident management.

## User Stories

### As an Incident Commander
- I want to quickly understand and categorize AI incidents
- I want to coordinate response across teams
- I want clear escalation paths

### As an ML Engineer
- I want incident context to diagnose issues
- I want to track remediation actions
- I want to learn from past incidents

### As a Trust & Safety Lead
- I want to track safety-related incidents
- I want to ensure proper handling of sensitive issues
- I want incident metrics for risk assessment

### As a Compliance Officer
- I want documentation of incident handling
- I want to demonstrate proper incident response
- I want incident reports for regulators

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Incident Management                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Incident Types                           │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │ Safety  │  │ Quality │  │Availabil│              │   │
│  │  │         │  │         │  │   ity   │              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │  Data   │  │Security │  │ Compli- │              │   │
│  │  │ Privacy │  │         │  │  ance   │              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Triage    │  │  Response   │  │ Postmortem  │         │
│  │   Workflow  │  │  Tracking   │  │   System    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Incident Categories

| Category | Examples | Severity |
|----------|----------|----------|
| Safety | Harmful content generated | Critical |
| Quality | Model producing wrong answers | High |
| Availability | AI service down | High |
| Data/Privacy | PII exposure | Critical |
| Security | Prompt injection attack | Critical |
| Compliance | Regulatory violation | High |
| Performance | Severe latency degradation | Medium |

### Components

1. **Incident Registry** - Central incident tracking
2. **Triage Workflow** - Initial assessment and routing
3. **Response Tracking** - Actions and timeline
4. **Communication Hub** - Stakeholder updates
5. **Postmortem System** - Root cause analysis
6. **Learning Database** - Historical patterns

## Database Schema

```sql
-- AI Incident Management Schema

-- Incidents
CREATE TABLE ai_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Identification
    incident_number VARCHAR(50) NOT NULL, -- e.g., INC-2026-0042
    
    -- Classification
    category VARCHAR(50) NOT NULL, -- 'safety', 'quality', 'availability', 'privacy', 'security', 'compliance', 'performance'
    severity VARCHAR(20) NOT NULL, -- 'critical', 'high', 'medium', 'low'
    
    -- Summary
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Impact
    impact_description TEXT,
    affected_users_count INTEGER,
    affected_applications JSONB,
    
    -- Timeline
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ, -- When incident actually started
    acknowledged_at TIMESTAMPTZ,
    mitigated_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'detected', -- 'detected', 'triaging', 'investigating', 'mitigating', 'resolved', 'closed'
    
    -- Assignment
    incident_commander_id UUID REFERENCES users(id),
    assigned_team VARCHAR(100),
    
    -- Related
    related_alert_ids JSONB DEFAULT '[]',
    related_audit_log_ids JSONB DEFAULT '[]',
    
    -- Resolution
    root_cause TEXT,
    resolution TEXT,
    
    -- Postmortem
    postmortem_required BOOLEAN DEFAULT false,
    postmortem_completed BOOLEAN DEFAULT false,
    
    -- Metadata
    tags JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Incident timeline (all updates)
CREATE TABLE ai_incident_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES ai_incidents(id) ON DELETE CASCADE,
    
    -- Event
    event_type VARCHAR(50) NOT NULL, -- 'status_change', 'note', 'action', 'assignment', 'communication'
    
    -- Details
    title VARCHAR(255),
    description TEXT NOT NULL,
    
    -- For status changes
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    
    -- For actions
    action_type VARCHAR(50),
    action_status VARCHAR(20), -- 'pending', 'in_progress', 'completed'
    
    -- Attribution
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incident actions (tasks to resolve)
CREATE TABLE ai_incident_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES ai_incidents(id) ON DELETE CASCADE,
    
    -- Action
    title VARCHAR(255) NOT NULL,
    description TEXT,
    action_type VARCHAR(50) NOT NULL, -- 'investigate', 'mitigate', 'fix', 'communicate', 'verify'
    
    -- Assignment
    assignee_id UUID REFERENCES users(id),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
    
    -- Priority
    priority INTEGER DEFAULT 0,
    due_at TIMESTAMPTZ,
    
    -- Completion
    completed_at TIMESTAMPTZ,
    completion_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Incident communications
CREATE TABLE ai_incident_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES ai_incidents(id) ON DELETE CASCADE,
    
    -- Communication
    communication_type VARCHAR(50) NOT NULL, -- 'internal', 'status_page', 'customer', 'executive', 'regulatory'
    
    subject VARCHAR(255),
    message TEXT NOT NULL,
    
    -- Audience
    audience JSONB, -- Who was notified
    
    -- Delivery
    sent_at TIMESTAMPTZ,
    delivery_channels JSONB, -- ['email', 'slack', 'status_page']
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Postmortems
CREATE TABLE ai_incident_postmortems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES ai_incidents(id),
    
    -- Summary
    summary TEXT NOT NULL,
    
    -- Timeline reconstruction
    timeline JSONB NOT NULL,
    -- [{timestamp, event, details}]
    
    -- Analysis
    root_cause TEXT NOT NULL,
    contributing_factors JSONB,
    
    -- Impact assessment
    impact_summary TEXT,
    impact_metrics JSONB, -- {users_affected, duration_minutes, cost}
    
    -- What went well
    went_well JSONB, -- ["Quick detection", "Effective communication"]
    
    -- What could be improved
    could_improve JSONB, -- ["Monitoring gaps", "Runbook clarity"]
    
    -- Action items
    action_items JSONB NOT NULL,
    -- [{title, owner, due_date, priority, status}]
    
    -- Review
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'review', 'approved', 'published'
    reviewed_by JSONB DEFAULT '[]',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Incident templates
CREATE TABLE ai_incident_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- For which categories
    categories JSONB, -- ['safety', 'quality']
    
    -- Template content
    default_severity VARCHAR(20),
    default_actions JSONB, -- Predefined action items
    runbook_url VARCHAR(500),
    
    -- Escalation
    escalation_path JSONB, -- Who to notify at each severity
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- On-call schedule (simplified)
CREATE TABLE ai_incident_oncall (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Schedule
    team VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    
    is_primary BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incident metrics (aggregated)
CREATE TABLE ai_incident_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Time bucket
    bucket_timestamp TIMESTAMPTZ NOT NULL,
    bucket_interval VARCHAR(20) NOT NULL, -- 'day', 'week', 'month'
    
    -- Counts
    total_incidents INTEGER DEFAULT 0,
    by_category JSONB, -- {safety: 2, quality: 5, ...}
    by_severity JSONB, -- {critical: 1, high: 3, ...}
    
    -- Time metrics
    avg_time_to_acknowledge_minutes INTEGER,
    avg_time_to_mitigate_minutes INTEGER,
    avg_time_to_resolve_minutes INTEGER,
    
    -- Resolution
    resolved_count INTEGER DEFAULT 0,
    postmortem_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_incidents_tenant ON ai_incidents(tenant_id, detected_at DESC);
CREATE INDEX idx_ai_incidents_number ON ai_incidents(incident_number);
CREATE INDEX idx_ai_incidents_status ON ai_incidents(status) WHERE status NOT IN ('resolved', 'closed');
CREATE INDEX idx_ai_incidents_category ON ai_incidents(category, detected_at DESC);
CREATE INDEX idx_ai_incident_timeline ON ai_incident_timeline(incident_id, created_at);
CREATE INDEX idx_ai_incident_actions ON ai_incident_actions(incident_id);
CREATE INDEX idx_ai_incident_actions_assignee ON ai_incident_actions(assignee_id, status);
CREATE INDEX idx_ai_incident_postmortems ON ai_incident_postmortems(incident_id);
CREATE INDEX idx_ai_incident_metrics ON ai_incident_metrics(tenant_id, bucket_timestamp DESC);
```

## API Endpoints

```
# Incidents
GET    /api/ai/incidents                  # List incidents
POST   /api/ai/incidents                  # Create incident
GET    /api/ai/incidents/:id              # Get incident
PUT    /api/ai/incidents/:id              # Update incident
DELETE /api/ai/incidents/:id              # Delete incident

# Timeline
GET    /api/ai/incidents/:id/timeline     # Get timeline
POST   /api/ai/incidents/:id/timeline     # Add timeline entry

# Actions
GET    /api/ai/incidents/:id/actions      # List actions
POST   /api/ai/incidents/:id/actions      # Add action
PUT    /api/ai/incidents/:id/actions/:aid # Update action

# Communications
GET    /api/ai/incidents/:id/communications # List communications
POST   /api/ai/incidents/:id/communicate  # Send communication

# Postmortems
GET    /api/ai/incidents/:id/postmortem   # Get postmortem
POST   /api/ai/incidents/:id/postmortem   # Create/update postmortem
PUT    /api/ai/incidents/:id/postmortem   # Update postmortem

# Templates
GET    /api/ai/incidents/templates        # List templates
POST   /api/ai/incidents/templates        # Create template

# On-call
GET    /api/ai/incidents/oncall           # Get current on-call
POST   /api/ai/incidents/oncall           # Set on-call

# Metrics
GET    /api/ai/incidents/metrics          # Get incident metrics
GET    /api/ai/incidents/dashboard        # Dashboard data
```

## UI Components

### Admin Dashboard Pages

1. **Incident Dashboard** (`/admin/ai/incidents`)
   - Active incidents
   - Severity breakdown
   - Recent resolved
   - Metrics summary

2. **Incident Detail** (`/admin/ai/incidents/:id`)
   - Incident overview
   - Timeline view
   - Actions list
   - Communications
   - Related items

3. **Incident Create/Edit** (`/admin/ai/incidents/new`)
   - Incident form
   - Template selection
   - Severity matrix
   - Initial actions

4. **Postmortem Editor** (`/admin/ai/incidents/:id/postmortem`)
   - Structured postmortem form
   - Timeline builder
   - Action item tracker
   - Review workflow

5. **Metrics & Reporting** (`/admin/ai/incidents/metrics`)
   - MTTD, MTTR trends
   - Category breakdown
   - Severity distribution
   - Team performance

6. **On-Call Management** (`/admin/ai/incidents/oncall`)
   - Schedule view
   - Rotation management

## Dependencies

- **Existing:** All monitoring features can trigger incidents
- **Related:** Performance Monitoring, Quality Scoring, Drift Detection
- **External:** Optional: PagerDuty, Opsgenie integration

## Security Considerations

- Incident access by role
- Sensitive incident data protection
- Communication approval workflows
- Audit log all actions

## Success Metrics

| Metric | Target |
|--------|--------|
| MTTD (Mean Time to Detect) | < 5 minutes |
| MTTA (Mean Time to Acknowledge) | < 15 minutes |
| MTTR (Mean Time to Resolve) | Category-dependent |
| Postmortem completion | 100% for sev-1/2 |

## Implementation Notes

### Phase 1: Basic Incident Tracking
- Incident CRUD
- Simple timeline
- Status management

### Phase 2: Workflow
- Action tracking
- Assignment
- Templates
- Communications

### Phase 3: Postmortems
- Postmortem workflow
- Action item tracking
- Learning database

### Phase 4: Advanced
- Alert integration
- On-call management
- External integrations
- Analytics
