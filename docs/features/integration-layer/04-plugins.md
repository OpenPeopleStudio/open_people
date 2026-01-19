# Browser & IDE Plugins

> **Priority:** P3 - Low  
> **Category:** Integration Layer  
> **Status:** Planned

## Overview

Extensions for browsers (Chrome, Edge, Firefox) and IDEs (VS Code, JetBrains) that bring governed AI assistance to where developers and knowledge workers operate.

## Problem Statement

Users need AI in their tools:
- Context switching disrupts workflow
- Copy-pasting to AI tools is inefficient
- Browser-based AI lacks governance
- Developer AI tools bypass controls
- No consistent AI experience across tools

## User Stories

### As a Developer
- I want AI code assistance in my IDE
- I want governed AI that follows policies
- I want seamless AI integration

### As a Knowledge Worker
- I want AI help while browsing
- I want to summarize web pages
- I want AI writing assistance

### As an IT Administrator
- I want to control AI plugin deployment
- I want consistent policies across tools
- I want visibility into plugin usage

### As a Security Officer
- I want plugins to respect data policies
- I want no data leakage through plugins
- I want audit trails for plugin usage

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Plugin Platform                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    Plugins                            │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │ Chrome  │  │  VS Code│  │JetBrains│              │   │
│  │  │Extension│  │Extension│  │ Plugin  │              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │  Edge   │  │ Firefox │  │  CLI    │              │   │
│  │  │Extension│  │ Add-on  │  │  Tool   │              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Plugin    │  │  Context    │  │ Governance  │         │
│  │    API      │  │  Manager    │  │   Layer     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Plugin Features

| Plugin | Features |
|--------|----------|
| Browser | Page summarization, text selection AI, writing assistance |
| VS Code | Code completion, explanation, refactoring, documentation |
| JetBrains | Code completion, review, test generation |
| CLI | Terminal AI assistance, command generation |

## Database Schema

```sql
-- Browser & IDE Plugins Schema

-- Plugin installations
CREATE TABLE plugin_installations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Plugin info
    plugin_type VARCHAR(50) NOT NULL, -- 'chrome', 'vscode', 'jetbrains', 'cli'
    plugin_version VARCHAR(50),
    
    -- Device
    device_id VARCHAR(255), -- Unique device identifier
    device_name VARCHAR(255),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Activity
    last_activity_at TIMESTAMPTZ,
    
    installed_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, plugin_type, device_id)
);

-- Plugin configurations (user-level)
CREATE TABLE plugin_user_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    plugin_type VARCHAR(50) NOT NULL,
    
    -- Features
    enabled_features JSONB,
    -- {code_completion: true, summarize: true, ...}
    
    -- AI settings
    default_model VARCHAR(255),
    
    -- UI preferences
    ui_preferences JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, plugin_type)
);

-- Plugin configurations (tenant-level policies)
CREATE TABLE plugin_tenant_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Allowed plugins
    allowed_plugins JSONB, -- ['chrome', 'vscode']
    
    -- Feature restrictions
    feature_restrictions JSONB,
    -- {
    --   chrome: {summarize: true, write_assist: false},
    --   vscode: {code_completion: true}
    -- }
    
    -- Deployment
    auto_configure BOOLEAN DEFAULT false,
    managed_config JSONB, -- Config pushed to plugins
    
    -- Data controls
    allow_page_content BOOLEAN DEFAULT true,
    allow_code_context BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id)
);

-- Plugin requests
CREATE TABLE plugin_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installation_id UUID REFERENCES plugin_installations(id),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    -- Request details
    plugin_type VARCHAR(50) NOT NULL,
    feature VARCHAR(100) NOT NULL, -- 'summarize', 'code_complete', etc.
    
    -- Context
    context_type VARCHAR(50), -- 'webpage', 'code_file', 'selection'
    context_metadata JSONB, -- {url, file_type, language, etc.}
    
    -- AI request
    audit_log_id UUID REFERENCES ai_audit_logs(id),
    
    -- Performance
    latency_ms INTEGER,
    
    -- Status
    status VARCHAR(20) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plugin analytics
CREATE TABLE plugin_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Dimensions
    plugin_type VARCHAR(50) NOT NULL,
    feature VARCHAR(100),
    
    -- Period
    date DATE NOT NULL,
    
    -- Volume
    request_count INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    
    -- Performance
    avg_latency_ms INTEGER,
    success_rate DECIMAL(5,4),
    
    -- Engagement
    avg_requests_per_user DECIMAL(10,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, plugin_type, feature, date)
);

-- Distribution packages
CREATE TABLE plugin_distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    plugin_type VARCHAR(50) NOT NULL,
    version VARCHAR(50) NOT NULL,
    
    -- Download
    download_url VARCHAR(500),
    checksum VARCHAR(64),
    
    -- Release info
    release_notes TEXT,
    min_host_version VARCHAR(50), -- Min VS Code version, etc.
    
    -- Status
    is_latest BOOLEAN DEFAULT false,
    is_stable BOOLEAN DEFAULT true,
    
    released_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(plugin_type, version)
);

-- Indexes
CREATE INDEX idx_plugin_installations_tenant ON plugin_installations(tenant_id);
CREATE INDEX idx_plugin_installations_user ON plugin_installations(user_id);
CREATE INDEX idx_plugin_user_configs_user ON plugin_user_configs(user_id);
CREATE INDEX idx_plugin_tenant_configs_tenant ON plugin_tenant_configs(tenant_id);
CREATE INDEX idx_plugin_requests_installation ON plugin_requests(installation_id);
CREATE INDEX idx_plugin_requests_tenant ON plugin_requests(tenant_id, created_at DESC);
CREATE INDEX idx_plugin_metrics_tenant ON plugin_metrics(tenant_id, date DESC);
```

