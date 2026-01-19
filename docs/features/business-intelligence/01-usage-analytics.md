# Usage Analytics

> **Priority:** P2 - Medium  
> **Category:** Business Intelligence  
> **Status:** Planned

## Overview

Comprehensive analytics on AI usage patterns across the organization, showing who uses AI, how often, for what purposes, and usage trends over time.

## Problem Statement

Organizations lack visibility into AI adoption:
- Don't know who's using AI and how much
- Can't identify power users or laggards
- No data for capacity planning
- Difficult to measure AI program success
- Shadow AI usage goes untracked

## User Stories

### As an AI Program Manager
- I want to track AI adoption across the organization
- I want to identify usage patterns and trends
- I want to measure AI program success

### As a Team Lead
- I want to understand my team's AI usage
- I want to compare with other teams
- I want to identify training needs

### As an Executive
- I want high-level AI usage metrics
- I want to see adoption trends
- I want data for strategic decisions

### As a Finance Manager
- I want usage data for budgeting
- I want to understand usage by cost center
- I want forecasting data

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Usage Analytics                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │               Data Collection                         │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │  Audit  │  │ Gateway │  │  User   │              │   │
│  │  │  Logs   │  │  Logs   │  │ Events  │              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Aggregation │  │Visualization│  │   Export    │         │
│  │   Engine    │  │   Engine    │  │   Engine    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Key Metrics

| Category | Metrics |
|----------|---------|
| Volume | Requests, tokens, users |
| Adoption | Active users, new users, retention |
| Engagement | Sessions, requests per user |
| Features | Feature usage, model usage |
| Trends | Growth rates, seasonality |

## Database Schema

```sql
-- Usage Analytics Schema

-- Daily usage summary (pre-aggregated)
CREATE TABLE usage_daily_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Date
    date DATE NOT NULL,
    
    -- Dimensions (one row per unique combination)
    application_id VARCHAR(255),
    team_id UUID,
    user_id UUID,
    model_name VARCHAR(255),
    feature VARCHAR(100), -- 'chat', 'embedding', 'image', etc.
    
    -- Volume metrics
    request_count INTEGER DEFAULT 0,
    input_tokens BIGINT DEFAULT 0,
    output_tokens BIGINT DEFAULT 0,
    total_tokens BIGINT DEFAULT 0,
    
    -- User metrics
    unique_users INTEGER DEFAULT 0,
    sessions INTEGER DEFAULT 0,
    
    -- Quality metrics
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    avg_latency_ms INTEGER,
    
    -- Cost
    total_cost DECIMAL(12,4) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User activity tracking
CREATE TABLE user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL,
    
    -- Activity date
    date DATE NOT NULL,
    
    -- Activity metrics
    request_count INTEGER DEFAULT 0,
    token_count BIGINT DEFAULT 0,
    session_count INTEGER DEFAULT 0,
    
    -- First/last activity
    first_activity_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ,
    
    -- Features used
    features_used JSONB DEFAULT '[]',
    models_used JSONB DEFAULT '[]',
    applications_used JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, user_id, date)
);

-- User cohort tracking
CREATE TABLE user_cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL,
    
    -- Cohort identification
    first_active_date DATE NOT NULL,
    first_active_week DATE NOT NULL, -- Week start
    first_active_month DATE NOT NULL, -- Month start
    
    -- Lifecycle
    last_active_date DATE,
    total_active_days INTEGER DEFAULT 1,
    
    -- Cumulative metrics
    lifetime_requests BIGINT DEFAULT 0,
    lifetime_tokens BIGINT DEFAULT 0,
    
    -- Engagement classification
    engagement_tier VARCHAR(20), -- 'power', 'regular', 'light', 'churned'
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature usage tracking
CREATE TABLE feature_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Date
    date DATE NOT NULL,
    
    -- Feature
    feature_name VARCHAR(100) NOT NULL,
    
    -- Metrics
    total_uses INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    success_rate DECIMAL(5,4),
    avg_latency_ms INTEGER,
    
    -- By model
    model_breakdown JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, date, feature_name)
);

-- Session tracking
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    session_id VARCHAR(255) NOT NULL,
    
    -- Timing
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    
    -- Activity
    request_count INTEGER DEFAULT 0,
    applications_used JSONB DEFAULT '[]',
    
    -- Device/context
    user_agent TEXT,
    ip_country VARCHAR(2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Retention metrics
CREATE TABLE retention_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Cohort
    cohort_date DATE NOT NULL, -- When users first became active
    cohort_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
    
    -- Cohort size
    cohort_size INTEGER NOT NULL,
    
    -- Retention by period
    -- Period 0 = first day/week/month (always 100%)
    retention JSONB NOT NULL,
    -- {0: 100, 1: 65, 2: 55, 3: 48, ...}
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, cohort_date, cohort_type)
);

-- Adoption milestones
CREATE TABLE adoption_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    milestone_type VARCHAR(50) NOT NULL, -- 'first_1000_users', 'first_1m_tokens', etc.
    milestone_value BIGINT NOT NULL,
    
    achieved_at TIMESTAMPTZ NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom dashboards
CREATE TABLE usage_dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Dashboard configuration
    widgets JSONB NOT NULL,
    -- [{type: 'metric', metric: 'dau', ...}, {type: 'chart', ...}]
    
    -- Sharing
    is_public BOOLEAN DEFAULT false,
    shared_with JSONB DEFAULT '[]',
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_usage_daily_tenant ON usage_daily_summary(tenant_id, date DESC);
CREATE INDEX idx_usage_daily_app ON usage_daily_summary(application_id, date DESC);
CREATE INDEX idx_usage_daily_user ON usage_daily_summary(user_id, date DESC);
CREATE INDEX idx_user_activity_tenant ON user_activity(tenant_id, date DESC);
CREATE INDEX idx_user_activity_user ON user_activity(user_id, date DESC);
CREATE INDEX idx_user_cohorts_tenant ON user_cohorts(tenant_id);
CREATE INDEX idx_user_cohorts_first ON user_cohorts(first_active_date);
CREATE INDEX idx_feature_usage_tenant ON feature_usage(tenant_id, date DESC);
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id, started_at DESC);
CREATE INDEX idx_retention_metrics ON retention_metrics(tenant_id, cohort_date DESC);
```

