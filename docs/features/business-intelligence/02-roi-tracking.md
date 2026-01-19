# ROI Tracking

> **Priority:** P3 - Low  
> **Category:** Business Intelligence  
> **Status:** Planned

## Overview

Measure and demonstrate the return on investment from AI adoption, tracking productivity gains, time savings, cost reductions, and business impact.

## Problem Statement

Justifying AI investment is difficult:
- Hard to quantify AI benefits
- No baseline for comparison
- Anecdotal evidence isn't convincing
- Executives need hard numbers
- Difficult to attribute outcomes to AI

## User Stories

### As an AI Program Manager
- I want to prove AI is delivering value
- I want to identify highest-impact use cases
- I want data for budget requests

### As an Executive
- I want to understand AI ROI
- I want to compare AI investment options
- I want business impact metrics

### As a Finance Manager
- I want to calculate total cost of ownership
- I want to see cost savings from AI
- I want ROI projections

### As a Team Lead
- I want to show my team's AI productivity gains
- I want to benchmark against other teams
- I want to justify AI tool spending

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      ROI Tracking                            │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │               Value Metrics                           │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │  Time   │  │  Cost   │  │ Quality │              │   │
│  │  │ Saved   │  │ Reduced │  │ Improved│              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │ Revenue │  │ Output  │  │ Custom  │              │   │
│  │  │ Impact  │  │ Increase│  │ Metrics │              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Calculation │  │   Report    │  │  Benchmark  │         │
│  │   Engine    │  │  Generator  │  │    Data     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### ROI Components

| Component | Description | Calculation |
|-----------|-------------|-------------|
| Time Saved | Hours saved using AI | (Tasks × Avg time saved) |
| Labor Cost Saved | $ from time savings | Time saved × Hourly rate |
| Error Reduction | Fewer mistakes | Error rate reduction × Error cost |
| Throughput Increase | More output | Additional output × Value |
| AI Cost | Investment in AI | License + API + Infrastructure |
| Net ROI | Overall return | (Benefits - Costs) / Costs |

## Database Schema

```sql
-- ROI Tracking Schema

-- ROI projects/initiatives
CREATE TABLE roi_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Scope
    application_ids JSONB,
    team_ids JSONB,
    
    -- Timeline
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- Baseline (before AI)
    baseline_metrics JSONB NOT NULL,
    -- {
    --   avg_task_time_minutes: 45,
    --   tasks_per_day: 20,
    --   error_rate: 0.05,
    --   hourly_labor_cost: 75
    -- }
    
    -- Targets
    target_improvement JSONB,
    -- {time_savings_percent: 30, error_reduction_percent: 50}
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'planning', 'active', 'completed', 'cancelled'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- ROI measurements
CREATE TABLE roi_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES roi_projects(id) ON DELETE CASCADE,
    
    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Volume
    ai_assisted_tasks INTEGER,
    total_tasks INTEGER,
    ai_adoption_rate DECIMAL(5,4),
    
    -- Time metrics
    avg_task_time_with_ai_minutes DECIMAL(10,2),
    time_saved_minutes BIGINT,
    time_saved_hours DECIMAL(10,2),
    
    -- Cost metrics
    labor_cost_saved DECIMAL(12,2),
    ai_cost_incurred DECIMAL(12,2),
    net_savings DECIMAL(12,2),
    
    -- Quality metrics
    error_count_with_ai INTEGER,
    error_count_baseline INTEGER,
    error_cost_avoided DECIMAL(12,2),
    
    -- Custom metrics
    custom_metrics JSONB,
    
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time savings log (individual events)
CREATE TABLE roi_time_savings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES roi_projects(id),
    tenant_id UUID NOT NULL,
    
    -- Event
    event_date DATE NOT NULL,
    user_id UUID,
    application_id VARCHAR(255),
    
    -- Task
    task_type VARCHAR(100),
    
    -- Time metrics
    baseline_time_minutes DECIMAL(10,2),
    actual_time_minutes DECIMAL(10,2),
    time_saved_minutes DECIMAL(10,2),
    
    -- Source
    source VARCHAR(50), -- 'user_reported', 'measured', 'estimated'
    audit_log_id UUID REFERENCES ai_audit_logs(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Productivity benchmarks
CREATE TABLE roi_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Benchmark identification
    task_type VARCHAR(100) NOT NULL,
    industry VARCHAR(100),
    
    -- Metrics
    avg_time_without_ai_minutes DECIMAL(10,2),
    avg_time_with_ai_minutes DECIMAL(10,2),
    typical_savings_percent DECIMAL(5,2),
    
    -- Source
    source VARCHAR(255),
    sample_size INTEGER,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROI reports
CREATE TABLE roi_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES roi_projects(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    report_type VARCHAR(50) NOT NULL, -- 'monthly', 'quarterly', 'annual', 'custom'
    
    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Summary metrics
    total_time_saved_hours DECIMAL(12,2),
    total_labor_cost_saved DECIMAL(12,2),
    total_ai_cost DECIMAL(12,2),
    net_roi DECIMAL(12,2),
    roi_percentage DECIMAL(8,2),
    
    -- Breakdown
    breakdown_by_team JSONB,
    breakdown_by_use_case JSONB,
    
    -- Narrative
    executive_summary TEXT,
    key_findings JSONB,
    recommendations JSONB,
    
    -- Report file
    report_file_url VARCHAR(500),
    
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    generated_by UUID REFERENCES users(id)
);

-- Value stories (qualitative evidence)
CREATE TABLE roi_value_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES roi_projects(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    title VARCHAR(255) NOT NULL,
    story TEXT NOT NULL,
    
    -- Quantified impact
    time_saved_hours DECIMAL(10,2),
    cost_impact DECIMAL(12,2),
    
    -- Source
    submitted_by UUID REFERENCES users(id),
    team_id UUID,
    
    -- Approval
    approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_roi_projects_tenant ON roi_projects(tenant_id);
CREATE INDEX idx_roi_measurements_project ON roi_measurements(project_id, period_start DESC);
CREATE INDEX idx_roi_time_savings_project ON roi_time_savings(project_id, event_date DESC);
CREATE INDEX idx_roi_time_savings_tenant ON roi_time_savings(tenant_id, event_date DESC);
CREATE INDEX idx_roi_reports_project ON roi_reports(project_id, period_start DESC);
CREATE INDEX idx_roi_reports_tenant ON roi_reports(tenant_id, period_start DESC);
CREATE INDEX idx_roi_value_stories_tenant ON roi_value_stories(tenant_id);
```