## API Endpoints

```
# Plugin API (for plugins to call)
POST   /api/plugins/auth                  # Authenticate plugin
POST   /api/plugins/heartbeat             # Keep-alive and config sync
POST   /api/plugins/request               # AI request from plugin
GET    /api/plugins/config                # Get user config

# Management API
GET    /api/plugins/installations         # List installations
GET    /api/plugins/installations/:id     # Get installation
DELETE /api/plugins/installations/:id     # Deactivate installation

# User config
GET    /api/plugins/user-config           # Get my config
PUT    /api/plugins/user-config           # Update my config

# Tenant config
GET    /api/plugins/tenant-config         # Get tenant config
PUT    /api/plugins/tenant-config         # Update tenant config

# Distribution
GET    /api/plugins/distributions         # List available plugins
GET    /api/plugins/distributions/:type   # Get plugin download info

# Analytics
GET    /api/plugins/metrics               # Plugin metrics
GET    /api/plugins/analytics             # Detailed analytics
```

## Plugin Interfaces

### Chrome Extension

```javascript
// Popup interface
- Quick AI chat
- Summarize current page
- Explain selected text
- Writing assistance for text inputs

// Context menu
- "Ask AI about this"
- "Summarize selection"
- "Translate with AI"

// Sidebar
- Full conversation interface
- Page context awareness
```

### VS Code Extension

```typescript
// Code actions
- Explain code
- Refactor suggestion
- Generate documentation
- Generate tests

// Inline completion
- Context-aware suggestions
- Multi-line completions

// Chat panel
- Ask questions about code
- Debug assistance
- Architecture help
```

## UI Components

### Admin Dashboard

1. **Plugins Overview** (`/admin/plugins`)
   - Installation stats
   - Usage metrics
   - Feature breakdown

2. **Tenant Configuration** (`/admin/plugins/config`)
   - Allowed plugins
   - Feature restrictions
   - Data controls

3. **User Installations** (`/admin/plugins/installations`)
   - Installation list
   - User activity
   - Version distribution

4. **Analytics** (`/admin/plugins/analytics`)
   - Usage trends
   - Feature adoption
   - Performance metrics

### User Settings

5. **My Plugins** (`/settings/plugins`)
   - My installations
   - Feature preferences
   - Download links

## Dependencies

- **Existing:** API Gateway, Authentication
- **Related:** All governance features
- **External:** Browser/IDE APIs

## Security Considerations

- Secure authentication
- Data minimization in context
- Local processing where possible
- No sensitive data caching
- Audit logging

## Success Metrics

| Metric | Target |
|--------|--------|
| Plugin adoption | > 50% of users |
| Daily active plugin users | > 30% |
| Feature utilization | > 3 features/user |
| User satisfaction | > 4.2/5 |

## Implementation Notes

### Phase 1: Chrome Extension
- Basic AI chat
- Page summarization
- Text selection actions

### Phase 2: VS Code Extension
- Code completion
- Code explanation
- Chat interface

### Phase 3: Additional Plugins
- JetBrains plugin
- Firefox extension
- CLI tool

### Phase 4: Enterprise
- Managed deployment
- Policy enforcement
- Advanced analytics
