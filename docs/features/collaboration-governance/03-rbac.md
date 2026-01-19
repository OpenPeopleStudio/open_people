# Role-Based Access Control (RBAC)

> **Priority:** P2 - Medium  
> **Category:** Collaboration & Governance  
> **Status:** Planned

## Overview

Granular permissions system for AI resources, defining who can access, create, modify, and deploy AI capabilities based on roles and responsibilities.

## Problem Statement

Basic access control is insufficient:
- Need fine-grained AI resource permissions
- Different teams need different capabilities
- Audit requirements for access decisions
- Complex permission inheritance needed
- Dynamic access based on context

## User Stories

### As an Admin
- I want to define roles with specific AI permissions
- I want to assign users to roles
- I want to audit access patterns

### As a Team Lead
- I want to manage my team's AI access
- I want to understand what my team can do
- I want to request additional permissions

### As a Developer
- I want to understand my permissions
- I want self-service for appropriate resources
- I want to request elevated access when needed

### As a Security Officer
- I want least-privilege access enforcement
- I want access audit trails
- I want to detect privilege escalation

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                          RBAC                                │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │                 Permission Model                      │   │
│  │                                                       │   │
│  │    Users ──▶ Roles ──▶ Permissions ──▶ Resources     │   │
│  │      │         │            │              │          │   │
│  │      └────────▶│◀───────────┘              │          │   │
│  │         Direct │                           │          │   │
│  │                └───────────────────────────┘          │   │
│  │                       Scopes                          │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │    Role     │  │ Permission  │  │    Audit    │         │
│  │   Manager   │  │   Checker   │  │   Logger    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Permission Model

| Concept | Description |
|---------|-------------|
| User | Individual with account |
| Role | Collection of permissions |
| Permission | Specific capability |
| Resource | AI entity (prompt, model, etc.) |
| Scope | Boundary (tenant, team, project) |

### Resource Types

| Resource | Permissions |
|----------|-------------|
| Prompts | view, create, edit, deploy, delete |
| Models | view, use, configure, register |
| Guardrails | view, create, edit, delete |
| Policies | view, create, edit, delete |
| Audit Logs | view, export |
| Users | view, invite, manage |
| Billing | view, manage |

## Database Schema

```sql
-- RBAC Schema

-- Roles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id), -- NULL = system role
    
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255),
    description TEXT,
    
    -- Role type
    role_type VARCHAR(50) NOT NULL, -- 'system', 'tenant', 'custom'
    
    -- Built-in roles: 'super_admin', 'admin', 'developer', 'viewer', etc.
    is_built_in BOOLEAN DEFAULT false,
    
    -- Hierarchy
    parent_role_id UUID REFERENCES roles(id),
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Permission identifier
    name VARCHAR(100) NOT NULL UNIQUE, -- 'prompts:create', 'models:use', etc.
    
    display_name VARCHAR(255),
    description TEXT,
    
    -- Categorization
    resource_type VARCHAR(50) NOT NULL, -- 'prompts', 'models', 'guardrails', etc.
    action VARCHAR(50) NOT NULL, -- 'view', 'create', 'edit', 'delete', 'deploy', 'use'
    
    -- Risk level
    risk_level VARCHAR(20) DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role-Permission mapping
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    
    -- Scope restrictions
    scope_type VARCHAR(50), -- 'all', 'team', 'project', 'own'
    scope_value VARCHAR(255), -- team_id, project_id, etc.
    
    -- Conditions
    conditions JSONB, -- {environment: ['development', 'staging']}
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(role_id, permission_id, scope_type, scope_value)
);

-- User-Role mapping
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    
    -- Scope
    scope_type VARCHAR(50) DEFAULT 'tenant', -- 'tenant', 'team', 'project'
    scope_value VARCHAR(255), -- team_id, project_id
    
    -- Validity
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    
    -- Assignment metadata
    assigned_by UUID REFERENCES users(id),
    assignment_reason TEXT,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, role_id, scope_type, scope_value)
);

-- Direct user permissions (exceptions)
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    
    -- Grant or deny
    effect VARCHAR(10) NOT NULL, -- 'grant', 'deny'
    
    -- Scope
    scope_type VARCHAR(50),
    scope_value VARCHAR(255),
    
    -- Validity
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    
    -- Metadata
    reason TEXT,
    granted_by UUID REFERENCES users(id),
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permission groups (for convenience)
CREATE TABLE permission_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255),
    description TEXT,
    
    -- Permissions in this group
    permission_names JSONB NOT NULL, -- ['prompts:view', 'prompts:create']
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Access checks audit log
CREATE TABLE access_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Request
    user_id UUID NOT NULL,
    permission_name VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(255),
    
    -- Result
    allowed BOOLEAN NOT NULL,
    
    -- Resolution
    resolved_via VARCHAR(50), -- 'role', 'direct_grant', 'direct_deny', 'default_deny'
    resolving_role_id UUID REFERENCES roles(id),
    
    -- Context
    request_context JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role change history
CREATE TABLE role_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- What changed
    action VARCHAR(50) NOT NULL, -- 'role_created', 'permission_added', 'user_assigned', etc.
    
    -- Target
    role_id UUID REFERENCES roles(id),
    user_id UUID REFERENCES users(id),
    permission_id UUID REFERENCES permissions(id),
    
    -- Change details
    old_value JSONB,
    new_value JSONB,
    
    -- Who made change
    changed_by UUID REFERENCES users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_roles_tenant ON roles(tenant_id);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX idx_user_roles_user ON user_roles(user_id) WHERE is_active = true;
CREATE INDEX idx_user_roles_role ON user_roles(role_id) WHERE is_active = true;
CREATE INDEX idx_user_permissions_user ON user_permissions(user_id) WHERE is_active = true;
CREATE INDEX idx_access_checks_user ON access_checks(user_id, created_at DESC);
CREATE INDEX idx_access_checks_permission ON access_checks(permission_name, created_at DESC);
CREATE INDEX idx_role_audit_log_tenant ON role_audit_log(tenant_id, created_at DESC);
```

