# Rate Limiting & Quotas

> **Priority:** P2 - Medium  
> **Category:** Developer Experience  
> **Status:** Planned

## Overview

Flexible rate limiting and quota management for AI usage, with per-user, per-team, and per-application controls to prevent abuse and manage costs.

## Problem Statement

Without rate limiting:
- Single users can exhaust API quotas
- Runaway applications cause budget overruns
- No fair usage across teams
- Difficult to predict costs
- Abuse goes unchecked

## User Stories

### As an Admin
- I want to set limits on AI usage
- I want to allocate quotas to teams
- I want to prevent abuse

### As a Developer
- I want to understand my rate limits
- I want clear feedback when limited
- I want to request quota increases

### As a Finance Manager
- I want to cap spending per department
- I want usage to stay within budget
- I want alerts before limits are reached

### As a Product Manager
- I want fair access across users
- I want to prioritize critical applications
- I want to handle limit gracefully in UX

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Rate Limiting & Quotas                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Request ──▶ [Limit Check] ──▶ Allow/Deny                  │
│                    │                                         │
│                    ▼                                         │
│   ┌──────────────────────────────────────────────────────┐  │
│   │              Limit Evaluators                         │  │
│   │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │  │
│   │  │  Rate   │  │  Token  │  │  Cost   │              │  │
│   │  │ Limits  │  │  Quotas │  │  Limits │              │  │
│   │  └─────────┘  └─────────┘  └─────────┘              │  │
│   └──────────────────────────────────────────────────────┘  │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Counter   │  │   Quota     │  │   Alert     │         │
│  │   Store     │  │   Tracker   │  │   System    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Limit Types

| Type | Description | Example |
|------|-------------|---------|
| Rate Limit | Requests per time window | 100 req/min |
| Token Quota | Tokens per period | 1M tokens/month |
| Cost Limit | Spend per period | $500/month |
| Concurrent | Simultaneous requests | 10 concurrent |

### Limit Scopes

| Scope | Description |
|-------|-------------|
| Global | Platform-wide limits |
| Tenant | Per-organization limits |
| Team | Per-team allocations |
| User | Per-user limits |
| Application | Per-app limits |
| API Key | Per-key limits |

## Database Schema

```sql
-- Rate Limiting & Quotas Schema

-- Rate limit policies
CREATE TABLE rate_limit_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id), -- NULL = global
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Scope
    scope_type VARCHAR(50) NOT NULL, -- 'global', 'tenant', 'team', 'user', 'application', 'api_key'
    scope_id VARCHAR(255), -- Specific ID if applicable
    
    -- Rate limits
    rate_limits JSONB NOT NULL,
    -- [
    --   {type: 'requests', limit: 100, window_seconds: 60},
    --   {type: 'tokens', limit: 10000, window_seconds: 60},
    --   {type: 'concurrent', limit: 5}
    -- ]
    
    -- Priority (higher = evaluated first)
    priority INTEGER DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quota allocations
CREATE TABLE quota_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(255) NOT NULL,
    
    -- Scope
    scope_type VARCHAR(50) NOT NULL,
    scope_id VARCHAR(255),
    
    -- Quota
    quota_type VARCHAR(50) NOT NULL, -- 'tokens', 'requests', 'cost'
    quota_amount BIGINT NOT NULL,
    
    -- Period
    period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
    period_start DATE NOT NULL,
    
    -- Carry over
    allow_carryover BOOLEAN DEFAULT false,
    max_carryover_percent INTEGER DEFAULT 0,
    
    -- Alerts
    warning_threshold_percent INTEGER DEFAULT 80,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quota usage tracking
CREATE TABLE quota_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    allocation_id UUID NOT NULL REFERENCES quota_allocations(id) ON DELETE CASCADE,
    
    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Usage
    used_amount BIGINT DEFAULT 0,
    remaining_amount BIGINT,
    
    -- Carry over from previous
    carryover_amount BIGINT DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'warning', 'exceeded', 'expired'
    
    -- Alert tracking
    warning_alert_sent BOOLEAN DEFAULT false,
    exceeded_alert_sent BOOLEAN DEFAULT false,
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limit counters (short-lived)
CREATE TABLE rate_limit_counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Key
    counter_key VARCHAR(255) NOT NULL, -- tenant:user:123:requests:60s
    
    -- Counter
    count INTEGER DEFAULT 0,
    window_start TIMESTAMPTZ NOT NULL,
    window_seconds INTEGER NOT NULL,
    
    -- Expiry
    expires_at TIMESTAMPTZ NOT NULL,
    
    UNIQUE(counter_key, window_start)
);

-- Rate limit events
CREATE TABLE rate_limit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Event type
    event_type VARCHAR(50) NOT NULL, -- 'limited', 'quota_warning', 'quota_exceeded'
    
    -- Context
    scope_type VARCHAR(50) NOT NULL,
    scope_id VARCHAR(255),
    
    limit_type VARCHAR(50) NOT NULL, -- 'rate', 'token', 'cost', 'concurrent'
    
    -- Details
    limit_value BIGINT,
    current_value BIGINT,
    
    -- Request context
    request_id VARCHAR(64),
    application_id VARCHAR(255),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quota increase requests
CREATE TABLE quota_increase_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    allocation_id UUID NOT NULL REFERENCES quota_allocations(id),
    
    requested_by UUID NOT NULL REFERENCES users(id),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Request
    current_quota BIGINT NOT NULL,
    requested_quota BIGINT NOT NULL,
    justification TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'denied'
    
    -- Review
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    
    -- If approved
    new_allocation_id UUID REFERENCES quota_allocations(id)
);

-- Exemptions
CREATE TABLE rate_limit_exemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Scope
    scope_type VARCHAR(50) NOT NULL,
    scope_id VARCHAR(255) NOT NULL,
    
    -- Exemption
    exemption_type VARCHAR(50) NOT NULL, -- 'full', 'multiplier', 'specific_limit'
    
    -- For multiplier
    multiplier DECIMAL(5,2),
    
    -- For specific limit override
    override_limits JSONB,
    
    -- Validity
    reason TEXT,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_rate_limit_policies_tenant ON rate_limit_policies(tenant_id);
CREATE INDEX idx_rate_limit_policies_scope ON rate_limit_policies(scope_type, scope_id);
CREATE INDEX idx_quota_allocations_tenant ON quota_allocations(tenant_id);
CREATE INDEX idx_quota_allocations_scope ON quota_allocations(scope_type, scope_id);
CREATE INDEX idx_quota_usage_allocation ON quota_usage(allocation_id);
CREATE INDEX idx_rate_limit_counters_key ON rate_limit_counters(counter_key);
CREATE INDEX idx_rate_limit_counters_expires ON rate_limit_counters(expires_at);
CREATE INDEX idx_rate_limit_events_tenant ON rate_limit_events(tenant_id, created_at DESC);
CREATE INDEX idx_rate_limit_exemptions_scope ON rate_limit_exemptions(scope_type, scope_id);
```