## API Endpoints

```
# Overview
GET    /api/analytics/overview            # Key metrics summary
GET    /api/analytics/trends              # Trend data

# Volume metrics
GET    /api/analytics/volume              # Request/token volume
GET    /api/analytics/volume/by-app       # Breakdown by app
GET    /api/analytics/volume/by-model     # Breakdown by model
GET    /api/analytics/volume/by-team      # Breakdown by team

# User metrics
GET    /api/analytics/users               # User metrics
GET    /api/analytics/users/active        # DAU/WAU/MAU
GET    /api/analytics/users/new           # New user trends
GET    /api/analytics/users/retention     # Retention curves

# Feature metrics
GET    /api/analytics/features            # Feature usage
GET    /api/analytics/features/:name      # Specific feature

# Cohort analysis
GET    /api/analytics/cohorts             # Cohort data
GET    /api/analytics/cohorts/:date       # Specific cohort

# Export
POST   /api/analytics/export              # Export data
GET    /api/analytics/exports/:id         # Download export

# Custom dashboards
GET    /api/analytics/dashboards          # List dashboards
POST   /api/analytics/dashboards          # Create dashboard
GET    /api/analytics/dashboards/:id      # Get dashboard
PUT    /api/analytics/dashboards/:id      # Update dashboard
```

## UI Components

### Admin Dashboard Pages

1. **Analytics Overview** (`/admin/analytics`)
   - Key metrics cards (DAU, requests, tokens)
   - Trend charts
   - Quick insights
   - Alerts

2. **User Analytics** (`/admin/analytics/users`)
   - Active users chart
   - New vs returning
   - User segments
   - Top users table

3. **Usage Analytics** (`/admin/analytics/usage`)
   - Volume trends
   - Breakdown by dimension
   - Heat maps
   - Peak usage times

4. **Retention Dashboard** (`/admin/analytics/retention`)
   - Retention curves
   - Cohort comparison
   - Churn analysis
   - Engagement tiers

5. **Feature Analytics** (`/admin/analytics/features`)
   - Feature adoption
   - Usage trends
   - Feature comparison

6. **Custom Dashboards** (`/admin/analytics/custom`)
   - Dashboard builder
   - Widget library
   - Share dashboards

## Dependencies

- **Existing:** AI Audit Logs
- **Related:** Cost Analytics
- **External:** Optional BI tool integration

## Security Considerations

- Aggregate data only (no PII in reports)
- Role-based access to analytics
- Data retention policies
- Export audit logging

## Success Metrics

| Metric | Target |
|--------|--------|
| DAU/MAU ratio | > 30% |
| 30-day retention | > 50% |
| Feature adoption | > 60% |
| Power user % | > 15% |

## Implementation Notes

### Phase 1: Basic Metrics
- Volume tracking
- User counts
- Basic dashboards

### Phase 2: Advanced Analytics
- Cohort analysis
- Retention tracking
- Segmentation

### Phase 3: Custom Dashboards
- Dashboard builder
- Widget library
- Sharing

### Phase 4: Intelligence
- Trend predictions
- Anomaly detection
- Recommendations
