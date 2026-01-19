# PII Detection & Redaction

> **Priority:** P0 - Critical  
> **Category:** Safety & Compliance  
> **Status:** Planned

## Overview

Automatic identification and masking of Personally Identifiable Information (PII) in AI inputs and outputs, ensuring sensitive data is protected throughout the AI pipeline.

## Problem Statement

PII flows through AI systems in dangerous ways:
- Users inadvertently share sensitive information in prompts
- AI may generate responses containing PII
- Logs and analytics may capture unredacted PII
- Third-party AI providers may process/store PII inappropriately

Organizations face compliance requirements (GDPR, CCPA, HIPAA) that mandate PII protection.

## User Stories

### As a Data Protection Officer
- I want all PII automatically detected and redacted
- I want visibility into what PII flows through AI systems
- I want to demonstrate compliance with data protection laws

### As a Developer
- I want PII redaction built into the AI pipeline
- I want to use synthetic data when testing
- I want clear APIs for handling PII

### As a Security Engineer
- I want to prevent PII from reaching third-party AI providers
- I want alerts when unusual PII volumes are detected
- I want audit trails of PII handling

### As a Compliance Officer
- I want to respond to data subject access requests
- I want to enforce data minimization principles
- I want to track PII exposure across systems

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PII Detection & Redaction                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Input ──▶ [PII Scanner] ──▶ [Redactor] ──▶ Clean Input    │
│                  │                                           │
│                  ▼                                           │
│   ┌──────────────────────────────────────────────────────┐  │
│   │              Detection Engine                         │  │
│   │  ┌─────────┐  ┌─────────┐  ┌─────────┐             │  │
│   │  │  Regex  │  │   NER   │  │ Pattern │             │  │
│   │  │ Patterns│  │  Model  │  │  Match  │             │  │
│   │  └─────────┘  └─────────┘  └─────────┘             │  │
│   │  ┌─────────┐  ┌─────────┐  ┌─────────┐             │  │
│   │  │Checksum │  │ Context │  │ Custom  │             │  │
│   │  │  Valid  │  │ Analysis│  │  Rules  │             │  │
│   │  └─────────┘  └─────────┘  └─────────┘             │  │
│   └──────────────────────────────────────────────────────┘  │
│                              │                               │
│                              ▼                               │
│                    ┌──────────────────┐                     │
│                    │ Redaction Engine │                     │
│                    │  Mask / Replace  │                     │
│                    │  Tokenize / Hash │                     │
│                    └──────────────────┘                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### PII Categories

| Category | Examples | Detection Method |
|----------|----------|------------------|
| Names | John Smith, 山田太郎 | NER model |
| Email | john@example.com | Regex + validation |
| Phone | +1-555-123-4567 | Regex + format |
| SSN | 123-45-6789 | Regex + checksum |
| Credit Card | 4111-1111-1111-1111 | Regex + Luhn |
| Address | 123 Main St, Apt 4 | NER + pattern |
| Date of Birth | 1990-01-15 | Context analysis |
| IP Address | 192.168.1.1 | Regex |
| Medical | MRN, diagnosis codes | Domain patterns |
| Financial | Account numbers, routing | Regex + checksum |

### Redaction Strategies

1. **Masking** - Replace with asterisks: `John → ****`
2. **Type Replacement** - Replace with type: `John → [NAME]`
3. **Tokenization** - Replace with reversible token: `John → TKN_a1b2c3`
4. **Synthetic** - Replace with fake data: `John → Michael`
5. **Hash** - Replace with hash: `John → h7x9k2m`

## Database Schema

