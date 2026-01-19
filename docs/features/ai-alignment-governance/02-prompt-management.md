# Prompt Management

> **Priority:** P1 - High  
> **Category:** AI Alignment & Governance  
> **Status:** Planned

## Overview

A version-controlled prompt library with approval workflows, enabling teams to collaborate on prompts while maintaining governance over what prompts are used in production.

## Problem Statement

Organizations struggle with:
- Prompts scattered across codebases with no central visibility
- No version control or rollback capability for prompts
- Inconsistent prompt quality across teams
- No review process before prompts reach production
- Difficulty sharing and reusing effective prompts

## User Stories

### As a Prompt Engineer
- I want to create and iterate on prompts in a dedicated interface
- I want to version my prompts and compare changes
- I want to test prompts before submitting for review

### As a Team Lead
- I want to review and approve prompts before production use
- I want to see which prompts are used by my team's applications
- I want to enforce prompt standards and templates

### As a Developer
- I want to fetch approved prompts via API at runtime
- I want to use prompt variables/templates
- I want to see prompt performance metrics

### As a Compliance Officer
- I want audit trails for all prompt changes
- I want to ensure prompts meet content guidelines
- I want to lock critical prompts from modification

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Prompt Management                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  Prompt Editor                        │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │ System  │  │  User   │  │Assistant│              │   │
│  │  │ Prompt  │  │ Template│  │Examples │              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Version   │  │  Approval   │  │   Runtime   │         │
│  │   Control   │  │  Workflow   │  │     API     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Components

1. **Prompt Editor** - Rich editor for creating prompts
2. **Version Control** - Git-like versioning for prompts
3. **Variable System** - Template variables with validation
4. **Approval Workflow** - Review and approval process
5. **Runtime API** - Fetch prompts at application runtime
6. **Analytics** - Track prompt performance

## Database Schema

```sql
-- Prompt Management Schema
CREATE TABLE prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Identification
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Organization
    folder_id UUID REFERENCES prompt_folders(id),
    tags JSONB DEFAULT '[]',
    
    -- Model targeting
    target_model_id UUID REFERENCES ai_models(id),
    target_provider VARCHAR(100), -- Fallback if no specific model
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft', 'review', 'approved', 'archived'
    is_locked BOOLEAN DEFAULT false,
    locked_by UUID REFERENCES users(id),
    locked_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    UNIQUE(tenant_id, slug)
);

-- Prompt versions (immutable)
CREATE TABLE prompt_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    
    version INTEGER NOT NULL,
    
    -- Prompt content
    system_prompt TEXT,
    user_template TEXT,
    assistant_prefill TEXT,
    
    -- Few-shot examples
    examples JSONB DEFAULT '[]', -- [{role, content}, ...]
    
    -- Variables
    variables JSONB DEFAULT '[]', -- [{name, type, required, default, description}, ...]
    
    -- Model parameters
    temperature DECIMAL(3,2),
    max_tokens INTEGER,
    top_p DECIMAL(3,2),
    stop_sequences JSONB DEFAULT '[]',
    
    -- Change tracking
    change_summary TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    UNIQUE(prompt_id, version)
);

-- Track which version is active
CREATE TABLE prompt_deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    version_id UUID NOT NULL REFERENCES prompt_versions(id),
    
    environment VARCHAR(50) NOT NULL, -- 'development', 'staging', 'production'
    
    deployed_at TIMESTAMPTZ DEFAULT NOW(),
    deployed_by UUID REFERENCES users(id),
    
    UNIQUE(prompt_id, environment)
);

-- Approval workflow
CREATE TABLE prompt_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    version_id UUID NOT NULL REFERENCES prompt_versions(id),
    
    requested_by UUID NOT NULL REFERENCES users(id),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Review details
    reviewer_id UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    decision VARCHAR(20), -- 'approved', 'rejected', 'changes_requested'
    feedback TEXT,
    
    -- Target environment
    target_environment VARCHAR(50) NOT NULL DEFAULT 'production'
);

-- Prompt folders for organization
CREATE TABLE prompt_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES prompt_folders(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Runtime usage tracking
CREATE TABLE prompt_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_id UUID NOT NULL REFERENCES prompts(id),
    version_id UUID NOT NULL REFERENCES prompt_versions(id),
    
    -- Request context
    application_id VARCHAR(255),
    user_id VARCHAR(255),
    environment VARCHAR(50),
    
    -- Variable values used
    variable_values JSONB,
    
    -- Response metrics
    model_used VARCHAR(255),
    input_tokens INTEGER,
    output_tokens INTEGER,
    latency_ms INTEGER,
    
    -- Quality signals
    success BOOLEAN,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_prompts_tenant ON prompts(tenant_id);
CREATE INDEX idx_prompts_folder ON prompts(folder_id);
CREATE INDEX idx_prompts_status ON prompts(status);
CREATE INDEX idx_prompt_versions_prompt ON prompt_versions(prompt_id);
CREATE INDEX idx_prompt_deployments_prompt ON prompt_deployments(prompt_id);
CREATE INDEX idx_prompt_executions_prompt ON prompt_executions(prompt_id);
CREATE INDEX idx_prompt_executions_created ON prompt_executions(created_at);
```

