# Quality Scoring

> **Priority:** P1 - High  
> **Category:** Monitoring & Observability  
> **Status:** Implemented

## Overview

Automated evaluation of AI output quality across multiple dimensions (relevance, coherence, accuracy, safety), providing continuous quality metrics without human review.

## Problem Statement

Assessing AI quality at scale is challenging:
- Human review doesn't scale
- Quality issues go undetected until users complain
- No objective metrics for AI output quality
- Difficult to compare quality across models/prompts
- Quality regression detection is manual

## User Stories

### As a Product Manager
- I want to know the quality of AI outputs in my product
- I want to track quality trends over time
- I want to compare quality across different AI configurations

### As an ML Engineer
- I want automated quality metrics for my models
- I want to detect quality regressions quickly
- I want to understand which dimensions need improvement

### As a QA Engineer
- I want continuous quality monitoring
- I want alerts when quality drops
- I want to identify low-quality outputs for review

### As a Developer
- I want to test prompt changes impact on quality
- I want quality benchmarks for my AI features
- I want to optimize for specific quality dimensions

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Quality Scoring                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Quality Dimensions                       │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │Relevance│  │Coherence│  │ Safety  │              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │Accuracy │  │Complete-│  │ Format  │              │   │
│  │  │         │  │  ness   │  │         │              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Scorer    │  │  Aggregator │  │   Monitor   │         │
│  │   Engine    │  │             │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Quality Dimensions

| Dimension | What It Measures | Scoring Method |
|-----------|-----------------|----------------|
| Relevance | Answer addresses the query | Semantic similarity |
| Coherence | Logical flow, readability | Language model score |
| Completeness | Answer is thorough | Coverage analysis |
| Accuracy | Factual correctness | Fact verification |
| Safety | No harmful content | Content moderation |
| Format | Matches expected structure | Format validation |
| Helpfulness | Actionable, useful | Heuristics + LLM |
| Conciseness | Not unnecessarily verbose | Length analysis |

### Components

1. **Scoring Engine** - Calculate quality scores per dimension
2. **Scorer Registry** - Pluggable scoring methods
3. **Aggregator** - Combine dimension scores
4. **Monitor** - Track scores over time
5. **Alert System** - Quality degradation alerts
6. **Benchmark System** - Quality benchmarking

## Database Schema