```sql
-- PII Detection & Redaction Schema

-- PII detection configuration
CREATE TABLE pii_detection_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Detection settings
    enabled_categories JSONB NOT NULL, -- ['email', 'phone', 'ssn', ...]
    confidence_threshold DECIMAL(3,2) DEFAULT 0.85,
    
    -- Redaction settings
    default_strategy VARCHAR(50) DEFAULT 'type_replacement', -- 'mask', 'type_replacement', 'tokenize', 'synthetic', 'hash'
    category_strategies JSONB, -- {email: 'mask', name: 'synthetic', ...}
    
    -- Scope
    scan_inputs BOOLEAN DEFAULT true,
    scan_outputs BOOLEAN DEFAULT true,
    scan_logs BOOLEAN DEFAULT true,
    
    -- Exclusions
    excluded_applications JSONB DEFAULT '[]',
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id)
);

-- Custom PII patterns
CREATE TABLE pii_custom_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Pattern definition
    pattern_type VARCHAR(50) NOT NULL, -- 'regex', 'keyword', 'checksum'
    pattern TEXT NOT NULL,
    
    -- Categorization
    category VARCHAR(100) NOT NULL,
    
    -- Validation
    checksum_algorithm VARCHAR(50), -- 'luhn', 'mod10', 'custom'
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PII detection results
CREATE TABLE pii_detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Source
    audit_log_id UUID REFERENCES ai_audit_logs(id),
    content_type VARCHAR(20) NOT NULL, -- 'input', 'output', 'log'
    
    -- Overall result
    pii_found BOOLEAN NOT NULL,
    categories_found JSONB DEFAULT '[]', -- ['email', 'phone']
    
    -- Performance
    scan_latency_ms INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual PII entities detected
CREATE TABLE pii_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    detection_id UUID NOT NULL REFERENCES pii_detections(id) ON DELETE CASCADE,
    
    -- Entity details
    category VARCHAR(100) NOT NULL,
    original_value TEXT, -- Only stored if configured (encrypted)
    redacted_value TEXT NOT NULL, -- What was replaced with
    
    -- Position
    start_position INTEGER,
    end_position INTEGER,
    
    -- Confidence
    confidence DECIMAL(3,2) NOT NULL,
    detection_method VARCHAR(50), -- 'regex', 'ner', 'custom'
    
    -- Redaction
    redaction_strategy VARCHAR(50) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tokenization mapping (for reversible redaction)
CREATE TABLE pii_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    token VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    
    -- Encrypted original value
    encrypted_value BYTEA NOT NULL,
    
    -- Usage tracking
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    usage_count INTEGER DEFAULT 1,
    
    -- Expiry
    expires_at TIMESTAMPTZ,
    
    UNIQUE(tenant_id, token)
);

-- Data subject access requests (DSAR)
CREATE TABLE pii_access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Request details
    request_type VARCHAR(50) NOT NULL, -- 'access', 'deletion', 'export', 'rectification'
    subject_identifier VARCHAR(255) NOT NULL, -- Email, user ID, etc.
    identifier_type VARCHAR(50) NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'rejected'
    
    -- Processing
    processed_by UUID REFERENCES users(id),
    processed_at TIMESTAMPTZ,
    result_summary TEXT,
    
    -- For exports
    export_file_url VARCHAR(500),
    export_expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aggregated PII metrics
CREATE TABLE pii_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Scope
    application_id VARCHAR(255),
    
    -- Time bucket
    bucket_timestamp TIMESTAMPTZ NOT NULL,
    bucket_interval VARCHAR(20) NOT NULL,
    
    -- Counts
    total_scanned INTEGER NOT NULL,
    total_with_pii INTEGER NOT NULL,
    total_entities INTEGER NOT NULL,
    
    -- By category
    category_counts JSONB, -- {email: 50, phone: 30, ...}
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pii_detections_tenant ON pii_detections(tenant_id, created_at DESC);
CREATE INDEX idx_pii_detections_audit ON pii_detections(audit_log_id);
CREATE INDEX idx_pii_detections_found ON pii_detections(tenant_id, created_at DESC) WHERE pii_found = true;
CREATE INDEX idx_pii_entities_detection ON pii_entities(detection_id);
CREATE INDEX idx_pii_entities_category ON pii_entities(category);
CREATE INDEX idx_pii_tokens_tenant ON pii_tokens(tenant_id);
CREATE INDEX idx_pii_tokens_lookup ON pii_tokens(tenant_id, token);
CREATE INDEX idx_pii_access_requests_tenant ON pii_access_requests(tenant_id, created_at DESC);
CREATE INDEX idx_pii_metrics_tenant ON pii_metrics(tenant_id, bucket_timestamp DESC);
```

## API Endpoints

```
# Configuration
GET    /api/ai/pii/config                 # Get configuration
PUT    /api/ai/pii/config                 # Update configuration

# Custom Patterns
GET    /api/ai/pii/patterns               # List custom patterns
POST   /api/ai/pii/patterns               # Create pattern
PUT    /api/ai/pii/patterns/:id           # Update pattern
DELETE /api/ai/pii/patterns/:id           # Delete pattern

# Detection (real-time)
POST   /api/ai/pii/scan                   # Scan text for PII
POST   /api/ai/pii/redact                 # Scan and redact

# Results
GET    /api/ai/pii/detections             # List detections
GET    /api/ai/pii/detections/:id         # Get detection detail

# Tokenization
POST   /api/ai/pii/tokens/resolve         # Resolve token to original
POST   /api/ai/pii/tokens/expire          # Expire tokens

# Data Subject Requests
GET    /api/ai/pii/requests               # List access requests
POST   /api/ai/pii/requests               # Create request
PUT    /api/ai/pii/requests/:id           # Process request
GET    /api/ai/pii/requests/:id/export    # Download export

# Metrics
GET    /api/ai/pii/metrics                # Get metrics
GET    /api/ai/pii/dashboard              # Dashboard data
```

## UI Components

### Admin Dashboard Pages

1. **PII Dashboard** (`/admin/ai/pii`)
   - PII detection rate
   - Category breakdown
   - Trend charts
   - Recent high-volume detections

2. **Configuration** (`/admin/ai/pii/config`)
   - Enable/disable categories
   - Threshold settings
   - Redaction strategy per category
   - Custom patterns

3. **Detection Explorer** (`/admin/ai/pii/detections`)
   - Search/filter detections
   - View detected entities
   - Export for analysis

4. **Access Requests** (`/admin/ai/pii/requests`)
   - Pending requests queue
   - Process requests
   - Request history

5. **Analytics** (`/admin/ai/pii/analytics`)
   - PII exposure trends
   - By application breakdown
   - Category distribution
   - Source analysis (input vs output)

## Dependencies

- **Existing:** AI Audit Logs
- **Related:** Content Moderation, Compliance Dashboards
- **External:**
  - NER model (spaCy, Presidio, cloud NER)
  - Encryption service for token storage

## Security Considerations

- Original PII values encrypted at rest
- Access to PII requires special permissions
- Token resolution audit logged
- Automatic token expiry
- Secure key management
- No PII in application logs

## Success Metrics

| Metric | Target |
|--------|--------|
| PII detection recall | > 95% |
| False positive rate | < 10% |
| Detection latency | < 100ms p95 |
| DSAR response time | < 30 days |

## Implementation Notes

### Phase 1: Core Detection
- Regex patterns for common PII
- Basic NER integration
- Simple masking redaction

### Phase 2: Advanced Detection
- Context-aware detection
- Custom patterns
- Checksum validation
- Multiple redaction strategies

### Phase 3: Compliance
- Tokenization with reversibility
- DSAR workflow
- Audit reporting

### Phase 4: Intelligence
- ML-based detection improvement
- Anomaly detection
- Automated data mapping
