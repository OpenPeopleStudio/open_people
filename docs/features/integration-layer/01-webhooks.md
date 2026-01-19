# Webhook Events

> **Priority:** P1 - High  
> **Category:** Integration Layer  
> **Status:** Planned

## Overview

Real-time event notifications for AI system events, enabling integration with external systems for alerting, automation, and data synchronization.

## Problem Statement

External systems need AI event data:
- Security tools need threat notifications
- Ticketing systems need incident alerts
- Analytics platforms need usage data
- Automation workflows need triggers
- Custom integrations require real-time data

## User Stories

### As a DevOps Engineer
- I want to send alerts to PagerDuty
- I want to trigger automation on events
- I want to sync data to external systems

### As a Security Engineer
- I want security events in our SIEM
- I want real-time threat notifications
- I want audit data in compliance tools

### As a Developer
- I want to build custom integrations
- I want reliable event delivery
- I want to filter events I care about

### As an Admin
- I want to manage webhook configurations
- I want to monitor delivery success
- I want to debug failed webhooks

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Webhook System                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  Event Sources                        │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │ Audit   │  │ Alert   │  │Quality  │              │   │
│  │  │ Events  │  │ Events  │  │ Events  │              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Event     │  │   Delivery  │  │   Retry     │         │
│  │   Router    │  │   Engine    │  │   Manager   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Event Types

| Category | Events |
|----------|--------|
| AI Operations | request.completed, request.failed, request.blocked |
| Safety | content.flagged, pii.detected, guardrail.triggered |
| Quality | quality.low, drift.detected, hallucination.detected |
| Compliance | policy.violated, approval.required, audit.export |
| System | model.deprecated, quota.exceeded, incident.created |

## Database Schema

```sql
-- Webhook Events Schema

-- Webhook endpoints
CREATE TABLE webhook_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Endpoint configuration
    url VARCHAR(2000) NOT NULL,
    
    -- Authentication
    auth_type VARCHAR(50), -- 'none', 'basic', 'bearer', 'hmac', 'custom_header'
    auth_config JSONB, -- Encrypted credentials
    
    -- Event filtering
    event_types JSONB NOT NULL, -- ['request.completed', 'content.flagged']
    filters JSONB, -- {application_id: 'app-123', severity: ['high', 'critical']}
    
    -- Delivery settings
    timeout_seconds INTEGER DEFAULT 30,
    max_retries INTEGER DEFAULT 3,
    retry_backoff VARCHAR(20) DEFAULT 'exponential', -- 'linear', 'exponential'
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Verification
    secret_key VARCHAR(64), -- For HMAC signing
    verified_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Event definitions
CREATE TABLE webhook_event_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    name VARCHAR(100) NOT NULL UNIQUE, -- 'request.completed'
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    category VARCHAR(50) NOT NULL,
    
    -- Payload schema
    payload_schema JSONB,
    
    -- Sample payload
    sample_payload JSONB,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event queue
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Event details
    event_type VARCHAR(100) NOT NULL,
    event_id VARCHAR(64) NOT NULL, -- Unique event identifier
    
    -- Payload
    payload JSONB NOT NULL,
    
    -- Timing
    occurred_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery attempts
CREATE TABLE webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES webhook_events(id),
    endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id),
    
    -- Attempt details
    attempt_number INTEGER NOT NULL DEFAULT 1,
    
    -- Request
    request_url VARCHAR(2000) NOT NULL,
    request_headers JSONB,
    request_body TEXT,
    
    -- Response
    response_status INTEGER,
    response_headers JSONB,
    response_body TEXT,
    
    -- Timing
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    
    -- Status
    status VARCHAR(20) NOT NULL, -- 'pending', 'success', 'failed', 'retrying'
    error_message TEXT,
    
    -- Retry
    next_retry_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery statistics
CREATE TABLE webhook_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id),
    
    -- Period
    date DATE NOT NULL,
    hour INTEGER, -- 0-23, NULL for daily aggregate
    
    -- Counts
    total_events INTEGER DEFAULT 0,
    successful_deliveries INTEGER DEFAULT 0,
    failed_deliveries INTEGER DEFAULT 0,
    
    -- Timing
    avg_latency_ms INTEGER,
    p95_latency_ms INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(endpoint_id, date, hour)
);

-- Event transformations
CREATE TABLE webhook_transformations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id),
    
    name VARCHAR(255) NOT NULL,
    
    -- Transformation
    transformation_type VARCHAR(50) NOT NULL, -- 'jq', 'jsonpath', 'template'
    transformation_config TEXT NOT NULL,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dead letter queue
CREATE TABLE webhook_dlq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_id UUID NOT NULL REFERENCES webhook_deliveries(id),
    
    -- Failure info
    final_error TEXT,
    total_attempts INTEGER,
    
    -- For manual retry
    can_retry BOOLEAN DEFAULT true,
    retried_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_webhook_endpoints_tenant ON webhook_endpoints(tenant_id);
CREATE INDEX idx_webhook_events_tenant ON webhook_events(tenant_id, occurred_at DESC);
CREATE INDEX idx_webhook_events_type ON webhook_events(event_type, occurred_at DESC);
CREATE INDEX idx_webhook_deliveries_event ON webhook_deliveries(event_id);
CREATE INDEX idx_webhook_deliveries_endpoint ON webhook_deliveries(endpoint_id, created_at DESC);
CREATE INDEX idx_webhook_deliveries_retry ON webhook_deliveries(next_retry_at) WHERE status = 'retrying';
CREATE INDEX idx_webhook_stats_endpoint ON webhook_stats(endpoint_id, date DESC);
CREATE INDEX idx_webhook_dlq_delivery ON webhook_dlq(delivery_id);
```

