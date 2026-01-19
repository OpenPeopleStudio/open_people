# SSO & Directory Sync

> **Priority:** P2 - Medium  
> **Category:** Integration Layer  
> **Status:** Planned

## Overview

Enterprise identity integration supporting SAML, OIDC, and SCIM for single sign-on and automated user/group provisioning.

## Problem Statement

Enterprise customers require identity integration:
- Users want single sign-on
- IT needs centralized user management
- Groups/roles must sync from IdP
- Offboarding must be automated
- Compliance requires identity audit

## User Stories

### As an IT Administrator
- I want users to sign in with corporate credentials
- I want automatic user provisioning
- I want group memberships synced

### As a Security Officer
- I want centralized authentication
- I want automatic deprovisioning
- I want MFA enforced by IdP

### As an End User
- I want to sign in once
- I don't want another password
- I want seamless access

### As a Compliance Officer
- I want identity audit trails
- I want to verify user access
- I want to enforce access policies

## Technical Design

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SSO & Directory Sync                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │               Identity Providers                      │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │  Okta   │  │ Azure   │  │  Google │              │   │
│  │  │         │  │   AD    │  │Workspace│              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │OneLogin │  │  Auth0  │  │ Custom  │              │   │
│  │  │         │  │         │  │  SAML   │              │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │     SSO     │  │    SCIM     │  │    User     │         │
│  │   Handler   │  │    Sync     │  │   Manager   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Supported Protocols

| Protocol | Use Case |
|----------|----------|
| SAML 2.0 | Enterprise SSO |
| OIDC | Modern SSO |
| SCIM 2.0 | User/group provisioning |
| Just-in-Time | Create users on first login |

## Database Schema

```sql
-- SSO & Directory Sync Schema

-- SSO configurations
CREATE TABLE sso_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(255) NOT NULL,
    
    -- Protocol
    protocol VARCHAR(20) NOT NULL, -- 'saml', 'oidc'
    
    -- Provider
    provider_type VARCHAR(50), -- 'okta', 'azure_ad', 'google', 'onelogin', 'auth0', 'custom'
    
    -- SAML configuration
    saml_config JSONB,
    -- {
    --   idp_entity_id: '...',
    --   idp_sso_url: '...',
    --   idp_certificate: '...',
    --   sp_entity_id: '...',
    --   sp_acs_url: '...',
    --   name_id_format: 'email',
    --   attribute_mapping: {email: 'email', name: 'displayName'}
    -- }
    
    -- OIDC configuration
    oidc_config JSONB,
    -- {
    --   issuer: '...',
    --   client_id: '...',
    --   client_secret_encrypted: '...',
    --   authorization_endpoint: '...',
    --   token_endpoint: '...',
    --   userinfo_endpoint: '...',
    --   scopes: ['openid', 'profile', 'email']
    -- }
    
    -- Behavior
    auto_provision BOOLEAN DEFAULT true,
    default_role_id UUID REFERENCES roles(id),
    
    -- Domain restriction
    allowed_domains JSONB, -- ['company.com', 'subsidiary.com']
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SCIM configurations
CREATE TABLE scim_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    name VARCHAR(255) NOT NULL,
    
    -- SCIM endpoint
    base_url VARCHAR(500), -- For outbound SCIM
    
    -- Authentication
    auth_type VARCHAR(50) NOT NULL, -- 'bearer', 'basic'
    auth_token_encrypted BYTEA,
    
    -- Inbound SCIM (for IdP push)
    inbound_enabled BOOLEAN DEFAULT false,
    inbound_token_hash VARCHAR(64), -- For validating inbound requests
    
    -- Sync settings
    sync_users BOOLEAN DEFAULT true,
    sync_groups BOOLEAN DEFAULT true,
    
    -- Mapping
    user_attribute_mapping JSONB,
    group_attribute_mapping JSONB,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- External identities (linking to IdP)
CREATE TABLE external_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Provider
    sso_config_id UUID REFERENCES sso_configurations(id),
    
    -- External ID
    provider_user_id VARCHAR(255) NOT NULL, -- ID from IdP
    provider_email VARCHAR(255),
    
    -- SAML specifics
    name_id VARCHAR(255),
    
    -- OIDC specifics
    oidc_subject VARCHAR(255),
    
    -- Metadata
    provider_attributes JSONB, -- Raw attributes from IdP
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    last_login_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(sso_config_id, provider_user_id)
);

-- SCIM external groups
CREATE TABLE scim_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    scim_config_id UUID REFERENCES scim_configurations(id),
    
    -- External ID
    external_id VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    
    -- Mapping to internal
    role_id UUID REFERENCES roles(id),
    team_id UUID,
    
    -- Members (synced)
    member_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    last_sync_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(scim_config_id, external_id)
);

-- SCIM group memberships
CREATE TABLE scim_group_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scim_group_id UUID NOT NULL REFERENCES scim_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- External reference
    external_user_id VARCHAR(255),
    
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(scim_group_id, user_id)
);

-- SSO sessions
CREATE TABLE sso_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    sso_config_id UUID NOT NULL REFERENCES sso_configurations(id),
    
    -- Session info
    session_index VARCHAR(255), -- SAML session index
    
    -- Timing
    authenticated_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    logged_out_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Directory sync logs
CREATE TABLE directory_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    scim_config_id UUID REFERENCES scim_configurations(id),
    
    -- Sync details
    sync_type VARCHAR(50) NOT NULL, -- 'full', 'incremental', 'webhook'
    
    -- Results
    users_created INTEGER DEFAULT 0,
    users_updated INTEGER DEFAULT 0,
    users_deactivated INTEGER DEFAULT 0,
    groups_synced INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) NOT NULL, -- 'success', 'partial', 'failed'
    error_message TEXT,
    
    -- Timing
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sso_configurations_tenant ON sso_configurations(tenant_id);
CREATE INDEX idx_scim_configurations_tenant ON scim_configurations(tenant_id);
CREATE INDEX idx_external_identities_user ON external_identities(user_id);
CREATE INDEX idx_external_identities_provider ON external_identities(sso_config_id, provider_user_id);
CREATE INDEX idx_scim_groups_tenant ON scim_groups(tenant_id);
CREATE INDEX idx_scim_group_memberships_group ON scim_group_memberships(scim_group_id);
CREATE INDEX idx_scim_group_memberships_user ON scim_group_memberships(user_id);
CREATE INDEX idx_sso_sessions_user ON sso_sessions(user_id, is_active);
CREATE INDEX idx_directory_sync_logs_tenant ON directory_sync_logs(tenant_id, created_at DESC);
```

