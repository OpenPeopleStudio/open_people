# AI Cost Analytics

> **Priority:** P1 - High  
> **Category:** Monitoring & Observability  
> **Status:** Implemented

## Overview

Comprehensive tracking of AI-related costs including token usage, API calls, and compute expenses, with budgeting, alerts, and optimization recommendations.

## Problem Statement

AI costs can spiral quickly:
- Token costs vary significantly by model and provider
- No visibility into which teams/applications drive costs
- Unexpected usage spikes cause budget overruns
- Difficulty attributing costs to business value
- Missed optimization opportunities (caching, model selection)

## User Stories

### As a Finance Manager
- I want to understand our total AI spend
- I want to allocate costs to departments/projects
- I want budget forecasting and alerts

### As an Engineering Manager
- I want to see costs by application/team
- I want to identify optimization opportunities
- I want to set budgets for my team

### As a Developer
- I want to understand the cost of my AI features
- I want to compare costs across models
- I want alerts when my usage spikes

### As an Executive
- I want high-level AI cost trends
- I want ROI analysis for AI investments
- I want benchmarks against industry

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AI Cost Analytics                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │               Data Collection                         │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │  Token  │  │ Provider│  │ Compute │              │   │
│  │  │ Counter │  │   APIs  │  │ Metrics │              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │    Cost     │  │   Budget    │  │   Optimize  │         │
│  │ Attribution │  │   Manager   │  │   Advisor   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Cost Categories

| Category | Calculation | Example |
|----------|-------------|---------|
| Input Tokens | tokens × price/1K | GPT-4: $0.03/1K |
| Output Tokens | tokens × price/1K | GPT-4: $0.06/1K |
| Embedding | tokens × price/1K | Ada: $0.0001/1K |
| Fine-tuning | training tokens × price | Custom model training |
| Image Generation | images × price | DALL-E: $0.04/image |
| Compute | GPU hours × rate | Self-hosted inference |

## Database Schema

