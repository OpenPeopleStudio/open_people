# Latency & Performance Monitoring

> **Priority:** P1 - High  
> **Category:** Monitoring & Observability  
> **Status:** Planned

## Overview

Real-time monitoring of AI system performance including response latency, throughput, error rates, and availability, with alerting and diagnostics.

## Problem Statement

AI system performance issues impact user experience:
- High latency frustrates users
- Errors and timeouts cause feature failures
- Performance degradation goes unnoticed until users complain
- Difficult to diagnose root causes
- No baseline for performance expectations

## User Stories

### As an SRE/DevOps Engineer
- I want real-time visibility into AI system health
- I want alerts when performance degrades
- I want to quickly identify root causes

### As a Developer
- I want to understand my application's AI performance
- I want to compare performance across models
- I want to optimize slow AI calls

### As a Product Manager
- I want to ensure AI features meet SLAs
- I want to track performance trends
- I want data for capacity planning

### As a User
- I want fast AI responses
- I want reliable AI features
- I want graceful handling of issues

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Performance Monitoring                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │               Metrics Collection                      │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │ Latency │  │  Error  │  │Throughput│              │   │
│  │  │ Metrics │  │ Metrics │  │ Metrics │              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Alerting  │  │ Diagnostics │  │  Dashboards │         │
│  │   Engine    │  │   Tools     │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Key Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| Latency (p50/p95/p99) | Response time distribution | p95 < 3s |
| TTFT | Time to first token (streaming) | < 500ms |
| Error Rate | Percentage of failed requests | < 0.1% |
| Availability | Uptime percentage | 99.9% |
| Throughput | Requests per second | As needed |
| Token Velocity | Tokens per second (streaming) | > 20 t/s |

### Components

1. **Metrics Collector** - Gather performance data
2. **Time-Series Store** - Efficient metric storage
3. **Alert Engine** - Condition-based alerting
4. **Dashboard Engine** - Real-time visualization
5. **Diagnostics** - Root cause analysis tools
6. **SLA Tracker** - Track against service levels

## Database Schema

