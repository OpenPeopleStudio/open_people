# AI Audit Logs

> **Priority:** P0 - Critical  
> **Category:** AI Alignment & Governance  
> **Status:** Planned

## Overview

Immutable, comprehensive logs of all AI interactions across the organization, capturing inputs, outputs, decisions, and access patterns for compliance, debugging, and safety monitoring.

## Problem Statement

Organizations face critical challenges without AI audit logs:
- **Compliance risk:** Cannot demonstrate AI governance to regulators
- **Incident response:** Cannot investigate when AI produces harmful outputs
- **Debugging:** Cannot reproduce issues or understand failures
- **Accountability:** Cannot trace who used AI for what purpose
- **Legal discovery:** Cannot respond to litigation or audits

## User Stories

### As a Compliance Officer
- I want complete records of all AI interactions
- I want to generate audit reports for regulators
- I want to prove our AI systems meet compliance requirements

### As a Security Engineer
- I want to detect anomalous AI usage patterns
- I want to investigate potential misuse or attacks
- I want immutable logs that cannot be tampered with

### As a Developer
- I want to debug AI issues by examining exact inputs/outputs
- I want to understand why the AI behaved a certain way
- I want to reproduce issues in development

### As a Data Protection Officer
- I want to track PII exposure through AI systems
- I want to fulfill data subject access requests
- I want to ensure data retention policies are enforced

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Audit Logging                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Log Collection Layer                     │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │   SDK   │  │   API   │  │ Webhook │              │   │
│  │  │ Hooks   │  │ Gateway │  │ Ingress │              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Immutable  │  │   Search    │  │   Export    │         │
│  │   Storage   │  │   & Query   │  │  & Reports  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Log Entry Structure

Each AI interaction creates a comprehensive log entry:

```typescript
interface AIAuditLog {
  // Identification
  id: string;
  traceId: string;           // Correlate related logs
  spanId: string;            // For distributed tracing
  
  // Context
  tenantId: string;
  userId: string;
  applicationId: string;
  environment: string;
  
  // Request
  timestamp: Date;
  model: string;
  provider: string;
  promptId?: string;         // If using managed prompts
  promptVersion?: number;
  
  // Input (potentially redacted)
  systemPrompt: string;
  userMessages: Message[];
  inputTokens: number;
  
  // Output
  assistantResponse: string;
  outputTokens: number;
  finishReason: string;
  
  // Performance
  latencyMs: number;
  
  // Safety & Quality
  contentFlags: ContentFlag[];  // Moderation results
  piiDetected: PIIType[];
  qualityScore?: number;
  
  // Metadata
  clientIp: string;
  userAgent: string;
  customMetadata: Record<string, any>;
}
```

### Components

1. **Log Collector** - Captures logs from all AI touchpoints
2. **Immutable Store** - Append-only storage with integrity verification
3. **Search Engine** - Full-text and structured search
4. **Retention Manager** - Automated retention and archival
5. **Export Engine** - Generate compliance reports
6. **Alerting** - Real-time alerts for suspicious patterns

## Database Schema