## API Endpoints

```
# Prompts
GET    /api/ai/prompts                    # List prompts
POST   /api/ai/prompts                    # Create prompt
GET    /api/ai/prompts/:id                # Get prompt
PUT    /api/ai/prompts/:id                # Update prompt metadata
DELETE /api/ai/prompts/:id                # Archive prompt

# Versions
GET    /api/ai/prompts/:id/versions       # List versions
POST   /api/ai/prompts/:id/versions       # Create new version
GET    /api/ai/prompts/:id/versions/:v    # Get specific version
POST   /api/ai/prompts/:id/versions/:v/compare # Compare versions

# Deployments
GET    /api/ai/prompts/:id/deployments    # List deployments
POST   /api/ai/prompts/:id/deploy         # Deploy version to environment
POST   /api/ai/prompts/:id/rollback       # Rollback to previous version

# Reviews
POST   /api/ai/prompts/:id/reviews        # Request review
GET    /api/ai/prompts/:id/reviews        # List reviews
PUT    /api/ai/prompts/:id/reviews/:rid   # Submit review decision

# Runtime API (for applications)
GET    /api/ai/prompts/resolve/:slug      # Get active prompt for environment
POST   /api/ai/prompts/render/:slug       # Render prompt with variables

# Folders
GET    /api/ai/prompts/folders            # List folders
POST   /api/ai/prompts/folders            # Create folder
```

## UI Components

### Admin Dashboard Pages

1. **Prompt Library** (`/admin/ai/prompts`)
   - Folder tree navigation
   - Searchable prompt list
   - Quick filters: status, model, tags
   - Create new prompt button

2. **Prompt Editor** (`/admin/ai/prompts/:id`)
   - Split view: edit / preview
   - System prompt editor
   - User template editor with variable highlighting
   - Few-shot examples manager
   - Model parameter controls
   - Variable definition panel
   - Test playground

3. **Version History** (`/admin/ai/prompts/:id/history`)
   - Timeline of all versions
   - Diff viewer between versions
   - Deployment status per environment
   - Rollback controls

4. **Review Queue** (`/admin/ai/prompts/reviews`)
   - Pending reviews list
   - Review interface with side-by-side comparison
   - Approve/reject/request changes actions

## Dependencies

- **Existing:** Tenant system, User authentication
- **Related:** AI Model Registry (for model targeting)
- **External:** None

## Security Considerations

- Role-based access to prompts (viewer/editor/admin)
- Approval required for production deployments
- Lock prompts to prevent accidental changes
- Audit log all changes
- Redact sensitive variable values in logs

## Success Metrics

| Metric | Target |
|--------|--------|
| Prompt reuse rate | > 60% |
| Average review time | < 4 hours |
| Prompt-related incidents | 0 in production |
| Version rollbacks | < 5% of deployments |

## Implementation Notes

### Phase 1: Core Editing
- Prompt CRUD with basic versioning
- Variable system
- Test playground

### Phase 2: Workflow
- Approval workflows
- Environment deployments
- Runtime API

### Phase 3: Analytics
- Usage tracking
- Performance metrics
- A/B testing for prompts