```sql
-- Performance Monitoring Schema

-- Performance metrics (time-series, aggregated)
CREATE TABLE ai_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Dimensions
    application_id VARCHAR(255),
    provider VARCHAR(100),
    model_name VARCHAR(255),
    endpoint VARCHAR(255),
    region VARCHAR(50),
    
    -- Time bucket
    bucket_timestamp TIMESTAMPTZ NOT NULL,
    bucket_interval VARCHAR(20) NOT NULL, -- 'minute', 'hour', 'day'
    
    -- Latency metrics (milliseconds)
    latency_p50 INTEGER,
    latency_p75 INTEGER,
    latency_p90 INTEGER,
    latency_p95 INTEGER,
    latency_p99 INTEGER,
    latency_avg INTEGER,
    latency_min INTEGER,
    latency_max INTEGER,
    
    -- TTFT metrics (for streaming)
    ttft_p50 INTEGER,
    ttft_p95 INTEGER,
    ttft_avg INTEGER,
    
    -- Token velocity (tokens/second)
    token_velocity_avg DECIMAL(10,2),
    
    -- Request metrics
    request_count INTEGER NOT NULL,
    success_count INTEGER NOT NULL,
    error_count INTEGER NOT NULL,
    timeout_count INTEGER NOT NULL,
    
    -- Error breakdown
    error_types JSONB, -- {rate_limit: 5, server_error: 2, ...}
    
    -- Throughput
    requests_per_second DECIMAL(10,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time metrics (short retention)
CREATE TABLE ai_performance_realtime (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Request details
    application_id VARCHAR(255),
    provider VARCHAR(100),
    model_name VARCHAR(255),
    
    -- Metrics
    latency_ms INTEGER NOT NULL,
    ttft_ms INTEGER,
    
    success BOOLEAN NOT NULL,
    error_type VARCHAR(100),
    
    input_tokens INTEGER,
    output_tokens INTEGER,
    
    -- For TTL-based cleanup
    expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours'
);

-- SLA definitions
CREATE TABLE ai_slas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(255) NOT NULL,
    
    -- Scope
    application_ids JSONB, -- NULL = all
    
    -- Targets
    latency_p95_target_ms INTEGER,
    latency_p99_target_ms INTEGER,
    error_rate_target_percent DECIMAL(5,2),
    availability_target_percent DECIMAL(5,2),
    
    -- Measurement
    measurement_window VARCHAR(20) DEFAULT 'day', -- 'hour', 'day', 'week', 'month'
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SLA tracking
CREATE TABLE ai_sla_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sla_id UUID NOT NULL REFERENCES ai_slas(id) ON DELETE CASCADE,
    
    -- Period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- Actual performance
    latency_p95_actual_ms INTEGER,
    latency_p99_actual_ms INTEGER,
    error_rate_actual_percent DECIMAL(5,2),
    availability_actual_percent DECIMAL(5,2),
    
    -- Status
    sla_met BOOLEAN NOT NULL,
    violations JSONB, -- Which specific targets were missed
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert configurations
CREATE TABLE ai_performance_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(255) NOT NULL,
    
    -- Condition
    metric VARCHAR(100) NOT NULL, -- 'latency_p95', 'error_rate', 'availability'
    operator VARCHAR(20) NOT NULL, -- 'gt', 'lt', 'gte', 'lte'
    threshold DECIMAL(10,2) NOT NULL,
    
    -- Scope
    application_ids JSONB,
    providers JSONB,
    
    -- Evaluation
    evaluation_window_minutes INTEGER DEFAULT 5,
    
    -- Alert behavior
    severity VARCHAR(20) DEFAULT 'warning', -- 'info', 'warning', 'critical'
    cooldown_minutes INTEGER DEFAULT 30,
    
    -- Notifications
    notification_channels JSONB, -- [{type: 'email', target: '...'}, {type: 'slack', ...}]
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert instances
CREATE TABLE ai_performance_alert_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES ai_performance_alerts(id) ON DELETE CASCADE,
    
    -- Trigger
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    trigger_value DECIMAL(10,2) NOT NULL,
    
    -- Context
    dimensions JSONB, -- {application_id, provider, model}
    
    -- Status
    status VARCHAR(20) DEFAULT 'firing', -- 'firing', 'resolved', 'acknowledged'
    resolved_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES users(id),
    
    -- Notifications
    notifications_sent JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incidents (correlated alerts)
CREATE TABLE ai_performance_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Severity
    severity VARCHAR(20) NOT NULL,
    
    -- Timeline
    started_at TIMESTAMPTZ NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    
    -- Impact
    affected_applications JSONB,
    affected_users_estimate INTEGER,
    
    -- Status
    status VARCHAR(20) DEFAULT 'investigating', -- 'investigating', 'identified', 'monitoring', 'resolved'
    
    -- Resolution
    root_cause TEXT,
    resolution TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incident updates
CREATE TABLE ai_performance_incident_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES ai_performance_incidents(id) ON DELETE CASCADE,
    
    update_type VARCHAR(50) NOT NULL, -- 'status_change', 'update', 'resolution'
    message TEXT NOT NULL,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_perf_metrics_tenant ON ai_performance_metrics(tenant_id, bucket_timestamp DESC);
CREATE INDEX idx_ai_perf_metrics_app ON ai_performance_metrics(application_id, bucket_timestamp DESC);
CREATE INDEX idx_ai_perf_metrics_model ON ai_performance_metrics(provider, model_name, bucket_timestamp DESC);
CREATE INDEX idx_ai_perf_realtime_tenant ON ai_performance_realtime(tenant_id, timestamp DESC);
CREATE INDEX idx_ai_perf_realtime_expires ON ai_performance_realtime(expires_at);
CREATE INDEX idx_ai_slas_tenant ON ai_slas(tenant_id);
CREATE INDEX idx_ai_sla_tracking ON ai_sla_tracking(sla_id, period_start DESC);
CREATE INDEX idx_ai_perf_alerts_tenant ON ai_performance_alerts(tenant_id);
CREATE INDEX idx_ai_perf_alert_instances ON ai_performance_alert_instances(alert_id, triggered_at DESC);
CREATE INDEX idx_ai_perf_alert_instances_status ON ai_performance_alert_instances(status) WHERE status = 'firing';
CREATE INDEX idx_ai_perf_incidents_tenant ON ai_performance_incidents(tenant_id, started_at DESC);
CREATE INDEX idx_ai_perf_incidents_status ON ai_performance_incidents(status) WHERE status != 'resolved';
```

