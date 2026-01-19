# SDK & API Gateway

> **Priority:** P2 - Medium  
> **Category:** Developer Experience  
> **Status:** Planned

## Overview

A unified interface for multiple AI providers (OpenAI, Anthropic, Google, etc.) with consistent API, automatic failover, and built-in governance.

## Problem Statement

Organizations using multiple AI providers face challenges:
- Different APIs, SDKs, and conventions per provider
- Manual failover when one provider has issues
- Duplicated governance logic across integrations
- Difficult to switch or compare providers
- No centralized observability

## User Stories

### As a Developer
- I want one API to access all AI providers
- I want automatic failover when providers fail
- I want consistent error handling

### As an Architect
- I want to avoid vendor lock-in
- I want easy provider switching for cost optimization
- I want centralized AI access controls

### As a DevOps Engineer
- I want unified monitoring across providers
- I want to manage API keys centrally
- I want rate limiting and quota management

### As a Security Engineer
- I want all AI access through a single gateway
- I want to enforce security policies consistently
- I want audit logs for all AI calls

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AI API Gateway                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   App ──▶ [Gateway] ──▶ [Router] ──▶ ┌─────────────┐       │
│              │              │         │   OpenAI   │       │
│              │              │         ├─────────────┤       │
│              ▼              │         │  Anthropic │       │
│       [Governance]          │         ├─────────────┤       │
│       [Observability]       ├────────▶│   Google   │       │
│       [Caching]             │         ├─────────────┤       │
│                             │         │   Custom   │       │
│                             │         └─────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Gateway Features

| Feature | Description |
|---------|-------------|
| Unified API | OpenAI-compatible API for all providers |
| Provider Routing | Route requests to specific providers |
| Automatic Failover | Fall back on provider errors |
| Load Balancing | Distribute across providers |
| Request Transform | Adapt requests per provider |
| Response Normalize | Consistent response format |
| Built-in Governance | All policies apply automatically |

## Database Schema

```sql
-- API Gateway Schema

-- Provider configurations
CREATE TABLE gateway_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Provider info
    provider_name VARCHAR(100) NOT NULL, -- 'openai', 'anthropic', 'google', 'azure', 'custom'
    display_name VARCHAR(255),
    
    -- Connection
    base_url VARCHAR(500),
    api_key_encrypted BYTEA NOT NULL,
    
    -- Models available
    available_models JSONB, -- ['gpt-4', 'gpt-3.5-turbo']
    
    -- Limits
    rate_limit_rpm INTEGER, -- Requests per minute
    rate_limit_tpm INTEGER, -- Tokens per minute
    
    -- Health
    is_healthy BOOLEAN DEFAULT true,
    last_health_check TIMESTAMPTZ,
    health_check_failures INTEGER DEFAULT 0,
    
    -- Priority for routing
    priority INTEGER DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Model mappings (unified model names)
CREATE TABLE gateway_model_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Unified model name (what apps request)
    unified_model VARCHAR(255) NOT NULL, -- e.g., 'default', 'fast', 'powerful'
    
    -- Actual provider models (in priority order)
    provider_models JSONB NOT NULL,
    -- [
    --   {provider_id: '...', model: 'gpt-4-turbo', weight: 0.7},
    --   {provider_id: '...', model: 'claude-3-opus', weight: 0.3}
    -- ]
    
    -- Routing strategy
    routing_strategy VARCHAR(50) DEFAULT 'priority', -- 'priority', 'round_robin', 'weighted', 'latency'
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, unified_model)
);

-- API keys for gateway access
CREATE TABLE gateway_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Key identification
    name VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(20) NOT NULL, -- First few chars for identification
    key_hash VARCHAR(64) NOT NULL, -- SHA-256 of full key
    
    -- Scope
    allowed_models JSONB, -- NULL = all
    allowed_applications JSONB,
    
    -- Limits
    rate_limit_rpm INTEGER,
    monthly_budget DECIMAL(10,2),
    
    -- Tracking
    last_used_at TIMESTAMPTZ,
    total_requests BIGINT DEFAULT 0,
    total_tokens BIGINT DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Routing rules
CREATE TABLE gateway_routing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Condition
    condition JSONB NOT NULL,
    -- {
    --   type: 'header', key: 'X-Priority', value: 'high'
    --   type: 'model', value: 'gpt-4'
    --   type: 'application', value: 'app-123'
    -- }
    
    -- Action
    action JSONB NOT NULL,
    -- {
    --   type: 'route_to_provider', provider_id: '...'
    --   type: 'use_model_mapping', mapping: 'high-priority'
    --   type: 'add_header', key: '...', value: '...'
    -- }
    
    -- Priority
    priority INTEGER DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Failover configuration
CREATE TABLE gateway_failover_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- When to failover
    trigger_conditions JSONB NOT NULL,
    -- {
    --   error_codes: [500, 502, 503],
    --   timeout_ms: 30000,
    --   consecutive_failures: 3
    -- }
    
    -- Failover chain
    failover_chain JSONB NOT NULL,
    -- [
    --   {provider_id: '...', model: '...'},
    --   {provider_id: '...', model: '...'}
    -- ]
    
    -- Behavior
    max_retries INTEGER DEFAULT 2,
    retry_delay_ms INTEGER DEFAULT 1000,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gateway request logs
CREATE TABLE gateway_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Request identification
    request_id VARCHAR(64) NOT NULL,
    api_key_id UUID REFERENCES gateway_api_keys(id),
    
    -- Request details
    requested_model VARCHAR(255),
    actual_provider VARCHAR(100),
    actual_model VARCHAR(255),
    
    -- Routing
    routing_rule_id UUID REFERENCES gateway_routing_rules(id),
    failover_occurred BOOLEAN DEFAULT false,
    failover_attempts INTEGER DEFAULT 0,
    
    -- Metrics
    input_tokens INTEGER,
    output_tokens INTEGER,
    latency_ms INTEGER,
    
    -- Status
    status VARCHAR(20) NOT NULL, -- 'success', 'error', 'timeout'
    error_code VARCHAR(50),
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Provider health history
CREATE TABLE gateway_provider_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES gateway_providers(id),
    
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    is_healthy BOOLEAN NOT NULL,
    latency_ms INTEGER,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_gateway_providers_tenant ON gateway_providers(tenant_id);
CREATE INDEX idx_gateway_model_mappings_tenant ON gateway_model_mappings(tenant_id);
CREATE INDEX idx_gateway_api_keys_tenant ON gateway_api_keys(tenant_id);
CREATE INDEX idx_gateway_api_keys_hash ON gateway_api_keys(key_hash);
CREATE INDEX idx_gateway_routing_rules_tenant ON gateway_routing_rules(tenant_id, priority);
CREATE INDEX idx_gateway_requests_tenant ON gateway_requests(tenant_id, created_at DESC);
CREATE INDEX idx_gateway_requests_api_key ON gateway_requests(api_key_id, created_at DESC);
CREATE INDEX idx_gateway_provider_health ON gateway_provider_health(provider_id, checked_at DESC);
```

