# Playground / Sandbox

> **Priority:** P2 - Medium  
> **Category:** Developer Experience  
> **Status:** Planned

## Overview

A safe, interactive environment for testing prompts, models, and AI configurations before deploying to production, with built-in governance controls.

## Problem Statement

Developers need a safe place to experiment:
- Testing prompts against production data is risky
- No easy way to compare model responses
- Difficult to iterate on prompts quickly
- Testing in production can expose users to bad outputs
- No governance during development phase

## User Stories

### As a Developer
- I want to quickly test and iterate on prompts
- I want to compare responses across models
- I want to share prompt experiments with teammates

### As a Prompt Engineer
- I want a dedicated interface for prompt development
- I want to see token usage and costs in real-time
- I want to save and version my experiments

### As a Team Lead
- I want developers to test safely before production
- I want visibility into what's being tested
- I want governance controls in the sandbox

### As a Product Manager
- I want to demo AI capabilities to stakeholders
- I want to test user scenarios before building
- I want to evaluate model options

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AI Playground                            │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │                 Playground UI                         │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │ Prompt  │  │ Model   │  │Response │              │   │
│  │  │ Editor  │  │ Select  │  │  View   │              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Execution  │  │ Governance  │  │   History   │         │
│  │   Engine    │  │   Layer     │  │   Manager   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Features

| Feature | Description |
|---------|-------------|
| Prompt Editor | Rich editor with syntax highlighting |
| Model Selector | Choose and compare models |
| Parameter Controls | Temperature, tokens, etc. |
| Variable Interpolation | Test with different variable values |
| Response Comparison | Side-by-side model comparison |
| History | Save and replay experiments |
| Sharing | Share experiments with team |
| Cost Estimation | Real-time cost display |

## Database Schema

```sql
-- Playground Schema

-- Playground sessions
CREATE TABLE playground_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    
    name VARCHAR(255),
    description TEXT,
    
    -- Current state
    current_config JSONB NOT NULL,
    -- {
    --   system_prompt: "...",
    --   user_template: "...",
    --   model: "gpt-4",
    --   parameters: {temperature: 0.7, max_tokens: 1000},
    --   variables: {name: "John", product: "Widget"}
    -- }
    
    -- Sharing
    is_shared BOOLEAN DEFAULT false,
    shared_with JSONB DEFAULT '[]', -- User IDs or 'team'
    
    -- Status
    last_run_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playground executions
CREATE TABLE playground_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES playground_sessions(id) ON DELETE CASCADE,
    
    -- Configuration at execution time
    config JSONB NOT NULL,
    
    -- Input
    resolved_prompt TEXT NOT NULL, -- After variable interpolation
    
    -- Output
    response TEXT,
    
    -- Metrics
    input_tokens INTEGER,
    output_tokens INTEGER,
    latency_ms INTEGER,
    estimated_cost DECIMAL(10,6),
    
    -- Status
    status VARCHAR(20) NOT NULL, -- 'pending', 'completed', 'error'
    error_message TEXT,
    
    -- Governance
    moderation_result JSONB,
    guardrails_triggered JSONB DEFAULT '[]',
    
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved prompts from playground
CREATE TABLE playground_saved_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES playground_sessions(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    
    -- Prompt content
    system_prompt TEXT,
    user_template TEXT,
    
    -- Best performing config
    recommended_model VARCHAR(255),
    recommended_parameters JSONB,
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comparison sets
CREATE TABLE playground_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES playground_sessions(id) ON DELETE CASCADE,
    
    name VARCHAR(255),
    
    -- Executions to compare
    execution_ids JSONB NOT NULL, -- Array of execution IDs
    
    -- User notes
    winner_execution_id UUID REFERENCES playground_executions(id),
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playground templates
CREATE TABLE playground_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id), -- NULL = global templates
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    
    -- Template content
    template_config JSONB NOT NULL,
    
    -- Usage
    use_count INTEGER DEFAULT 0,
    
    is_public BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_playground_sessions_user ON playground_sessions(user_id, updated_at DESC);
CREATE INDEX idx_playground_sessions_tenant ON playground_sessions(tenant_id);
CREATE INDEX idx_playground_sessions_shared ON playground_sessions(tenant_id) WHERE is_shared = true;
CREATE INDEX idx_playground_executions_session ON playground_executions(session_id, executed_at DESC);
CREATE INDEX idx_playground_templates_tenant ON playground_templates(tenant_id);
CREATE INDEX idx_playground_templates_public ON playground_templates(is_public) WHERE is_public = true;
```

## API Endpoints

```
# Sessions
GET    /api/playground/sessions           # List user's sessions
POST   /api/playground/sessions           # Create session
GET    /api/playground/sessions/:id       # Get session
PUT    /api/playground/sessions/:id       # Update session
DELETE /api/playground/sessions/:id       # Delete session

# Executions
POST   /api/playground/sessions/:id/run   # Execute prompt
GET    /api/playground/sessions/:id/history # Get execution history
GET    /api/playground/executions/:id     # Get execution detail

# Comparisons
POST   /api/playground/compare            # Compare multiple configs
GET    /api/playground/comparisons/:id    # Get comparison

# Templates
GET    /api/playground/templates          # List templates
POST   /api/playground/templates          # Create template
GET    /api/playground/templates/:id      # Get template

# Sharing
POST   /api/playground/sessions/:id/share # Share session
GET    /api/playground/shared             # List shared with me

# Export
POST   /api/playground/sessions/:id/export-to-prompt # Export to Prompt Management
```

## UI Components

### Playground Pages

1. **Playground Home** (`/playground`)
   - Recent sessions
   - Templates gallery
   - Shared sessions
   - Quick start

2. **Playground Editor** (`/playground/:id`)
   - **Left Panel:** Prompt editor
     - System prompt
     - User template
     - Variables
   - **Center Panel:** Controls
     - Model selector
     - Parameters
     - Run button
   - **Right Panel:** Output
     - Response display
     - Metrics (tokens, cost, latency)
     - Moderation results

3. **Comparison View** (`/playground/:id/compare`)
   - Side-by-side responses
   - Metrics comparison
   - Winner selection

4. **History View** (`/playground/:id/history`)
   - Execution timeline
   - Config diffs
   - Replay execution

## Dependencies

- **Existing:** AI Models Registry, Content Moderation
- **Related:** Prompt Management (export target)
- **External:** AI provider APIs

## Security Considerations

- Sandbox isolation
- Governance controls apply
- Rate limiting per user
- Audit logging optional
- PII detection warnings

## Success Metrics

| Metric | Target |
|--------|--------|
| Playground adoption | > 80% of developers |
| Prompts exported to production | > 50% |
| Avg iterations before export | < 10 |
| Issues caught in playground | > 90% |

## Implementation Notes

### Phase 1: Basic Playground
- Simple prompt editor
- Single model execution
- Basic history

### Phase 2: Comparison & Collaboration
- Multi-model comparison
- Session sharing
- Templates

### Phase 3: Integration
- Export to Prompt Management
- Governance integration
- Advanced analytics