```sql
-- Quality Scoring Schema

-- Scoring configurations
CREATE TABLE quality_score_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(255) NOT NULL,
    
    -- Scope
    application_ids JSONB, -- NULL = all
    
    -- Dimensions to score
    dimensions JSONB NOT NULL,
    -- [
    --   {name: 'relevance', weight: 0.3, scorer: 'semantic_similarity'},
    --   {name: 'coherence', weight: 0.2, scorer: 'lm_perplexity'},
    --   ...
    -- ]
    
    -- Aggregation
    aggregation_method VARCHAR(50) DEFAULT 'weighted_average',
    
    -- Sampling (not every request needs scoring)
    sample_rate DECIMAL(3,2) DEFAULT 1.0, -- 1.0 = score all, 0.1 = 10%
    
    -- Alerts
    quality_threshold DECIMAL(3,2) DEFAULT 0.7,
    alert_on_low_quality BOOLEAN DEFAULT true,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scorer definitions
CREATE TABLE quality_scorers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Scorer type
    scorer_type VARCHAR(50) NOT NULL, -- 'heuristic', 'model', 'llm', 'external'
    
    -- Configuration
    config JSONB,
    -- For model: {model_name, endpoint}
    -- For llm: {prompt_template, model}
    -- For external: {api_endpoint, api_key_ref}
    
    -- Output
    output_range JSONB DEFAULT '{"min": 0, "max": 1}',
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quality scores (per request)
CREATE TABLE quality_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    config_id UUID REFERENCES quality_score_configs(id),
    
    -- Source
    audit_log_id UUID REFERENCES ai_audit_logs(id),
    
    -- Context
    application_id VARCHAR(255),
    model_name VARCHAR(255),
    prompt_id UUID,
    
    -- Overall score
    overall_score DECIMAL(3,2) NOT NULL,
    
    -- Dimension scores
    dimension_scores JSONB NOT NULL,
    -- {
    --   relevance: {score: 0.85, confidence: 0.9},
    --   coherence: {score: 0.92, confidence: 0.95},
    --   ...
    -- }
    
    -- Flags
    low_quality_flag BOOLEAN DEFAULT false,
    flagged_dimensions JSONB DEFAULT '[]',
    
    -- Scoring metadata
    scoring_latency_ms INTEGER,
    
    scored_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quality benchmarks
CREATE TABLE quality_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Scope
    application_id VARCHAR(255),
    model_name VARCHAR(255),
    prompt_id UUID,
    
    -- Benchmark data
    test_cases JSONB NOT NULL,
    -- [
    --   {
    --     input: "...",
    --     context: {...},
    --     expected_quality: {relevance: 0.9, coherence: 0.85, ...},
    --     reference_output: "..." (optional)
    --   }
    -- ]
    
    -- Last run
    last_run_at TIMESTAMPTZ,
    last_run_score DECIMAL(3,2),
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Benchmark runs
CREATE TABLE quality_benchmark_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benchmark_id UUID NOT NULL REFERENCES quality_benchmarks(id) ON DELETE CASCADE,
    
    run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Configuration used
    model_name VARCHAR(255),
    prompt_version INTEGER,
    
    -- Results
    overall_score DECIMAL(3,2) NOT NULL,
    dimension_scores JSONB NOT NULL,
    
    -- Per test case results
    test_results JSONB NOT NULL,
    -- [{test_idx, passed, scores, actual_output}]
    
    -- Comparison
    previous_run_id UUID REFERENCES quality_benchmark_runs(id),
    score_delta DECIMAL(4,3),
    
    created_by UUID REFERENCES users(id)
);

-- Quality feedback (human labels for calibration)
CREATE TABLE quality_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    score_id UUID NOT NULL REFERENCES quality_scores(id),
    
    -- Reviewer
    reviewer_id UUID REFERENCES users(id),
    
    -- Human scores
    human_overall_score DECIMAL(3,2),
    human_dimension_scores JSONB,
    
    -- Feedback
    feedback_text TEXT,
    
    -- Agreement
    agrees_with_auto BOOLEAN,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aggregated quality metrics
CREATE TABLE quality_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Dimensions
    application_id VARCHAR(255),
    model_name VARCHAR(255),
    prompt_id UUID,
    
    -- Time bucket
    bucket_timestamp TIMESTAMPTZ NOT NULL,
    bucket_interval VARCHAR(20) NOT NULL,
    
    -- Aggregated scores
    sample_count INTEGER NOT NULL,
    
    avg_overall_score DECIMAL(3,2),
    p25_overall_score DECIMAL(3,2),
    p50_overall_score DECIMAL(3,2),
    p75_overall_score DECIMAL(3,2),
    
    -- Per dimension averages
    dimension_averages JSONB,
    -- {relevance: 0.85, coherence: 0.88, ...}
    
    -- Quality distribution
    score_distribution JSONB,
    -- {excellent: 40, good: 35, fair: 20, poor: 5}
    
    -- Low quality count
    low_quality_count INTEGER,
    low_quality_rate DECIMAL(5,4),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quality alerts
CREATE TABLE quality_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Alert details
    alert_type VARCHAR(50) NOT NULL, -- 'low_quality', 'quality_drop', 'dimension_drop'
    severity VARCHAR(20) NOT NULL,
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Context
    application_id VARCHAR(255),
    model_name VARCHAR(255),
    
    -- Trigger details
    trigger_value DECIMAL(3,2),
    threshold_value DECIMAL(3,2),
    
    -- Related scores
    sample_score_ids JSONB, -- Example low-quality scores
    
    -- Status
    status VARCHAR(20) DEFAULT 'open',
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_quality_score_configs_tenant ON quality_score_configs(tenant_id);
CREATE INDEX idx_quality_scores_tenant ON quality_scores(tenant_id, scored_at DESC);
CREATE INDEX idx_quality_scores_audit ON quality_scores(audit_log_id);
CREATE INDEX idx_quality_scores_app ON quality_scores(application_id, scored_at DESC);
CREATE INDEX idx_quality_scores_low ON quality_scores(tenant_id, scored_at DESC) WHERE low_quality_flag = true;
CREATE INDEX idx_quality_benchmarks_tenant ON quality_benchmarks(tenant_id);
CREATE INDEX idx_quality_benchmark_runs ON quality_benchmark_runs(benchmark_id, run_at DESC);
CREATE INDEX idx_quality_feedback_score ON quality_feedback(score_id);
CREATE INDEX idx_quality_metrics_tenant ON quality_metrics(tenant_id, bucket_timestamp DESC);
CREATE INDEX idx_quality_alerts_tenant ON quality_alerts(tenant_id, created_at DESC);
CREATE INDEX idx_quality_alerts_status ON quality_alerts(status) WHERE status = 'open';
```

## API Endpoints

```
# Configurations
GET    /api/ai/quality/configs            # List configs
POST   /api/ai/quality/configs            # Create config
PUT    /api/ai/quality/configs/:id        # Update config
DELETE /api/ai/quality/configs/:id        # Delete config

# Scorers
GET    /api/ai/quality/scorers            # List available scorers

# Scores
GET    /api/ai/quality/scores             # List scores
GET    /api/ai/quality/scores/:id         # Get score detail
POST   /api/ai/quality/score              # Score a response manually

# Benchmarks
GET    /api/ai/quality/benchmarks         # List benchmarks
POST   /api/ai/quality/benchmarks         # Create benchmark
PUT    /api/ai/quality/benchmarks/:id     # Update benchmark
POST   /api/ai/quality/benchmarks/:id/run # Run benchmark
GET    /api/ai/quality/benchmarks/:id/runs # Get run history

# Feedback
POST   /api/ai/quality/feedback           # Submit feedback
GET    /api/ai/quality/feedback           # List feedback

# Metrics
GET    /api/ai/quality/metrics            # Get quality metrics
GET    /api/ai/quality/trends             # Get quality trends

# Alerts
GET    /api/ai/quality/alerts             # List alerts
PUT    /api/ai/quality/alerts/:id         # Update alert

# Dashboard
GET    /api/ai/quality/dashboard          # Dashboard data
```