## API Endpoints

```
# Projects
GET    /api/roi/projects                  # List projects
POST   /api/roi/projects                  # Create project
GET    /api/roi/projects/:id              # Get project
PUT    /api/roi/projects/:id              # Update project

# Measurements
GET    /api/roi/projects/:id/measurements # Get measurements
POST   /api/roi/projects/:id/measure      # Add measurement

# Time savings
POST   /api/roi/time-savings              # Log time saving
GET    /api/roi/time-savings              # List time savings

# Reports
GET    /api/roi/reports                   # List reports
POST   /api/roi/reports/generate          # Generate report
GET    /api/roi/reports/:id               # Get report

# Value stories
GET    /api/roi/stories                   # List stories
POST   /api/roi/stories                   # Submit story
PUT    /api/roi/stories/:id               # Update/approve

# Benchmarks
GET    /api/roi/benchmarks                # Get benchmarks

# Dashboard
GET    /api/roi/dashboard                 # Dashboard data
GET    /api/roi/summary                   # Quick summary
```

## UI Components

### Admin Dashboard Pages

1. **ROI Overview** (`/admin/roi`)
   - Total ROI summary
   - Savings trend
   - Project highlights
   - Quick metrics

2. **Project Detail** (`/admin/roi/projects/:id`)
   - Project metrics
   - Measurement history
   - ROI calculation breakdown
   - Value stories

3. **ROI Calculator** (`/admin/roi/calculator`)
   - Interactive calculator
   - Scenario modeling
   - What-if analysis

4. **Reports** (`/admin/roi/reports`)
   - Report list
   - Generate new report
   - Report templates
   - Executive summaries

5. **Value Stories** (`/admin/roi/stories`)
   - Story collection
   - Approval workflow
   - Story showcase

6. **Benchmarks** (`/admin/roi/benchmarks`)
   - Industry benchmarks
   - Internal comparison
   - Target setting

## Dependencies

- **Existing:** Usage Analytics, Cost Analytics
- **Related:** All AI features
- **External:** None

## Security Considerations

- Financial data access control
- Report distribution controls
- Benchmark data anonymization
- Audit logging for ROI data

## Success Metrics

| Metric | Target |
|--------|--------|
| ROI measurement coverage | > 80% of AI usage |
| Demonstrated ROI | > 200% |
| Report adoption | Monthly reports used |
| Value story collection | > 10 per quarter |

## Implementation Notes

### Phase 1: Basic ROI
- Project setup
- Manual measurements
- Simple calculations

### Phase 2: Automation
- Automated time tracking
- Cost integration
- Report generation

### Phase 3: Advanced
- Scenario modeling
- Predictive ROI
- Benchmark comparison

### Phase 4: Intelligence
- AI-suggested improvements
- Opportunity identification
- Cross-org insights