## API Endpoints

```
# Endpoints
GET    /api/webhooks/endpoints            # List endpoints
POST   /api/webhooks/endpoints            # Create endpoint
GET    /api/webhooks/endpoints/:id        # Get endpoint
PUT    /api/webhooks/endpoints/:id        # Update endpoint
DELETE /api/webhooks/endpoints/:id        # Delete endpoint

# Testing
POST   /api/webhooks/endpoints/:id/test   # Send test event
POST   /api/webhooks/endpoints/:id/verify # Verify endpoint

# Event types
GET    /api/webhooks/event-types          # List event types

# Deliveries
GET    /api/webhooks/deliveries           # List deliveries
GET    /api/webhooks/deliveries/:id       # Get delivery detail
POST   /api/webhooks/deliveries/:id/retry # Retry delivery

# Dead letter queue
GET    /api/webhooks/dlq                  # List DLQ items
POST   /api/webhooks/dlq/:id/retry        # Retry from DLQ
DELETE /api/webhooks/dlq/:id              # Remove from DLQ

# Statistics
GET    /api/webhooks/stats                # Overall stats
GET    /api/webhooks/endpoints/:id/stats  # Endpoint stats

# Transformations
GET    /api/webhooks/endpoints/:id/transforms # List transforms
POST   /api/webhooks/endpoints/:id/transforms # Add transform
```

## Webhook Payload Format

```json
{
  "id": "evt_abc123",
  "type": "content.flagged",
  "occurred_at": "2026-01-15T10:30:00Z",
  "tenant_id": "tenant_xyz",
  "data": {
    "audit_log_id": "log_123",
    "categories": ["hate", "violence"],
    "severity": "high",
    "action_taken": "blocked"
  },
  "metadata": {
    "application_id": "app_456",
    "user_id": "user_789"
  }
}
```

## UI Components

### Admin Dashboard Pages

1. **Webhooks Overview** (`/admin/webhooks`)
   - Endpoint list
   - Health status
   - Recent activity
   - Quick actions

2. **Endpoint Configuration** (`/admin/webhooks/endpoints/:id`)
   - URL and auth config
   - Event type selection
   - Filter configuration
   - Test interface

3. **Delivery Log** (`/admin/webhooks/deliveries`)
   - Delivery history
   - Filter by status
   - Request/response viewer
   - Retry controls

4. **Dead Letter Queue** (`/admin/webhooks/dlq`)
   - Failed deliveries
   - Error analysis
   - Bulk retry
   - Purge options

5. **Statistics** (`/admin/webhooks/stats`)
   - Success rate trends
   - Latency charts
   - Volume by event type
   - Error breakdown

## Dependencies

- **Existing:** All event-generating features
- **Related:** Incident Management
- **External:** Customer webhook endpoints

## Security Considerations

- HMAC signature verification
- Credential encryption
- IP allowlisting option
- Rate limiting
- Payload size limits
- TLS requirement

## Success Metrics

| Metric | Target |
|--------|--------|
| Delivery success rate | > 99.9% |
| Delivery latency p95 | < 5 seconds |
| DLQ volume | < 0.1% |
| Retry success rate | > 90% |

## Implementation Notes

### Phase 1: Basic Webhooks
- Endpoint configuration
- Event delivery
- Basic retry logic

### Phase 2: Reliability
- HMAC signing
- Exponential backoff
- Dead letter queue

### Phase 3: Advanced
- Event transformations
- Filtering
- Statistics

### Phase 4: Enterprise
- IP allowlisting
- Custom headers
- Batch delivery
