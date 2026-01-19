# Hallucination Detection

> **Priority:** P1 - High  
> **Category:** AI Alignment & Governance  
> **Status:** Planned

## Overview

Automated fact-checking and grounding verification for LLM outputs, detecting when AI generates false, unverifiable, or inconsistent information.

## Problem Statement

Large Language Models frequently hallucinate:
- Fabricating facts, statistics, and citations
- Inventing non-existent people, products, or events
- Contradicting provided context or documents
- Generating plausible-sounding but incorrect information

Without detection, hallucinations erode user trust and can cause real harm in high-stakes applications.

## User Stories

### As a Product Manager
- I want to know how often our AI hallucinates
- I want to flag high-risk responses before they reach users
- I want to reduce hallucination rates over time

### As a User of AI-Powered Tools
- I want to know when AI responses may be unreliable
- I want citations or sources for factual claims
- I want warnings when AI is uncertain

### As a Developer
- I want to test my prompts for hallucination rates
- I want to understand which topics trigger more hallucinations
- I want automated tests for factual accuracy

### As a Compliance Officer
- I want audit trails of hallucination detection
- I want evidence of grounding requirements
- I want metrics for regulatory reporting

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Hallucination Detection                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Detection Methods                        │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │ Context │  │ Self-   │  │External │              │   │
│  │  │ Ground. │  │Consist. │  │ Verify  │              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Claim     │  │   Source    │  │   Scoring   │         │
│  │ Extraction  │  │  Retrieval  │  │   Engine    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Detection Methods

1. **Context Grounding**
   - Verify claims against provided documents/context
   - Check if response is supported by RAG sources
   - Identify unsupported assertions

2. **Self-Consistency**
   - Generate multiple responses to same prompt
   - Check for contradictions across responses
   - Low consistency = higher hallucination risk

3. **External Verification**
   - Check claims against knowledge bases
   - Verify citations actually exist
   - Cross-reference with trusted sources

4. **Uncertainty Quantification**
   - Analyze token probabilities
   - Detect low-confidence generations
   - Identify hedging language

5. **Semantic Entailment**
   - Check if claims logically follow from sources
   - Detect subtle misrepresentations
   - Identify scope creep beyond source material

## Database Schema

```sql
-- Hallucination Detection Schema

-- Configuration for hallucination detection
CREATE TABLE hallucination_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Detection settings
    detection_methods JSONB NOT NULL, -- ['context_grounding', 'self_consistency', ...]
    
    -- Thresholds
    confidence_threshold DECIMAL(3,2) DEFAULT 0.7, -- Below this = potential hallucination
    consistency_threshold DECIMAL(3,2) DEFAULT 0.8,
    
    -- Actions
    block_on_hallucination BOOLEAN DEFAULT false,
    require_citations BOOLEAN DEFAULT false,
    
    -- Scope
    application_ids JSONB, -- NULL = all applications
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual hallucination detection results
CREATE TABLE hallucination_detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Source
    audit_log_id UUID REFERENCES ai_audit_logs(id),
    
    -- Overall assessment
    hallucination_score DECIMAL(3,2) NOT NULL, -- 0 = fully grounded, 1 = complete hallucination
    confidence DECIMAL(3,2) NOT NULL,
    
    -- Detection method results
    method_results JSONB NOT NULL, -- {method: {score, details}}
    
    -- Status
    is_hallucination BOOLEAN NOT NULL,
    severity VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    
    -- Action taken
    action_taken VARCHAR(50), -- 'none', 'flagged', 'blocked', 'modified'
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extracted claims from AI outputs
CREATE TABLE hallucination_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    detection_id UUID NOT NULL REFERENCES hallucination_detections(id) ON DELETE CASCADE,
    
    -- Claim content
    claim_text TEXT NOT NULL,
    claim_type VARCHAR(50), -- 'factual', 'citation', 'statistic', 'attribution', etc.
    
    -- Position in output
    start_position INTEGER,
    end_position INTEGER,
    
    -- Verification result
    verification_status VARCHAR(20) NOT NULL, -- 'verified', 'unverified', 'false', 'partially_true'
    verification_score DECIMAL(3,2),
    
    -- Evidence
    supporting_sources JSONB DEFAULT '[]', -- [{source, relevance_score, quote}]
    contradicting_sources JSONB DEFAULT '[]',
    
    -- Details
    verification_details TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Citation verification
CREATE TABLE citation_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES hallucination_claims(id) ON DELETE CASCADE,
    
    -- Citation details
    cited_source TEXT NOT NULL, -- What the AI claimed as source
    cited_author VARCHAR(255),
    cited_date VARCHAR(100),
    cited_url VARCHAR(500),
    
    -- Verification
    source_exists BOOLEAN,
    content_matches BOOLEAN,
    author_matches BOOLEAN,
    
    -- If found
    actual_source_url VARCHAR(500),
    actual_content_excerpt TEXT,
    
    verification_method VARCHAR(50), -- 'web_search', 'database', 'manual'
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Self-consistency check results
CREATE TABLE consistency_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    detection_id UUID NOT NULL REFERENCES hallucination_detections(id) ON DELETE CASCADE,
    
    -- Multiple generations
    generation_count INTEGER NOT NULL,
    generations JSONB NOT NULL, -- [{response, claims}]
    
    -- Consistency analysis
    consistency_score DECIMAL(3,2) NOT NULL,
    contradictions JSONB DEFAULT '[]', -- [{claim_a, claim_b, type}]
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aggregated metrics
CREATE TABLE hallucination_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Scope
    application_id VARCHAR(255),
    model_id UUID,
    prompt_id UUID,
    
    -- Time bucket
    bucket_timestamp TIMESTAMPTZ NOT NULL,
    bucket_interval VARCHAR(20) NOT NULL, -- 'hour', 'day', 'week'
    
    -- Metrics
    total_responses INTEGER NOT NULL,
    hallucination_count INTEGER NOT NULL,
    hallucination_rate DECIMAL(5,4),
    
    avg_hallucination_score DECIMAL(3,2),
    avg_confidence DECIMAL(3,2),
    
    -- By severity
    severity_distribution JSONB, -- {low: n, medium: n, high: n, critical: n}
    
    -- By type
    claim_type_distribution JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_hallucination_detections_tenant ON hallucination_detections(tenant_id, created_at DESC);
CREATE INDEX idx_hallucination_detections_audit ON hallucination_detections(audit_log_id);
CREATE INDEX idx_hallucination_detections_score ON hallucination_detections(hallucination_score DESC);
CREATE INDEX idx_hallucination_claims_detection ON hallucination_claims(detection_id);
CREATE INDEX idx_hallucination_claims_status ON hallucination_claims(verification_status);
CREATE INDEX idx_hallucination_metrics_tenant ON hallucination_metrics(tenant_id, bucket_timestamp DESC);
```