```sql
-- AI Cost Analytics Schema

-- Pricing configuration
CREATE TABLE ai_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id), -- NULL = platform defaults
    
    -- Model identification
    provider VARCHAR(100) NOT NULL,
    model_name VARCHAR(255) NOT NULL,
    
    -- Pricing (per 1000 tokens/units)
    input_price_per_1k DECIMAL(10,6),
    output_price_per_1k DECIMAL(10,6),
    
    -- For non-token based
    price_per_request DECIMAL(10,6),
    price_per_image DECIMAL(10,6),
    price_per_minute DECIMAL(10,6), -- Audio/video
    
    -- Validity
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    effective_until TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage records (aggregated from audit logs)
CREATE TABLE ai_usage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Source
    audit_log_id UUID REFERENCES ai_audit_logs(id),
    
    -- Time
    usage_timestamp TIMESTAMPTZ NOT NULL,
    
    -- What was used
    provider VARCHAR(100) NOT NULL,
    model_name VARCHAR(255) NOT NULL,
    
    -- Attribution
    application_id VARCHAR(255),
    user_id UUID,
    team_id UUID,
    cost_center VARCHAR(100),
    
    -- Usage metrics
    input_tokens INTEGER,
    output_tokens INTEGER,
    total_tokens INTEGER,
    request_count INTEGER DEFAULT 1,
    
    -- Non-token usage
    images_generated INTEGER,
    audio_minutes DECIMAL(10,2),
    
    -- Calculated cost
    input_cost DECIMAL(10,6),
    output_cost DECIMAL(10,6),
    total_cost DECIMAL(10,6) NOT NULL,
    
    -- Pricing reference
    pricing_id UUID REFERENCES ai_pricing(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budgets
CREATE TABLE ai_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(255) NOT NULL,
    
    -- Scope
    scope_type VARCHAR(50) NOT NULL, -- 'tenant', 'team', 'application', 'user', 'cost_center'
    scope_id VARCHAR(255), -- team_id, app_id, etc.
    
    -- Budget amount
    budget_amount DECIMAL(12,2) NOT NULL,
    budget_currency VARCHAR(3) DEFAULT 'USD',
    
    -- Period
    period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly', 'annual'
    period_start DATE NOT NULL,
    
    -- Alerts
    warning_threshold_percent INTEGER DEFAULT 80,
    critical_threshold_percent INTEGER DEFAULT 100,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget tracking (current period)
CREATE TABLE ai_budget_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES ai_budgets(id) ON DELETE CASCADE,
    
    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Spend
    current_spend DECIMAL(12,2) DEFAULT 0,
    forecasted_spend DECIMAL(12,2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'ok', -- 'ok', 'warning', 'exceeded'
    
    -- Alert tracking
    warning_alert_sent BOOLEAN DEFAULT false,
    critical_alert_sent BOOLEAN DEFAULT false,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cost anomalies
CREATE TABLE ai_cost_anomalies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Detection
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    anomaly_type VARCHAR(50) NOT NULL, -- 'spike', 'unusual_pattern', 'new_model', 'high_cost_query'
    
    -- Details
    description TEXT NOT NULL,
    
    -- Scope
    application_id VARCHAR(255),
    user_id UUID,
    model_name VARCHAR(255),
    
    -- Metrics
    expected_value DECIMAL(12,2),
    actual_value DECIMAL(12,2),
    deviation_percent DECIMAL(5,2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'new', -- 'new', 'acknowledged', 'resolved', 'ignored'
    resolved_by UUID REFERENCES users(id),
    resolution_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optimization recommendations
CREATE TABLE ai_cost_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    recommendation_type VARCHAR(50) NOT NULL, -- 'cache', 'model_switch', 'prompt_optimize', 'batch'
    
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Impact
    estimated_savings_percent DECIMAL(5,2),
    estimated_savings_amount DECIMAL(12,2),
    confidence VARCHAR(20), -- 'low', 'medium', 'high'
    
    -- Scope
    application_id VARCHAR(255),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'implemented', 'dismissed'
    implemented_at TIMESTAMPTZ,
    actual_savings DECIMAL(12,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aggregated cost metrics
CREATE TABLE ai_cost_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Dimensions
    application_id VARCHAR(255),
    team_id UUID,
    user_id UUID,
    provider VARCHAR(100),
    model_name VARCHAR(255),
    cost_center VARCHAR(100),
    
    -- Time bucket
    bucket_timestamp TIMESTAMPTZ NOT NULL,
    bucket_interval VARCHAR(20) NOT NULL, -- 'hour', 'day', 'week', 'month'
    
    -- Metrics
    total_cost DECIMAL(12,2) NOT NULL,
    input_cost DECIMAL(12,2),
    output_cost DECIMAL(12,2),
    
    total_tokens BIGINT,
    input_tokens BIGINT,
    output_tokens BIGINT,
    
    request_count INTEGER,
    
    -- Efficiency
    avg_cost_per_request DECIMAL(10,6),
    avg_tokens_per_request DECIMAL(10,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_pricing_lookup ON ai_pricing(provider, model_name, effective_from DESC);
CREATE INDEX idx_ai_usage_records_tenant ON ai_usage_records(tenant_id, usage_timestamp DESC);
CREATE INDEX idx_ai_usage_records_app ON ai_usage_records(application_id, usage_timestamp DESC);
CREATE INDEX idx_ai_usage_records_cost_center ON ai_usage_records(cost_center, usage_timestamp DESC);
CREATE INDEX idx_ai_budgets_tenant ON ai_budgets(tenant_id);
CREATE INDEX idx_ai_budgets_scope ON ai_budgets(scope_type, scope_id);
CREATE INDEX idx_ai_cost_anomalies_tenant ON ai_cost_anomalies(tenant_id, detected_at DESC);
CREATE INDEX idx_ai_cost_metrics_tenant ON ai_cost_metrics(tenant_id, bucket_timestamp DESC);
CREATE INDEX idx_ai_cost_metrics_app ON ai_cost_metrics(application_id, bucket_timestamp DESC);
```

## API Endpoints

```
# Pricing
GET    /api/ai/costs/pricing              # Get current pricing
PUT    /api/ai/costs/pricing              # Update custom pricing

# Usage
GET    /api/ai/costs/usage                # Get usage records
GET    /api/ai/costs/usage/summary        # Aggregated summary

# Budgets
GET    /api/ai/costs/budgets              # List budgets
POST   /api/ai/costs/budgets              # Create budget
PUT    /api/ai/costs/budgets/:id          # Update budget
DELETE /api/ai/costs/budgets/:id          # Delete budget
GET    /api/ai/costs/budgets/:id/status   # Budget status

# Analytics
GET    /api/ai/costs/dashboard            # Dashboard data
GET    /api/ai/costs/trends               # Cost trends
GET    /api/ai/costs/breakdown            # Cost breakdown by dimension
GET    /api/ai/costs/forecast             # Cost forecast

# Anomalies
GET    /api/ai/costs/anomalies            # List anomalies
PUT    /api/ai/costs/anomalies/:id        # Update anomaly status

# Recommendations
GET    /api/ai/costs/recommendations      # List recommendations
PUT    /api/ai/costs/recommendations/:id  # Update recommendation status

# Export
POST   /api/ai/costs/export               # Export cost data
```