## API Endpoints

```
# Metrics
GET    /api/ai/performance/metrics        # Get aggregated metrics
GET    /api/ai/performance/realtime       # Get real-time metrics
GET    /api/ai/performance/trends         # Get trend data

# SLAs
GET    /api/ai/performance/slas           # List SLAs
POST   /api/ai/performance/slas           # Create SLA
PUT    /api/ai/performance/slas/:id       # Update SLA
GET    /api/ai/performance/slas/:id/status # SLA status

# Alerts
GET    /api/ai/performance/alerts         # List alert configs
POST   /api/ai/performance/alerts         # Create alert
PUT    /api/ai/performance/alerts/:id     # Update alert
DELETE /api/ai/performance/alerts/:id     # Delete alert
GET    /api/ai/performance/alerts/active  # Active alert instances
PUT    /api/ai/performance/alerts/instances/:id # Acknowledge/resolve

# Incidents
GET    /api/ai/performance/incidents      # List incidents
POST   /api/ai/performance/incidents      # Create incident
PUT    /api/ai/performance/incidents/:id  # Update incident
POST   /api/ai/performance/incidents/:id/updates # Add update

# Dashboard
GET    /api/ai/performance/dashboard      # Dashboard data
GET    /api/ai/performance/health         # Health check summary
```

## UI Components

### Admin Dashboard Pages

1. **Performance Overview** (`/admin/ai/performance`)
   - Health status indicators
   - Key metrics summary
   - Active alerts
   - Recent incidents

2. **Metrics Explorer** (`/admin/ai/performance/metrics`)
   - Interactive charts
   - Latency distribution
   - Error rate trends
   - Throughput graphs
   - Filter by app/model/time

3. **SLA Dashboard** (`/admin/ai/performance/sla`)
   - SLA status cards
   - Compliance trends
   - Violation history
   - SLA management

4. **Alert Management** (`/admin/ai/performance/alerts`)
   - Alert configuration list
   - Create/edit alerts
   - Active alerts
   - Alert history

5. **Incident Management** (`/admin/ai/performance/incidents`)
   - Active incidents
   - Incident timeline
   - Update/resolve interface
   - Post-mortem view

6. **Diagnostics** (`/admin/ai/performance/diagnostics`)
   - Slow request analysis
   - Error breakdown
   - Provider comparison
   - Correlation analysis

## Dependencies

- **Existing:** AI Audit Logs (latency data source)
- **Related:** Cost Analytics, Incident Management
- **External:** Optional: External monitoring integration (Datadog, etc.)

## Security Considerations

- Performance data access by role
- No PII in performance logs
- Rate limit diagnostic queries
- Secure alert notifications

## Success Metrics

| Metric | Target |
|--------|--------|
| Metric collection coverage | 100% |
| Alert accuracy (true positives) | > 90% |
| MTTD (Mean Time to Detect) | < 5 minutes |
| SLA tracking accuracy | 100% |

## Implementation Notes

### Phase 1: Basic Monitoring
- Latency and error metrics
- Basic dashboards
- Simple alerts

### Phase 2: SLA & Alerting
- SLA definitions and tracking
- Advanced alerting rules
- Notification integrations

### Phase 3: Diagnostics
- Root cause analysis tools
- Correlation detection
- Optimization recommendations

### Phase 4: Advanced
- Predictive alerting
- Capacity planning
- External integrations