## UI Components

### Admin Dashboard Pages

1. **Quality Overview** (`/admin/ai/quality`)
   - Overall quality score
   - Dimension breakdown
   - Quality trends
   - Active alerts

2. **Score Explorer** (`/admin/ai/quality/scores`)
   - Score list with filters
   - Score distribution charts
   - Low-quality sample review
   - Export capabilities

3. **Configuration** (`/admin/ai/quality/config`)
   - Scoring configurations
   - Dimension weights
   - Alert thresholds

4. **Benchmarks** (`/admin/ai/quality/benchmarks`)
   - Benchmark list
   - Create/edit benchmarks
   - Run history
   - Comparison views

5. **Feedback** (`/admin/ai/quality/feedback`)
   - Human feedback interface
   - Calibration analysis
   - Agreement metrics

6. **Alerts** (`/admin/ai/quality/alerts`)
   - Active alerts
   - Alert history
   - Resolution workflow

## Dependencies

- **Existing:** AI Audit Logs (outputs to score)
- **Related:** Drift Detection, Content Moderation
- **External:**
  - Embedding model (for relevance)
  - LLM for quality assessment (optional)

## Security Considerations

- Quality data access by role
- Scorer API credentials secured
- No PII in quality analysis
- Audit log manual scoring

## Success Metrics

| Metric | Target |
|--------|--------|
| Scoring coverage | > 90% of requests |
| Scorer accuracy (vs human) | > 85% correlation |
| Quality alert accuracy | > 90% true positives |
| Scoring latency | < 500ms p95 |

## Implementation Notes

### Phase 1: Basic Scoring
- Heuristic scorers (length, format)
- Basic relevance scoring
- Score storage and display

### Phase 2: Advanced Scorers
- LLM-based quality assessment
- Multiple dimension scoring
- Benchmarking system

### Phase 3: Feedback & Calibration
- Human feedback collection
- Scorer calibration
- Quality alerts

### Phase 4: Intelligence
- Automated quality optimization suggestions
- Predictive quality scoring
- Cross-tenant insights (anonymized)

## Loop Closure: Auto-Slice Explorer & Regression Gates

### Auto-Slice Explorer

The auto-slice explorer automatically identifies clusters of low-quality outputs by grouping them across multiple dimensions:

- **Prompt Version**: Quality regression in specific prompt versions
- **Model**: Quality differences between model providers/versions
- **Application**: App-specific quality issues
- **Topic**: Quality drops in specific topic clusters

**API Endpoints:**

```
GET /api/ai/quality/slices         # List low-quality clusters
POST /api/ai/jobs/quality-slices   # Background job to compute slices
```

**Query Parameters:**
- `min_low_quality_rate`: Filter slices by minimum low-quality rate (default: 0.1)
- `min_sample_count`: Minimum samples for statistical significance (default: 10)
- `window_start`, `window_end`: Time window for analysis

**Response:**
```json
{
  "slices": [
    {
      "slice_key": {
        "application_id": "customer-support",
        "model_name": "gpt-4",
        "prompt_version": 3
      },
      "low_quality_rate": 0.25,
      "avg_quality_score": 0.62,
      "sample_count": 150,
      "dimension_averages": {
        "relevance": 0.58,
        "coherence": 0.75,
        "helpfulness": 0.55
      }
    }
  ]
}
```

### Regression Gates

Regression gates enforce quality requirements before deployments:

**API Endpoints:**

```
GET /api/ai/quality/gates          # List configured gates
POST /api/ai/quality/gates         # Create a new gate
POST /api/ai/quality/gates/evaluate # Evaluate gates for deployment
```

**Gate Configuration:**
```json
{
  "name": "Production Quality Gate",
  "scope_type": "global",
  "requirements": {
    "min_quality_score": 0.7,
    "max_low_quality_rate": 0.1,
    "min_sample_count": 100,
    "benchmark_ids": ["uuid-1", "uuid-2"],
    "min_benchmark_pass_rate": 0.95
  },
  "on_failure": "block"
}
```

**Integration with Approval Workflows:**

Gates integrate with the policy evaluator via `evaluateDeploymentGates()`:

```typescript
import { evaluateDeploymentGates } from "@/lib/policy/evaluator";

const result = await evaluateDeploymentGates(tenantId, {
  type: "prompt_deploy",
  promptId: "prompt-uuid",
  promptVersion: 4,
  deployedBy: userId,
});

if (!result.canProceed) {
  // Block deployment, show failure reasons
  console.log(result.blockingGates);
}
```
