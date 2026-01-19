# AI Model Registry

> **Priority:** P2 - Medium  
> **Category:** AI Alignment & Governance  
> **Status:** Planned

## Overview

A centralized registry for tracking all AI models used across the organization, including vendor models (OpenAI, Anthropic, Google), fine-tuned models, and custom deployments.

## Problem Statement

Organizations using multiple AI models across different teams lack visibility into:
- Which models are being used and where
- Model versions and their capabilities/limitations
- Risk levels and compliance status of each model
- Total exposure to specific AI providers

Without a model registry, organizations cannot effectively govern AI usage or respond to incidents (e.g., when a model is deprecated or found to have issues).

## User Stories

### As an AI Governance Officer
- I want to see all AI models used in my organization
- I want to classify models by risk level (low/medium/high/critical)
- I want to track model deprecation dates and migration plans

### As a Developer
- I want to discover approved models for my use case
- I want to understand model capabilities and limitations
- I want to see usage examples and best practices

### As a Compliance Officer
- I want to know which models process PII
- I want to track model certifications and audit status
- I want to generate compliance reports per model

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Model Registry                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Vendor    │  │  Fine-tuned │  │   Custom    │         │
│  │   Models    │  │   Models    │  │   Models    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Version   │  │    Risk     │  │   Usage     │         │
│  │   Tracking  │  │  Assessment │  │   Metrics   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Components

1. **Model Catalog** - Searchable list of all registered models
2. **Version Manager** - Track model versions and changes
3. **Risk Assessor** - Automated and manual risk classification
4. **Usage Tracker** - Which applications use which models
5. **Deprecation Manager** - Sunset planning and notifications

## Database Schema

```sql
-- AI Model Registry Schema
CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Model identification
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL, -- 'openai', 'anthropic', 'google', 'custom'
    provider_model_id VARCHAR(255), -- e.g., 'gpt-4-turbo'
    
    -- Model type
    model_type VARCHAR(50) NOT NULL, -- 'llm', 'embedding', 'image', 'audio', 'multimodal'
    deployment_type VARCHAR(50) NOT NULL, -- 'vendor_api', 'fine_tuned', 'self_hosted'
    
    -- Versioning
    version VARCHAR(50),
    base_model_id UUID REFERENCES ai_models(id), -- For fine-tuned models
    
    -- Capabilities
    context_window INTEGER,
    max_output_tokens INTEGER,
    supports_functions BOOLEAN DEFAULT false,
    supports_vision BOOLEAN DEFAULT false,
    supports_streaming BOOLEAN DEFAULT true,
    
    -- Risk & Compliance
    risk_level VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    pii_approved BOOLEAN DEFAULT false,
    compliance_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'restricted', 'deprecated'
    
    -- Lifecycle
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'deprecated', 'sunset'
    deprecation_date TIMESTAMPTZ,
    sunset_date TIMESTAMPTZ,
    
    -- Metadata
    description TEXT,
    documentation_url VARCHAR(500),
    tags JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    UNIQUE(tenant_id, slug)
);

-- Model versions history
CREATE TABLE ai_model_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,
    
    version VARCHAR(50) NOT NULL,
    release_date TIMESTAMPTZ,
    changelog TEXT,
    
    -- Performance metrics at release
    benchmark_scores JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Model risk assessments
CREATE TABLE ai_model_risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,
    
    assessor_id UUID REFERENCES users(id),
    assessment_date TIMESTAMPTZ DEFAULT NOW(),
    
    -- Risk categories
    bias_risk VARCHAR(20), -- 'low', 'medium', 'high'
    hallucination_risk VARCHAR(20),
    security_risk VARCHAR(20),
    compliance_risk VARCHAR(20),
    
    overall_risk VARCHAR(20) NOT NULL,
    
    -- Details
    findings TEXT,
    mitigations TEXT,
    recommendations TEXT,
    
    -- Approval
    approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ
);

-- Model usage by applications
CREATE TABLE ai_model_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,
    
    application_name VARCHAR(255) NOT NULL,
    application_id VARCHAR(255),
    environment VARCHAR(50) NOT NULL, -- 'development', 'staging', 'production'
    
    use_case TEXT,
    owner_id UUID REFERENCES users(id),
    team_id UUID,
    
    -- Usage stats
    first_used_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    total_requests BIGINT DEFAULT 0,
    
    status VARCHAR(20) DEFAULT 'active',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_models_tenant ON ai_models(tenant_id);
CREATE INDEX idx_ai_models_provider ON ai_models(provider);
CREATE INDEX idx_ai_models_status ON ai_models(status);
CREATE INDEX idx_ai_models_risk ON ai_models(risk_level);
CREATE INDEX idx_ai_model_applications_model ON ai_model_applications(model_id);
```

## API Endpoints

```
# Model Registry
GET    /api/ai/models                    # List all models
POST   /api/ai/models                    # Register new model
GET    /api/ai/models/:id                # Get model details
PUT    /api/ai/models/:id                # Update model
DELETE /api/ai/models/:id                # Archive model

# Model Versions
GET    /api/ai/models/:id/versions       # List model versions
POST   /api/ai/models/:id/versions       # Add version

# Risk Assessments
GET    /api/ai/models/:id/assessments    # List assessments
POST   /api/ai/models/:id/assessments    # Create assessment
PUT    /api/ai/models/:id/assessments/:aid # Update assessment

# Model Applications
GET    /api/ai/models/:id/applications   # List applications using model
POST   /api/ai/models/:id/applications   # Register application

# Discovery
GET    /api/ai/models/search             # Search models
GET    /api/ai/models/by-provider/:provider # Filter by provider
GET    /api/ai/models/by-risk/:level     # Filter by risk level
```

## UI Components

### Admin Dashboard Pages

1. **Model Catalog** (`/admin/ai/models`)
   - Filterable/searchable table of all models
   - Quick stats: total models, by provider, by risk level
   - Bulk actions: deprecate, archive

2. **Model Detail** (`/admin/ai/models/:id`)
   - Model information and capabilities
   - Version history timeline
   - Risk assessment summary
   - Applications using this model
   - Usage metrics

3. **Register Model** (`/admin/ai/models/new`)
   - Model registration form
   - Auto-detect capabilities for known providers
   - Initial risk assessment

4. **Risk Assessment** (`/admin/ai/models/:id/assess`)
   - Risk assessment questionnaire
   - Document findings and mitigations
   - Approval workflow

## Dependencies

- **Existing:** Tenant system, User authentication
- **New:** None
- **External:** Model provider APIs (for capability detection)

## Security Considerations

- Only admins can register/modify models
- Risk assessments require appropriate role
- API keys for provider models stored securely (not in registry)
- Audit log all registry changes

## Success Metrics

| Metric | Target |
|--------|--------|
| Model registration coverage | 100% of models in use |
| Risk assessments completed | 100% of production models |
| Time to onboard new model | < 1 hour |
| Deprecated model migrations | 100% before sunset |

## Implementation Notes

### Phase 1: Core Registry
- Model CRUD operations
- Basic search and filtering
- Manual risk assessment

### Phase 2: Automation
- Auto-detect model capabilities
- Usage tracking integration
- Deprecation notifications

### Phase 3: Intelligence
- Recommend models for use cases
- Automated risk scoring
- Cost optimization suggestions