## API Endpoints

```
# Policies
GET    /api/limits/policies               # List policies
POST   /api/limits/policies               # Create policy
PUT    /api/limits/policies/:id           # Update policy
DELETE /api/limits/policies/:id           # Delete policy

# Quotas
GET    /api/limits/quotas                 # List quota allocations
POST   /api/limits/quotas                 # Create allocation
PUT    /api/limits/quotas/:id             # Update allocation
GET    /api/limits/quotas/:id/usage       # Get usage

# Check limits (for applications)
GET    /api/limits/check                  # Check current limits
GET    /api/limits/status                 # Get limit status

# Increase requests
POST   /api/limits/increase-request       # Request quota increase
GET    /api/limits/increase-request       # List requests
PUT    /api/limits/increase-request/:id   # Review request

# Exemptions
GET    /api/limits/exemptions             # List exemptions
POST   /api/limits/exemptions             # Create exemption
DELETE /api/limits/exemptions/:id         # Remove exemption

# Events
GET    /api/limits/events                 # List limit events

# Dashboard
GET    /api/limits/dashboard              # Dashboard data
```

## UI Components

### Admin Dashboard Pages

1. **Limits Overview** (`/admin/limits`)
   - Current usage vs limits
   - Recent limit events
   - Quota health
   - Quick actions

2. **Policies** (`/admin/limits/policies`)
   - Policy list
   - Create/edit policies
   - Priority ordering
   - Scope configuration

3. **Quotas** (`/admin/limits/quotas`)
   - Quota allocations
   - Usage tracking
   - Period management
   - Alerts configuration

4. **Increase Requests** (`/admin/limits/requests`)
   - Pending requests
   - Review interface
   - Request history

5. **Exemptions** (`/admin/limits/exemptions`)
   - Active exemptions
   - Create exemption
   - Expiry management

6. **Events** (`/admin/limits/events`)
   - Limit event log
   - Filter by type/scope
   - Trend analysis

### User-Facing

7. **My Limits** (`/settings/limits`)
   - Current quotas
   - Usage progress
   - Request increase

## Dependencies

- **Existing:** API Gateway
- **Related:** Cost Analytics
- **External:** Redis (optional, for fast counters)

## Security Considerations

- Limits enforced at gateway level
- Bypass requires exemption
- Audit log limit changes
- Prevent limit DoS attacks

## Success Metrics

| Metric | Target |
|--------|--------|
| Limit enforcement accuracy | 100% |
| Evaluation latency | < 5ms |
| False positive rate | < 1% |
| Budget adherence | 100% |

## Implementation Notes

### Phase 1: Basic Rate Limiting
- Request rate limits
- Simple counters
- Basic policies

### Phase 2: Quotas
- Token/cost quotas
- Period tracking
- Usage alerts

### Phase 3: Advanced
- Increase requests
- Exemptions
- Smart throttling

### Phase 4: Optimization
- Distributed counters
- Predictive limiting
- Burst handling