## API Endpoints

```
# SSO Configuration
GET    /api/sso/configurations            # List SSO configs
POST   /api/sso/configurations            # Create SSO config
GET    /api/sso/configurations/:id        # Get SSO config
PUT    /api/sso/configurations/:id        # Update SSO config
DELETE /api/sso/configurations/:id        # Delete SSO config

# SSO Metadata
GET    /api/sso/saml/metadata             # Get SP metadata
GET    /api/sso/oidc/.well-known/openid-configuration # OIDC discovery

# SSO Auth endpoints
GET    /api/sso/saml/login                # Initiate SAML login
POST   /api/sso/saml/acs                  # SAML assertion consumer
GET    /api/sso/saml/slo                  # Single logout
GET    /api/sso/oidc/authorize            # OIDC authorize
POST   /api/sso/oidc/callback             # OIDC callback

# SCIM Configuration
GET    /api/scim/configurations           # List SCIM configs
POST   /api/scim/configurations           # Create SCIM config
PUT    /api/scim/configurations/:id       # Update SCIM config
POST   /api/scim/configurations/:id/sync  # Trigger sync

# SCIM Inbound (for IdP)
GET    /scim/v2/Users                     # List users
POST   /scim/v2/Users                     # Create user
GET    /scim/v2/Users/:id                 # Get user
PUT    /scim/v2/Users/:id                 # Update user
PATCH  /scim/v2/Users/:id                 # Patch user
DELETE /scim/v2/Users/:id                 # Delete user
GET    /scim/v2/Groups                    # List groups
POST   /scim/v2/Groups                    # Create group
# ... similar for Groups

# Directory sync
GET    /api/directory/sync-logs           # Get sync logs
POST   /api/directory/sync                # Trigger manual sync

# Group mapping
GET    /api/directory/groups              # List synced groups
PUT    /api/directory/groups/:id/mapping  # Map to internal role
```

## UI Components

### Admin Dashboard Pages

1. **SSO Overview** (`/admin/sso`)
   - SSO status
   - Active sessions
   - Configuration summary

2. **SSO Configuration** (`/admin/sso/configure`)
   - Provider selection
   - SAML/OIDC setup wizard
   - Certificate management
   - Test connection

3. **Directory Sync** (`/admin/sso/directory`)
   - SCIM configuration
   - Sync status
   - Sync logs
   - Manual sync

4. **Group Mapping** (`/admin/sso/groups`)
   - Synced groups list
   - Map to roles/teams
   - Member preview

5. **Sessions** (`/admin/sso/sessions`)
   - Active sessions
   - Session management
   - Force logout

## Dependencies

- **Existing:** Users, Roles
- **Related:** RBAC
- **External:** Identity providers

## Security Considerations

- Certificate validation
- Token encryption
- Session security
- Replay protection
- Audit logging

## Success Metrics

| Metric | Target |
|--------|--------|
| SSO login success rate | > 99.9% |
| Sync accuracy | 100% |
| Provisioning latency | < 5 minutes |
| Deprovisioning compliance | 100% |

## Implementation Notes

### Phase 1: Basic SSO
- SAML support
- JIT provisioning
- Basic OIDC

### Phase 2: SCIM
- Inbound SCIM
- User provisioning
- Group sync

### Phase 3: Advanced
- SLO support
- Group → Role mapping
- Multiple IdPs

### Phase 4: Enterprise
- SCIM outbound
- Custom attributes
- Advanced mapping