## UI Components

### Admin Dashboard Pages

1. **Cost Overview** (`/admin/ai/costs`)
   - Total spend (current period)
   - Trend chart
   - Budget status widgets
   - Top cost drivers

2. **Cost Explorer** (`/admin/ai/costs/explore`)
   - Interactive cost breakdown
   - Filter by: time, app, team, model
   - Drill-down capability
   - Export to CSV

3. **Budget Management** (`/admin/ai/costs/budgets`)
   - Budget list
   - Create/edit budgets
   - Spend vs budget visualization
   - Alert configuration

4. **Anomalies** (`/admin/ai/costs/anomalies`)
   - Anomaly list
   - Detail view
   - Resolution workflow

5. **Optimization** (`/admin/ai/costs/optimize`)
   - Recommendations list
   - Savings potential
   - Implementation guides
   - Track implemented savings

6. **Reports** (`/admin/ai/costs/reports`)
   - Executive summary
   - Detailed reports
   - Scheduled reports
   - Chargeback reports

## Dependencies

- **Existing:** AI Audit Logs (usage data source)
- **Related:** Usage Analytics, Rate Limiting
- **External:** Provider pricing APIs (optional)

## Security Considerations

- Cost data access controlled by role
- Budget management requires admin
- Sensitive cost data encryption
- Audit log budget changes

## Success Metrics

| Metric | Target |
|--------|--------|
| Budget adherence | 100% within budget |
| Anomaly detection rate | > 90% |
| Cost optimization savings | 20% reduction |
| Forecast accuracy | Within 10% |

## Implementation Notes

### Phase 1: Usage Tracking
- Token counting from audit logs
- Basic pricing configuration
- Cost calculation

### Phase 2: Budgeting
- Budget creation and tracking
- Alert system
- Basic forecasting

### Phase 3: Analytics
- Cost explorer
- Breakdown visualizations
- Anomaly detection

### Phase 4: Optimization
- Recommendation engine
- Savings tracking
- Advanced forecasting

## Loop Closure: Cost-Per-Outcome & Change Correlation

### Cost-Per-Outcome Analytics

Standard cost metrics (cost/request, cost/token) don't tell the full story. Cost-per-outcome metrics incorporate quality and feedback to show actual value:

**Key Metrics:**
- **Cost/Request**: Average cost of all requests (baseline)
- **Cost/Success**: Average cost of successful outcomes (positive feedback or met criteria)
- **Cost/High Quality**: Average cost of high-quality outputs (quality score >= 0.8)

**API Endpoints:**

```
GET /api/ai/costs/outcomes         # Get cost-per-outcome summary
```

**Query Parameters:**
- `days`: Time range (7, 30, 90)
- `group_by`: Dimension to group by (application, model, prompt)

**Response:**
```json
{
  "summary": {
    "total_cost_usd": "125.50",
    "total_requests": 15000,
    "avg_cost_per_request_usd": "0.0084",
    "avg_cost_per_success_usd": "0.0095",
    "avg_cost_per_high_quality_usd": "0.0102",
    "success_rate": "78.5%"
  }
}
```

### Change Event Correlation ("What Changed?")

When cost anomalies occur, the system correlates them with recent changes:

**Change Types Tracked:**
- `prompt_deploy`: Prompt version deployments
- `model_change`: Model provider or version changes
- `routing_change`: Request routing configuration changes
- `cache_config`: Cache configuration changes
- `feature_rollout`: New feature deployments

**API Endpoints:**

```
GET /api/ai/costs/change-events    # List recent change events
POST /api/ai/costs/change-events   # Record a change event
POST /api/ai/jobs/cost-anomalies   # Background job for anomaly detection
```

**Correlation Logic:**

The system calculates correlation scores based on:
1. **Timing**: Changes closer to the anomaly score higher
2. **Change Type**: Model changes correlate strongly with cost spikes
3. **Dimension Match**: Changes affecting the same dimension as the anomaly

**Example Correlation:**
```json
{
  "anomaly_type": "spike",
  "anomaly_timestamp": "2026-01-20T14:30:00Z",
  "correlated_changes": [
    {
      "change_id": "uuid",
      "correlation_score": 0.85,
      "reason": "Model change from gpt-3.5 to gpt-4, 2 hours before spike"
    }
  ],
  "root_cause_hypothesis": "Likely caused by: model change from gpt-3.5 to gpt-4"
}