```sql
-- AI Audit Logs Schema
-- Using partitioned table for performance at scale

CREATE TABLE ai_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Tracing
    trace_id VARCHAR(64) NOT NULL,
    span_id VARCHAR(32),
    parent_span_id VARCHAR(32),
    
    -- Context
    user_id UUID,
    application_id VARCHAR(255),
    environment VARCHAR(50) NOT NULL,
    session_id VARCHAR(255),
    
    -- Request details
    request_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    model_provider VARCHAR(100) NOT NULL,
    model_name VARCHAR(255) NOT NULL,
    model_version VARCHAR(50),
    
    -- Prompt tracking
    prompt_id UUID,
    prompt_version INTEGER,
    
    -- Input (stored with optional redaction)
    system_prompt TEXT,
    user_input TEXT NOT NULL,
    input_messages JSONB, -- Full message array
    input_tokens INTEGER,
    input_hash VARCHAR(64), -- SHA-256 for deduplication
    
    -- Output
    assistant_output TEXT,
    output_tokens INTEGER,
    finish_reason VARCHAR(50), -- 'stop', 'length', 'content_filter', etc.
    tool_calls JSONB, -- Function/tool calls if any
    
    -- Performance
    latency_ms INTEGER,
    time_to_first_token_ms INTEGER,
    
    -- Safety signals
    content_flags JSONB DEFAULT '[]', -- [{type, severity, detail}]
    pii_detected JSONB DEFAULT '[]', -- [{type, location, redacted}]
    moderation_scores JSONB, -- Provider moderation scores
    
    -- Quality signals
    quality_score DECIMAL(3,2),
    feedback_rating INTEGER, -- User feedback if provided
    
    -- Error handling
    error_occurred BOOLEAN DEFAULT false,
    error_type VARCHAR(100),
    error_message TEXT,
    
    -- Client info
    client_ip INET,
    user_agent TEXT,
    
    -- Custom metadata
    metadata JSONB DEFAULT '{}',
    
    -- Integrity
    log_hash VARCHAR(64), -- Hash of entire log entry
    previous_hash VARCHAR(64), -- Chain integrity
    
    -- Indexing timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (request_timestamp);

-- Create monthly partitions (example)
CREATE TABLE ai_audit_logs_2026_01 PARTITION OF ai_audit_logs
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Log integrity chain (for immutability verification)
CREATE TABLE ai_audit_log_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    checkpoint_timestamp TIMESTAMPTZ NOT NULL,
    first_log_id UUID NOT NULL,
    last_log_id UUID NOT NULL,
    log_count BIGINT NOT NULL,
    
    -- Merkle root of all logs in range
    merkle_root VARCHAR(64) NOT NULL,
    
    -- Signed by system
    signature TEXT NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search index table (denormalized for fast queries)
CREATE TABLE ai_audit_log_search (
    log_id UUID PRIMARY KEY REFERENCES ai_audit_logs(id),
    tenant_id UUID NOT NULL,
    
    -- Searchable fields
    search_text TSVECTOR,
    
    -- Facets
    has_pii BOOLEAN DEFAULT false,
    has_content_flags BOOLEAN DEFAULT false,
    has_errors BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data retention policies
CREATE TABLE ai_audit_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    policy_name VARCHAR(255) NOT NULL,
    
    -- What to retain
    retention_days INTEGER NOT NULL,
    
    -- Conditions
    environment VARCHAR(50), -- NULL = all environments
    application_id VARCHAR(255), -- NULL = all applications
    has_pii BOOLEAN, -- NULL = both
    
    -- Actions
    action VARCHAR(50) NOT NULL, -- 'delete', 'archive', 'anonymize'
    archive_location VARCHAR(500), -- S3 path if archiving
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_audit_logs_tenant_time ON ai_audit_logs(tenant_id, request_timestamp DESC);
CREATE INDEX idx_ai_audit_logs_trace ON ai_audit_logs(trace_id);
CREATE INDEX idx_ai_audit_logs_user ON ai_audit_logs(tenant_id, user_id, request_timestamp DESC);
CREATE INDEX idx_ai_audit_logs_app ON ai_audit_logs(tenant_id, application_id, request_timestamp DESC);
CREATE INDEX idx_ai_audit_logs_model ON ai_audit_logs(model_provider, model_name);
CREATE INDEX idx_ai_audit_logs_errors ON ai_audit_logs(tenant_id, request_timestamp DESC) WHERE error_occurred = true;
CREATE INDEX idx_ai_audit_logs_flags ON ai_audit_logs(tenant_id, request_timestamp DESC) WHERE content_flags != '[]';

-- Full-text search index
CREATE INDEX idx_ai_audit_log_search_text ON ai_audit_log_search USING GIN(search_text);
```

## API Endpoints

```
# Query Logs
GET    /api/ai/audit-logs                 # List/search logs
GET    /api/ai/audit-logs/:id             # Get single log
GET    /api/ai/audit-logs/trace/:traceId  # Get all logs in trace

# Aggregations
GET    /api/ai/audit-logs/stats           # Usage statistics
GET    /api/ai/audit-logs/timeline        # Time-series data

# Export
POST   /api/ai/audit-logs/export          # Export logs to file
GET    /api/ai/audit-logs/exports/:id     # Download export

# Integrity
GET    /api/ai/audit-logs/verify/:id      # Verify log integrity
GET    /api/ai/audit-logs/checkpoints     # List integrity checkpoints

# Retention
GET    /api/ai/audit-logs/retention       # List retention policies
POST   /api/ai/audit-logs/retention       # Create policy
PUT    /api/ai/audit-logs/retention/:id   # Update policy

# Ingestion (internal)
POST   /api/ai/audit-logs/ingest          # Batch log ingestion
```

## UI Components

### Admin Dashboard Pages

1. **Audit Log Explorer** (`/admin/ai/audit-logs`)
   - Time range selector
   - Advanced search with filters
   - Results table with expandable rows
   - Quick filters: errors, PII, content flags

2. **Log Detail View** (`/admin/ai/audit-logs/:id`)
   - Full log entry display
   - Input/output visualization
   - Related logs (same trace)
   - Integrity verification status

3. **Analytics Dashboard** (`/admin/ai/audit-logs/analytics`)
   - Usage over time charts
   - Model usage breakdown
   - Error rate trends
   - PII detection trends

4. **Export Center** (`/admin/ai/audit-logs/exports`)
   - Create new export
   - Export history
   - Download completed exports

5. **Retention Policies** (`/admin/ai/audit-logs/retention`)
   - Policy list
   - Create/edit policies
   - Retention preview

## Dependencies

- **Existing:** Tenant system, User authentication
- **Related:** Content Moderation (for content flags), PII Detection
- **External:** 
  - Object storage for archives (S3/R2)
  - Optional: Dedicated search (Elasticsearch/OpenSearch)

## Security Considerations

- Logs are append-only; no updates or deletes through normal API
- Cryptographic integrity chain prevents tampering
- Role-based access to view logs
- PII redaction options for export
- Encryption at rest
- Audit log access is itself logged

## Success Metrics

| Metric | Target |
|--------|--------|
| Log capture rate | 100% of AI interactions |
| Log ingestion latency | < 100ms p99 |
| Search query latency | < 500ms p95 |
| Integrity verification | 100% pass rate |
| Retention compliance | 100% policy adherence |

## Implementation Notes

### Phase 1: Core Logging
- Log ingestion pipeline
- Basic storage and querying
- Simple search interface

### Phase 2: Integrity & Compliance
- Cryptographic integrity chain
- Retention policies
- Export functionality

### Phase 3: Advanced Analytics
- Full-text search
- Anomaly detection
- Real-time alerting
