# Eval Framework

> **Priority:** P1 - High  
> **Category:** Developer Experience  
> **Status:** Planned

## Overview

Automated testing and evaluation framework for AI behavior, enabling systematic assessment of prompts, models, and AI features with customizable test suites.

## Problem Statement

AI testing is challenging:
- Non-deterministic outputs make testing hard
- No standardized testing frameworks for AI
- Manual testing doesn't scale
- Regression detection is ad-hoc
- Hard to compare model/prompt versions

## User Stories

### As a Developer
- I want to write tests for my AI features
- I want CI/CD integration for AI testing
- I want to catch regressions before production

### As a Prompt Engineer
- I want to test prompts systematically
- I want to compare prompt versions
- I want metrics-driven prompt optimization

### As a QA Engineer
- I want automated AI test suites
- I want coverage for edge cases
- I want test result reporting

### As an ML Engineer
- I want to evaluate model performance
- I want benchmark comparisons
- I want to track metrics over time

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Eval Framework                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │                 Test Types                            │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │  Unit   │  │  Golden │  │ Behavior│              │   │
│  │  │  Tests  │  │   Set   │  │  Tests  │              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │Adversar-│  │ Perf    │  │ Safety  │              │   │
│  │  │   ial   │  │  Tests  │  │  Tests  │              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Evaluators │  │   Runner    │  │  Reporters  │         │
│  │             │  │             │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Test Types

| Type | Description | Use Case |
|------|-------------|----------|
| Unit Tests | Single input/output assertions | Basic functionality |
| Golden Set | Expected output comparisons | Regression testing |
| Behavior Tests | Pattern/format validation | Output structure |
| Adversarial | Edge cases and attacks | Safety/security |
| Performance | Latency/token benchmarks | SLA validation |
| Safety | Content safety checks | Compliance |

### Evaluators

| Evaluator | Description |
|-----------|-------------|
| Exact Match | Output equals expected |
| Contains | Output contains substring |
| Regex | Output matches pattern |
| JSON Schema | Valid JSON with schema |
| Semantic | Embedding similarity |
| LLM Judge | AI evaluates output |
| Custom Function | User-defined logic |

## Database Schema

```sql
-- Eval Framework Schema

-- Test suites
CREATE TABLE eval_suites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Scope
    application_id VARCHAR(255),
    prompt_id UUID,
    
    -- Configuration
    default_model VARCHAR(255),
    default_parameters JSONB,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Test cases
CREATE TABLE eval_test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suite_id UUID NOT NULL REFERENCES eval_suites(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Test type
    test_type VARCHAR(50) NOT NULL, -- 'unit', 'golden', 'behavior', 'adversarial', 'performance', 'safety'
    
    -- Input
    input JSONB NOT NULL,
    -- {
    --   system_prompt: "...",
    --   user_message: "...",
    --   variables: {...}
    -- }
    
    -- Expected/Assertions
    assertions JSONB NOT NULL,
    -- [
    --   {type: 'contains', value: 'expected text'},
    --   {type: 'json_schema', schema: {...}},
    --   {type: 'semantic_similarity', reference: '...', threshold: 0.9},
    --   {type: 'llm_judge', criteria: 'Is the response helpful?', pass_score: 4}
    -- ]
    
    -- Tags
    tags JSONB DEFAULT '[]',
    
    -- Priority
    priority INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test runs
CREATE TABLE eval_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Scope
    suite_id UUID REFERENCES eval_suites(id),
    
    -- What was tested
    test_case_ids JSONB, -- NULL = all in suite
    
    -- Configuration
    config JSONB NOT NULL,
    -- {
    --   model: 'gpt-4',
    --   parameters: {...},
    --   prompt_version: 5
    -- }
    
    -- Trigger
    trigger_type VARCHAR(50) NOT NULL, -- 'manual', 'scheduled', 'ci', 'prompt_change'
    trigger_ref VARCHAR(255), -- CI job ID, etc.
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'cancelled'
    
    -- Results summary
    total_tests INTEGER,
    passed_tests INTEGER DEFAULT 0,
    failed_tests INTEGER DEFAULT 0,
    error_tests INTEGER DEFAULT 0,
    
    pass_rate DECIMAL(5,4),
    
    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    
    -- Cost
    total_tokens INTEGER,
    total_cost DECIMAL(10,6),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Individual test results
CREATE TABLE eval_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES eval_runs(id) ON DELETE CASCADE,
    test_case_id UUID NOT NULL REFERENCES eval_test_cases(id),
    
    -- Execution
    input_used JSONB NOT NULL,
    
    -- Output
    output TEXT,
    output_metadata JSONB,
    
    -- Result
    status VARCHAR(20) NOT NULL, -- 'passed', 'failed', 'error', 'skipped'
    
    -- Assertion results
    assertion_results JSONB NOT NULL,
    -- [
    --   {assertion_idx: 0, passed: true, details: {...}},
    --   {assertion_idx: 1, passed: false, expected: '...', actual: '...'}
    -- ]
    
    -- Metrics
    latency_ms INTEGER,
    input_tokens INTEGER,
    output_tokens INTEGER,
    
    -- Error
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evaluator configurations
CREATE TABLE eval_evaluators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id), -- NULL = built-in
    
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255),
    description TEXT,
    
    evaluator_type VARCHAR(50) NOT NULL,
    
    -- Configuration schema
    config_schema JSONB,
    
    -- For custom evaluators
    custom_code TEXT,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comparison runs (compare two configs)
CREATE TABLE eval_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(255),
    
    -- Runs to compare
    baseline_run_id UUID NOT NULL REFERENCES eval_runs(id),
    candidate_run_id UUID NOT NULL REFERENCES eval_runs(id),
    
    -- Analysis
    comparison_result JSONB,
    -- {
    --   pass_rate_delta: -0.05,
    --   regressions: [{test_case_id, baseline_status, candidate_status}],
    --   improvements: [...],
    --   latency_delta_ms: 50,
    --   cost_delta: 0.02
    -- }
    
    -- Verdict
    verdict VARCHAR(20), -- 'better', 'worse', 'equivalent', 'mixed'
    verdict_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Scheduled eval runs
CREATE TABLE eval_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suite_id UUID NOT NULL REFERENCES eval_suites(id) ON DELETE CASCADE,
    
    -- Schedule
    cron_expression VARCHAR(100) NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Configuration
    config JSONB,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_eval_suites_tenant ON eval_suites(tenant_id);
CREATE INDEX idx_eval_test_cases_suite ON eval_test_cases(suite_id);
CREATE INDEX idx_eval_runs_tenant ON eval_runs(tenant_id, created_at DESC);
CREATE INDEX idx_eval_runs_suite ON eval_runs(suite_id, created_at DESC);
CREATE INDEX idx_eval_runs_status ON eval_runs(status) WHERE status IN ('pending', 'running');
CREATE INDEX idx_eval_results_run ON eval_results(run_id);
CREATE INDEX idx_eval_results_test ON eval_results(test_case_id, created_at DESC);
CREATE INDEX idx_eval_comparisons_tenant ON eval_comparisons(tenant_id, created_at DESC);
```