## API Endpoints

```
# Roles
GET    /api/rbac/roles                    # List roles
POST   /api/rbac/roles                    # Create role
GET    /api/rbac/roles/:id                # Get role
PUT    /api/rbac/roles/:id                # Update role
DELETE /api/rbac/roles/:id                # Delete role

# Permissions
GET    /api/rbac/permissions              # List permissions
GET    /api/rbac/permissions/groups       # List permission groups

# Role permissions
PUT    /api/rbac/roles/:id/permissions    # Set role permissions

# User roles
GET    /api/rbac/users/:id/roles          # Get user's roles
POST   /api/rbac/users/:id/roles          # Assign role
DELETE /api/rbac/users/:id/roles/:roleId  # Remove role

# User permissions (direct)
GET    /api/rbac/users/:id/permissions    # Get effective permissions
POST   /api/rbac/users/:id/permissions    # Grant/deny permission

# Check access
POST   /api/rbac/check                    # Check permission
GET    /api/rbac/me/permissions           # My permissions

# Audit
GET    /api/rbac/audit                    # Access audit log
GET    /api/rbac/audit/role-changes       # Role change history
```

## UI Components

### Admin Dashboard Pages

1. **RBAC Overview** (`/admin/rbac`)
   - Role summary
   - User assignments
   - Recent access denials
   - Quick actions

2. **Role Manager** (`/admin/rbac/roles`)
   - Role list
   - Create/edit roles
   - Permission assignment
   - Hierarchy visualization

3. **Permission Matrix** (`/admin/rbac/permissions`)
   - Roles vs permissions grid
   - Quick toggle permissions
   - Permission search

4. **User Permissions** (`/admin/rbac/users`)
   - User search
   - Effective permissions view
   - Role assignments
   - Direct grants/denies

5. **Access Audit** (`/admin/rbac/audit`)
   - Access check log
   - Denial analysis
   - Permission usage stats

6. **My Permissions** (`/settings/permissions`)
   - Current roles
   - Effective permissions
   - Request additional access

## Built-in Roles

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| Super Admin | Full platform access | All permissions |
| Admin | Tenant administration | User management, configuration |
| Developer | Build and deploy AI | Prompts, models, testing |
| Viewer | Read-only access | View all, no modifications |
| Compliance | Audit and compliance | Logs, reports, policies |

## Dependencies

- **Existing:** Users, Authentication
- **Related:** Policy Engine
- **External:** SSO provider (for role sync)

## Security Considerations

- Deny by default
- Least privilege principle
- Role change audit
- Privilege escalation prevention
- Session permission caching

## Success Metrics

| Metric | Target |
|--------|--------|
| Permission check latency | < 5ms |
| Access denial rate | < 10% |
| Role coverage | 100% users |
| Audit completeness | 100% |

## Implementation Notes

### Phase 1: Basic RBAC
- Core roles and permissions
- User-role assignment
- Basic permission checking

### Phase 2: Advanced Features
- Permission inheritance
- Scoped permissions
- Direct grants/denies

### Phase 3: Integration
- SSO role sync
- API key permissions
- Approval integration

### Phase 4: Intelligence
- Permission recommendations
- Unused permission detection
- Risk-based access