## API Endpoints

```
# Configuration
GET    /api/ai/hallucination/config       # Get configuration
PUT    /api/ai/hallucination/config       # Update configuration

# Detection (real-time)
POST   /api/ai/hallucination/check        # Check single response
POST   /api/ai/hallucination/batch        # Batch check

# Results
GET    /api/ai/hallucination/detections   # List detections
GET    /api/ai/hallucination/detections/:id # Get detection details
GET    /api/ai/hallucination/claims/:id   # Get claim details

# Analytics
GET    /api/ai/hallucination/metrics      # Aggregated metrics
GET    /api/ai/hallucination/trends       # Time-series trends
GET    /api/ai/hallucination/by-topic     # Breakdown by topic/domain

# Testing
POST   /api/ai/hallucination/test-prompt  # Test a prompt for hallucination rate
```

## UI Components

### Admin Dashboard Pages

1. **Hallucination Dashboard** (`/admin/ai/hallucination`)
   - Overall hallucination rate
   - Trend charts
   - Recent high-severity detections
   - Top hallucinating prompts/applications

2. **Detection Detail** (`/admin/ai/hallucination/:id`)
   - Original input/output
   - Claim-by-claim analysis
   - Evidence for each claim
   - Method-specific results

3. **Claim Explorer** (`/admin/ai/hallucination/claims`)
   - Browse all extracted claims
   - Filter by verification status
   - Citation verification details

4. **Analytics** (`/admin/ai/hallucination/analytics`)
   - Hallucination rate over time
   - By model comparison
   - By prompt comparison
   - Topic/domain breakdown

5. **Configuration** (`/admin/ai/hallucination/config`)
   - Detection method settings
   - Threshold configuration
   - Action rules

## Dependencies

- **Existing:** AI Audit Logs (as data source)
- **Related:** Quality Scoring, Content Moderation
- **External:**
  - NLI (Natural Language Inference) models
  - Web search API for citation verification
  - Knowledge bases (optional)

## Security Considerations

- External verification calls may leak data
- Rate limiting for verification APIs
- Cache verification results
- Option for fully local verification

## Success Metrics

| Metric | Target |
|--------|--------|
| Detection accuracy (F1) | > 0.85 |
| False positive rate | < 15% |
| Detection latency | < 2 seconds |
| Hallucination rate reduction | 30% in 3 months |

## Implementation Notes

### Phase 1: Context Grounding
- Verify against provided context/documents
- Basic claim extraction
- Simple scoring

### Phase 2: Self-Consistency
- Multiple generation sampling
- Contradiction detection
- Uncertainty estimation

### Phase 3: External Verification
- Citation verification
- Web search integration
- Knowledge base integration

### Phase 4: Advanced
- Fine-tuned detection models
- Real-time blocking
- Automatic prompt improvement suggestions