## API Endpoints

### Gateway API (for applications)

```
# OpenAI-compatible endpoints
POST   /v1/chat/completions               # Chat completion
POST   /v1/completions                    # Text completion
POST   /v1/embeddings                     # Embeddings
GET    /v1/models                         # List available models
```

### Management API

```
# Providers
GET    /api/gateway/providers             # List providers
POST   /api/gateway/providers             # Add provider
PUT    /api/gateway/providers/:id         # Update provider
DELETE /api/gateway/providers/:id         # Remove provider
POST   /api/gateway/providers/:id/test    # Test provider

# Model Mappings
GET    /api/gateway/mappings              # List mappings
POST   /api/gateway/mappings              # Create mapping
PUT    /api/gateway/mappings/:id          # Update mapping

# API Keys
GET    /api/gateway/keys                  # List API keys
POST   /api/gateway/keys                  # Create key
PUT    /api/gateway/keys/:id              # Update key
DELETE /api/gateway/keys/:id              # Revoke key

# Routing
GET    /api/gateway/routing               # List routing rules
POST   /api/gateway/routing               # Create rule
PUT    /api/gateway/routing/:id           # Update rule

# Health
GET    /api/gateway/health                # Provider health status

# Analytics
GET    /api/gateway/analytics             # Usage analytics
```

## SDK Design

```typescript
// Example SDK usage
import { OpenPeopleAI } from '@open-people/sdk';

const client = new OpenPeopleAI({
  apiKey: 'op_sk_...',
  baseURL: 'https://api.openpeople.ai/v1'
});

// Works like OpenAI SDK
const response = await client.chat.completions.create({
  model: 'default', // Uses your configured default model
  messages: [
    { role: 'user', content: 'Hello!' }
  ]
});

// Or specify provider explicitly
const response = await client.chat.completions.create({
  model: 'anthropic/claude-3-opus',
  messages: [...]
});
```

## UI Components

### Admin Dashboard Pages

1. **Gateway Overview** (`/admin/gateway`)
   - Provider health status
   - Request volume
   - Error rates
   - Latency metrics

2. **Providers** (`/admin/gateway/providers`)
   - Provider list
   - Health status
   - Add/configure providers
   - Test connectivity

3. **Model Mappings** (`/admin/gateway/models`)
   - Unified model configurations
   - Routing strategies
   - Failover chains

4. **API Keys** (`/admin/gateway/keys`)
   - Key management
   - Usage tracking
   - Limits configuration

5. **Routing Rules** (`/admin/gateway/routing`)
   - Rule configuration
   - Priority ordering
   - Testing interface

6. **Analytics** (`/admin/gateway/analytics`)
   - Usage by provider
   - Cost comparison
   - Performance metrics

## Dependencies

- **Existing:** All governance features
- **Related:** Cost Analytics, Performance Monitoring
- **External:** AI provider APIs

## Security Considerations

- API keys encrypted at rest
- Key rotation support
- Request/response not logged by default
- Provider credentials isolated per tenant
- Rate limiting to prevent abuse

## Success Metrics

| Metric | Target |
|--------|--------|
| Gateway availability | 99.99% |
| Added latency | < 50ms p95 |
| Failover success rate | > 99% |
| Developer adoption | > 90% |

## Implementation Notes

### Phase 1: Basic Gateway
- OpenAI-compatible API
- Single provider routing
- API key management

### Phase 2: Multi-Provider
- Multiple provider support
- Model mappings
- Basic failover

### Phase 3: Advanced Routing
- Routing rules
- Load balancing
- Health monitoring

### Phase 4: SDK & DX
- Official SDKs
- Developer documentation
- Migration guides