## API Endpoints

```
# Suites
GET    /api/eval/suites                   # List suites
POST   /api/eval/suites                   # Create suite
GET    /api/eval/suites/:id               # Get suite
PUT    /api/eval/suites/:id               # Update suite
DELETE /api/eval/suites/:id               # Delete suite

# Test Cases
GET    /api/eval/suites/:id/tests         # List test cases
POST   /api/eval/suites/:id/tests         # Add test case
PUT    /api/eval/tests/:id                # Update test case
DELETE /api/eval/tests/:id                # Delete test case

# Runs
POST   /api/eval/run                      # Start eval run
GET    /api/eval/runs                     # List runs
GET    /api/eval/runs/:id                 # Get run details
GET    /api/eval/runs/:id/results         # Get results
DELETE /api/eval/runs/:id                 # Cancel run

# Comparisons
POST   /api/eval/compare                  # Create comparison
GET    /api/eval/comparisons/:id          # Get comparison

# Evaluators
GET    /api/eval/evaluators               # List evaluators
POST   /api/eval/evaluators               # Create custom evaluator

# Schedules
GET    /api/eval/schedules                # List schedules
POST   /api/eval/schedules                # Create schedule
PUT    /api/eval/schedules/:id            # Update schedule

# CI Integration
POST   /api/eval/ci/run                   # CI-triggered run
GET    /api/eval/ci/status/:ref           # Get CI run status
```

## UI Components

### Admin Dashboard Pages

1. **Eval Overview** (`/admin/eval`)
   - Recent runs
   - Suite health
   - Failure trends
   - Quick run

2. **Suite Management** (`/admin/eval/suites`)
   - Suite list
   - Create/edit suites
   - Test case management

3. **Test Case Editor** (`/admin/eval/tests/:id`)
   - Input configuration
   - Assertion builder
   - Quick test run
   - History

4. **Run Details** (`/admin/eval/runs/:id`)
   - Results table
   - Pass/fail breakdown
   - Individual test details
   - Metrics

5. **Comparison View** (`/admin/eval/compare`)
   - Side-by-side comparison
   - Regression highlighting
   - Metric deltas

6. **Evaluators** (`/admin/eval/evaluators`)
   - Built-in evaluators
   - Custom evaluator creation
   - Configuration

## CLI / SDK

```bash
# CLI usage
opai eval run --suite my-suite --model gpt-4
opai eval compare run-123 run-456
opai eval watch --suite my-suite --on-fail notify
```

```typescript
// SDK usage
const eval = new OpenPeopleEval({
  apiKey: 'op_sk_...'
});

const run = await eval.run({
  suite: 'my-suite',
  config: { model: 'gpt-4' }
});

await run.waitForCompletion();
console.log(run.results);
```

## Dependencies

- **Existing:** AI Audit Logs, Quality Scoring
- **Related:** Prompt Management
- **External:** LLM for judge evaluations

## Security Considerations

- Test data isolation
- No production data in tests (by default)
- Secure custom evaluator execution
- Cost limits on runs

## Success Metrics

| Metric | Target |
|--------|--------|
| Test coverage | > 80% of prompts |
| CI integration rate | > 70% of teams |
| Regression catch rate | > 95% |
| False positive rate | < 5% |

## Implementation Notes

### Phase 1: Basic Framework
- Test suites and cases
- Simple evaluators (exact, contains, regex)
- Manual runs

### Phase 2: Advanced Evaluators
- Semantic similarity
- LLM judge
- JSON schema validation

### Phase 3: CI/CD
- CI integration
- Scheduled runs
- Comparison tools

### Phase 4: Intelligence
- Auto-generated tests
- Smart regression detection
- Test recommendations
